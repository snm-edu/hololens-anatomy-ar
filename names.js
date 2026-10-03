// 構造名（GLBのメッシュ名）→ 日本語名。atlas/index.html と同じ規則・同じ辞書を使う。
// 辞書本体は atlas/dict.js（window.ANAT_DICT）。読み込みはこのモジュールを使うページ側で行う。
// ⚠️ atlas/index.html にも同じ JP 表と normBase の写しがある。変えるときは両方そろえること。

const JP = [
  [/optic_nerve/i,'視神経'],[/optic_chiasm/i,'視交叉'],[/optic_tract/i,'視索'],[/optic_radiation/i,'視放線'],
  [/cornea/i,'角膜'],[/sclera/i,'強膜'],[/\biris/i,'虹彩'],[/pupil/i,'瞳孔'],[/_lens_|(^|_)lens/i,'水晶体'],
  [/retina/i,'網膜'],[/macula/i,'黄斑'],[/fovea/i,'中心窩'],[/vitreous/i,'硝子体'],[/ciliary/i,'毛様体'],
  [/optic_choroid|choroid/i,'脈絡膜'],[/eyelid/i,'眼瞼'],[/lacrimal/i,'涙器'],[/conjunctiva/i,'結膜'],
  [/extraocular/i,'外眼筋'],[/zonular|suspensory_ligament_of_lens/i,'チン小帯'],[/eyeball/i,'眼球'],
  [/liver|hepatic/i,'肝臓'],[/gallbladder/i,'胆嚢'],[/cystic_duct|bile/i,'胆管'],[/stomach|gastric/i,'胃'],
  [/duoden/i,'十二指腸'],[/jejun|jejen/i,'空腸'],[/ileum|ileoc/i,'回腸'],[/caecum|cecum/i,'盲腸'],
  [/appendix|vermiform/i,'虫垂'],[/colon/i,'結腸'],[/rectum|rectal/i,'直腸'],[/anus|anal/i,'肛門'],
  [/pancrea/i,'膵臓'],[/spleen|splenic/i,'脾臓'],[/esophag|oesophag/i,'食道'],[/intestin/i,'腸'],
  [/mesentery|mesocolon/i,'腸間膜'],[/omentum/i,'大網'],[/peritone/i,'腹膜'],
  [/kidney|renal/i,'腎臓'],[/ureter/i,'尿管'],[/bladder/i,'膀胱'],[/urethra/i,'尿道'],[/calyx|calyc/i,'腎杯'],
  [/uterus|uterine/i,'子宮'],[/ovary|ovarian/i,'卵巣'],[/vagina/i,'膣'],[/cervix|cervico/i,'子宮頸部'],
  [/uterine_tube|fallopian|salpinx/i,'卵管'],[/placenta/i,'胎盤'],[/umbilical/i,'臍帯'],[/mammary/i,'乳腺'],
  [/heart|myocard/i,'心臓'],[/atrium/i,'心房'],[/interventricular|ventricle_of_heart/i,'心室'],
  [/aorta|aortic/i,'大動脈'],[/vena_cava|_cava/i,'大静脈'],[/coronary/i,'冠動脈'],[/portal/i,'門脈'],
  [/artery|arterial/i,'動脈'],[/vein|venous/i,'静脈'],[/valve/i,'弁'],
  [/lung/i,'肺'],[/bronch/i,'気管支'],[/trachea/i,'気管'],[/larynx/i,'喉頭'],[/pharynx/i,'咽頭'],
  [/pleura/i,'胸膜'],[/diaphragm/i,'横隔膜'],[/alveol/i,'肺胞'],[/thyroid_cartilage/i,'甲状軟骨'],
  [/cerebell/i,'小脳'],[/brain|cerebr/i,'大脳'],[/spinal_cord/i,'脊髄'],[/thalamus/i,'視床'],
  [/hypothalam/i,'視床下部'],[/ventricle/i,'脳室'],[/nucleus/i,'神経核'],[/nerve/i,'神経'],
  [/femur|femoral/i,'大腿骨'],[/patella/i,'膝蓋骨'],[/tibia/i,'脛骨'],[/fibula/i,'腓骨'],
  [/pelvi|hip_bone/i,'骨盤'],[/ilium/i,'腸骨'],[/ischium/i,'坐骨'],[/pubis/i,'恥骨'],
  [/vertebra/i,'椎骨'],[/sacrum/i,'仙骨'],[/coccyx/i,'尾骨'],[/_rib|costal/i,'肋骨'],[/sternum/i,'胸骨'],
  [/cruciate|meniscus|_knee/i,'膝関節'],[/cartilage/i,'軟骨'],[/ligament/i,'靭帯'],
  [/adrenal|suprarenal_gland/i,'副腎'],[/lymph|^yao_/i,'リンパ'],[/thymus/i,'胸腺'],
  [/rectus_femoris|quadriceps/i,'大腿四頭筋'],[/(^|_)skin$/i,'皮膚'],[/_fat_/i,'脂肪'],
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
export function jpName(raw){ const a=anat(raw); if(a) return a.jp; for(const [re,jp] of JP){ if(re.test(raw)) return jp; } return null; }

export function humanize(raw){
  let s = raw.replace(/^VH_F_/,'').replace(/^Allen_/,'').replace(/^Yao_/,'').replace(/\.(l|r|el|er|ol|or|j|i)$/i,' $1')
    .replace(/[_]/g,' ').trim();
  s = s.replace(/\bleft\b/ig,'左').replace(/\bright\b/ig,'右').replace(/\s\.l$/i,' (左)').replace(/\s\.r$/i,' (右)').replace(/\s(l|r)$/i,(m,p)=> p.toLowerCase()==='l'?' (左)':' (右)');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
