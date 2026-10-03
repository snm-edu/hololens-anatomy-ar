// 構造名（GLBのメッシュ名）→ 日本語名。辞書本体は atlas/dict.js（window.ANAT_DICT）で、
// 読み込みはこのモジュールを使うページ側で行う。normBase は atlas/index.html と同じ規則。
//
// 辞書に無い名前の扱い（2026-10-03 変更）:
//   以前は atlas と同じく「名前のどこかに含まれる語」で臓器名を当てていたが、男性標本では
//   epigastric artery→胃、central canal of spinal cord→肛門、fibularis brevis→腓骨、
//   flexor retinaculum→網膜 のように誤った名前を大量に出していた（1,821部位中1,296件が推測）。
//   教材で誤った名前を出すより、確かなことだけ出す:
//     1) 名前全体が既知の臓器名と一致 → その日本語名
//     2) 「〜 of 臓器」（part/wall/cavity…）→「臓器（一部）」
//     3) 最後の語（その部位の種類を表す名詞）→ ［動脈］のような種類だけ
//     4) どれでもない → null（札には英語名だけ出る）
// ⚠️ atlas/index.html には古い推測表（JP）が残っている。あちらも同じ誤りを出しうる。

import TABLE from './names_ja.js?v=8';   // 男性標本の全1,659種類の和名表（最優先）

// 名前全体（normBase 後）が一致したときだけ使う臓器・構造名
const EXACT = {
  'liver':'肝臓','stomach':'胃','spleen':'脾臓','pancreas':'膵臓','esophagus':'食道','oesophagus':'食道',
  'duodenum':'十二指腸','jejunum':'空腸','ileum':'回腸','cecum':'盲腸','caecum':'盲腸','appendix':'虫垂',
  'vermiform appendix':'虫垂','ascending colon':'上行結腸','transverse colon':'横行結腸','descending colon':'下行結腸',
  'sigmoid colon':'S状結腸','rectum':'直腸','anal canal':'肛門管','gallbladder':'胆嚢','urinary bladder':'膀胱',
  'urethra':'尿道','kidney':'腎臓','ureter':'尿管','prostate':'前立腺','testis':'精巣','heart':'心臓',
  'trachea':'気管','larynx':'喉頭','pharynx':'咽頭','lung':'肺','diaphragm':'横隔膜','thymus':'胸腺',
  'thyroid gland':'甲状腺','adrenal gland':'副腎','suprarenal gland':'副腎','brain':'脳','cerebellum':'小脳',
  'spinal cord':'脊髄','thalamus':'視床','hypothalamus':'視床下部','optic nerve':'視神経','optic chiasm':'視交叉',
  'optic tract':'視索','optic radiation':'視放線','cornea':'角膜','sclera':'強膜','iris':'虹彩','lens':'水晶体',
  'retina':'網膜','vitreous body':'硝子体','choroid':'脈絡膜','eyeball':'眼球','femur':'大腿骨','patella':'膝蓋骨',
  'tibia':'脛骨','fibula':'腓骨','sacrum':'仙骨','coccyx':'尾骨','sternum':'胸骨','hip bone':'寛骨','skin':'皮膚',
  'aorta':'大動脈','abdominal aorta':'腹大動脈','descending thoracic aorta':'胸大動脈',
  'superior vena cava':'上大静脈','inferior vena cava':'下大静脈','portal vein':'門脈','tongue':'舌',
  'uterus':'子宮','ovary':'卵巣','vagina':'膣','placenta':'胎盤','mesentery':'腸間膜','greater omentum':'大網',
  'pituitary gland':'下垂体','pineal gland':'松果体','lacrimal gland':'涙腺','hyoid bone':'舌骨','frontal bone':'前頭骨',
  'occipital bone':'後頭骨','parietal bone':'頭頂骨','temporal bone':'側頭骨','sphenoid bone':'蝶形骨',
  'ethmoid bone':'篩骨','mandible':'下顎骨','maxilla':'上顎骨','clavicle':'鎖骨','scapula':'肩甲骨',
  'humerus':'上腕骨','radius':'橈骨','ulna':'尺骨','calcaneus':'踵骨','talus':'距骨','manubrium of sternum':'胸骨柄',
  'xiphoid process':'剣状突起','cerebrum':'大脳','pons':'橋','medulla oblongata':'延髄','midbrain':'中脳',
};
const ORD = {first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12};
const VERT = {cervical:'頸椎',thoracic:'胸椎',lumbar:'腰椎'};
// 「X of 臓器」で臓器の一部と言える X
const PART_OF = /^(part|proximal part|middle part|distal part|wall|cavity|body|lobe|parenchyma|apex|base|segment)\b.* of (.+)$/;
// 種類を表す語（「A of B」なら A の最後の語）→ 種類。複数語のものを先に置く
const HEAD = [
  [/bronchial tree$|bronchus$|bronchi$/,'気管支'], [/arteries$|artery$/,'動脈'], [/veins$|vein$/,'静脈'],
  [/nerves$|nerve$/,'神経'], [/ganglion$|ganglia$/,'神経節'], [/ligaments?$/,'靭帯'], [/tendons?$/,'腱'],
  [/cartilages?$/,'軟骨'], [/vertebra$/,'椎骨'], [/ribs?$/,'肋骨'], [/bones?$/,'骨'], [/muscles?$/,'筋'],
  [/valve$/,'弁'], [/cusp$|leaflet$/,'弁尖'], [/ducts?$/,'管'], [/glands?$/,'腺'], [/lymph nodes?$/,'リンパ節'],
  [/sinus$/,'洞'], [/membrane$/,'膜'], [/nucleus$/,'神経核'], [/gyrus$/,'脳回'], [/sulcus$/,'脳溝'],
];

// 拡充辞書(dict.js=509構造の日本語名+定義文)を基語キーで参照。dump_base.pyのbase()と同一正規化。
export function normBase(name){
  let s = name.replace(/^(VH_F_|Allen_|Yao_)/,'');
  s = s.replace(/_/g,' ').trim().toLowerCase();
  s = s.replace(/\b(left|right)\b/g,'');
  s = s.replace(/\s+(l|r|a|b|c|d|e|f|g|h|i|j|[0-9]+)$/,'');
  s = s.replace(/\s+/g,' ').trim();
  return s;
}
const ANAT = (typeof window!=='undefined' && window.ANAT_DICT) ? window.ANAT_DICT : {};
function anat(name){ return ANAT[normBase(name)] || null; }

// 確かな日本語名（辞書か、名前全体が既知の構造名）。無ければ null
export function jpName(raw){
  const a=anat(raw); if(a) return a.jp;
  const k=normBase(raw);
  if(EXACT[k]) return EXACT[k];
  const m=k.match(PART_OF); if(m && EXACT[m[2]]) return EXACT[m[2]]+'（一部）';
  let v=k.match(/^(\w+) (cervical|thoracic|lumbar) vertebra$/); if(v && ORD[v[1]]) return `第${ORD[v[1]]}${VERT[v[2]]}`;
  v=k.match(/^(\w+) rib$/); if(v && ORD[v[1]]) return `第${ORD[v[1]]}肋骨`;
  return null;
}
// 種類だけ（例: ［動脈］）。jpName が null のときの補助。分からなければ null
//   英語の解剖学名は「A of B」なら A が種類（artery of central sulcus は動脈であって脳溝ではない）。
//   A が「枝・支流・幹・集まり」なら B の種類を使う（branch of X artery → 動脈）。
const RELAY = /(^| )(branch|branches|tributary|tributaries|trunk|set|group)$/;
export function jpKind(raw){
  let k=normBase(raw);
  for(let guard=0; guard<4; guard++){
    const i=k.indexOf(' of ');
    const head = k.split(/ of | to /)[0];   // 「X artery to Y gyrus」の種類も動脈
    for(const [re,jp] of HEAD){ if(re.test(head)) return jp; }
    if(i<0 || !RELAY.test(head)) return null;
    k=k.slice(i+4);
  }
  return null;
}

// 札の大きい文字。確かな名前には左右を付ける（名前が left_/right_ で始まるときだけ。
//   「posterior vein of left ventricle」の left は心室の左右であって部位の左右ではない）。
//   種類しか分からないときは ［動脈］ のように角かっこで「固有名ではない」ことを示す。
export function labelName(raw){
  // 和名表はメッシュ名（分割の連番 _2 _3 … を外したもの）で引く。左右も表の名前に含まれている
  const t=TABLE[raw.replace(/_[0-9]+$/,'')]; if(t) return t;
  const jp=jpName(raw);
  if(jp){
    // 女性の脳（Allen_…_L / _R）は左右が末尾に付く
    const side = (/^(VH_F_)?left_/i.test(raw) || /^Allen_.*_L$/.test(raw)) ? '左'
               : (/^(VH_F_)?right_/i.test(raw) || /^Allen_.*_R$/.test(raw)) ? '右' : '';
    return (side && !/^[左右]/.test(jp)) ? side+jp : jp;
  }
  const kind=jpKind(raw);
  return kind ? `［${kind}］` : null;
}

export function humanize(raw){
  let s = raw.replace(/^VH_F_/,'').replace(/^Allen_/,'').replace(/^Yao_/,'').replace(/\.(l|r|el|er|ol|or|j|i)$/i,' $1')
    .replace(/[_]/g,' ').trim();
  s = s.replace(/\bleft\b/ig,'左').replace(/\bright\b/ig,'右').replace(/\s\.l$/i,' (左)').replace(/\s\.r$/i,' (右)').replace(/\s(l|r)$/i,(m,p)=> p.toLowerCase()==='l'?' (左)':' (右)');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
