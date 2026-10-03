// 共有ルームの中継先。Cloudflare Worker をデプロイしたら、ここのURLを差し替える。
//
// 空文字のあいだ同期機能は完全に無効（既存のビューアは何も変わらず動く）。
// URLに ?sync=ws://localhost:8787 を付けると一時的に上書きできる（ローカル検証用）。
// 中継サーバ（Cloudflare Workers）。worker/ を wrangler deploy して発行する。
//
// 学校アカウント(info@snm.ac.jp)の中継。2026-09-11 に個人アカウント側から戻した。
//
// 経緯: 2026-07-21 に学校アカウントへデプロイした直後、改名(long-wood-63b5 → snm-edu)の途中で
//   サブドメインが DNS から消え、個人アカウント(iryopapa-jp)へ一時避難していた。
//   2026-09-11 に確認すると学校アカウントのサブドメインは `restless-dew-5467` になっており、
//   DNS で引けて応答することを確かめたうえで戻した（`snm-edu` は今も引けない）。
//
// ⚠️ この中継は 2026-09-11 から**認証つき**（worker/README.md「認証」）。
//   教員はライセンス付きでないと部屋を開けず、学生は教員が開いた部屋にしか入れない。
//   room.js はまだライセンスを送れないので、Web版で「先生」役はできない（学生役なら部屋番号だけで入れる）。
//   Web版・HL2 を戻すときは worker/test-client.mjs 冒頭の注記を参照。
export const SYNC_URL = 'wss://anatomy-sync.restless-dew-5467.workers.dev';

// 上書き込みの解決とルーム設定の読み取りを1か所に集約する。
export function readRoomParams() {
  const q = new URLSearchParams(location.search);
  const url = q.get('sync') || SYNC_URL;
  const room = (q.get('room') || '').trim();
  const roleParam = (q.get('role') || '').trim().toLowerCase();
  const role = roleParam.startsWith('p') ? 'presenter' : roleParam.startsWith('f') ? 'follower' : '';
  return { url, room, role, enabled: !!url };
}
