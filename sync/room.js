// 共有ルーム クライアント（依存ゼロ・素のWebSocket）
//
// 設計の要点:
//  - 差分でなく毎回「全量スナップショット」を送る。取りこぼしても次の1通で復旧し、
//    途中参加者は中継側が保持した最新スナップショットだけで追いつける。
//  - HoloLens 2 のブラウザはスリープやバックグラウンドで容赦なく切れるため、
//    25秒ごとのpingと指数バックオフ再接続を前提にする。
//
// 使い方:
//   const room = createRoom({ url, room:'AB12CD', onStatus, onPose, onState, onRole, onError });
//   room.claim();               // 操作権を取る
//   room.sendPose({...});       // 発表者のみ（中継側でも発表者以外は捨てる）

const PING_MS = 25000;
const BACKOFF = [500, 1000, 2000, 4000, 8000, 15000];
const WAIT_OPEN_MS = 20000;   // 教員が部屋を開くのを待つ間の再試行間隔

export function createRoom(opts) {
  const { url, room, onStatus, onPose, onState, onRole, onError } = opts;
  let ws = null;
  let myId = null;
  let presenterId = null;
  let attempt = 0;
  let pingTimer = null;
  let reconnectTimer = null;
  let closed = false;
  let wantClaim = false;

  const status = (s, detail) => { try { onStatus && onStatus(s, detail); } catch {} };

  function connect() {
    if (closed) return;
    myId = null; presenterId = null;
    clearTimeout(reconnectTimer);
    status(attempt === 0 ? 'connecting' : 'reconnecting');

    const u = url.replace(/\/+$/, '') + '/?room=' + encodeURIComponent(room);
    try { ws = new WebSocket(u); } catch (e) { scheduleReconnect(); return; }

    ws.onopen = () => {
      if (closed) return;
      attempt = 0;
      status('open');
      clearInterval(pingTimer);
      pingTimer = setInterval(() => { try { ws.send('{"k":"ping"}'); } catch {} }, PING_MS);
      if (wantClaim) { try { ws.send('{"k":"claim"}'); } catch {} }
    };

    ws.onmessage = (ev) => {
      if (closed) return;
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (!m || typeof m !== 'object' || Array.isArray(m)) return;
      if (m.k === 'hello') {
        myId = m.id; presenterId = m.presenter || null;
        try { onRole && onRole(isPresenter(), presenterId); } catch {}
      } else if (m.k === 'role') {
        presenterId = m.presenter || null;
        try { onRole && onRole(isPresenter(), presenterId); } catch {}
      } else if (m.k === 'pose') {
        if (!isPresenter()) { try { onPose && onPose(m.d); } catch {} }
      } else if (m.k === 'state') {
        if (!isPresenter()) { try { onState && onState(m.d); } catch {} }
      } else if (m.k === 'error') {
        // 中継が断った理由（worker.js）。not-teacher＝ライセンスの無い端末が操作権を求めた。
        //   何度求めても通らないので、再接続のたびに claim を送り直すのをやめる。
        const code = typeof m.code === 'string' ? m.code : 'unknown';
        if (code === 'not-teacher' || code === 'bad-license') wantClaim = false;
        try { onError && onError(code); } catch {}
      }
    };

    // 中継の拒否コード（worker.js）: 4404=教員がまだ部屋を開いていない → ゆっくり待ち続ける
    //   （学生が先にQRを見ても、先生が開いた時点で入れる）。4400=部屋名が不正 / 4401=ライセンス無効
    //   → 何度やっても通らないので止める（止めないと全端末が叩き続ける）。
    ws.onclose = (ev) => {
      clearInterval(pingTimer);
      myId = null; presenterId = null;
      if (closed) return;
      try { onRole && onRole(false, null); } catch {}
      const code = ev && ev.code;
      if (code === 4404) { status('waiting'); reconnectTimer = setTimeout(connect, WAIT_OPEN_MS); return; }
      if (code >= 4400 && code < 4500) { closed = true; status('rejected', String(code)); return; }
      scheduleReconnect();
    };
    ws.onerror = () => { try { ws.close(); } catch {} };
  }

  function scheduleReconnect() {
    if (closed) return;
    status('closed');
    const wait = BACKOFF[Math.min(attempt, BACKOFF.length - 1)];
    attempt++;
    reconnectTimer = setTimeout(connect, wait);
  }

  const isPresenter = () => live() && !!myId && presenterId === myId;
  const live = () => !closed && !!ws && ws.readyState === 1;
  const send = (o) => { if (live()) { try { ws.send(JSON.stringify(o)); } catch {} } };

  connect();

  return {
    get id() { return myId; },
    get presenterId() { return presenterId; },
    isPresenter,
    isConnected: live,
    claim() { wantClaim = true; send({ k: 'claim' }); },
    release() { wantClaim = false; },
    // 送るのは自分が発表者のときだけ。発表者不在(null)でも送ると、先生が切れた瞬間に
    //   部屋の全端末が毎秒12通を送り始める（中継は発表者以外を捨てるので全部無駄になる）。
    sendPose(d) { if (isPresenter()) send({ k: 'pose', d }); },
    sendState(d) { if (isPresenter()) send({ k: 'state', d }); },
    close() { closed = true; myId = null; presenterId = null; clearInterval(pingTimer); clearTimeout(reconnectTimer); try { ws && ws.close(); } catch {} },
  };
}
