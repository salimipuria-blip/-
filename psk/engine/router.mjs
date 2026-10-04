import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Function words (Persian formal + colloquial, Finglish, English) that never carry routing signal.
const STOP = new Set(('و در از به برای با که را این آن یک یا تا هم من تو ما شما خود روی اگر است می کنم کن انجام بده لطفا لطفاً چه چطور میخواهم میخوام بنویس '+
 'یه رو ها های ام ای ات اش ی برام واسه واسم کنید بکن میشه باشه نباشه بشه دارم داره هست هستش وقتی میگه مثل چی بدم بدین بدید خیلی یکی همه هر دربیار بنویسید کرد شده شود ترین تر '+
 'baraye barayeh benevis besaz kon bokon konid yek ye too tu ba va ro az dar be ke monaseb mikham lotfan chi '+
 'want need please the a an and for my to in of create make do i you me it on use when or with that from this your our gets get is are be how what new about into some at by as').split(' '));

// Persian → English bridges so Persian requests reach English-named skills (and English
// descriptions). Values may list several English forms; all are tried, the best one counts.
const BRIDGES = {
 'استوری':'story','اینستاگرام':'instagram','اینستا':'instagram','طراحی':'design','تصویر':'image','عکس':'photo',
 'ویدیو':'video','ویدئو':'video','فیلم':'video','سایت':'website','وبسایت':'website','وب':'web','تحقیق':'research',
 'پژوهش':'research','فروش':'sales','مشتری':'customer','تحلیل':['analytics','analysis','analyzer'],'داده':'data','اکسل':['excel','xlsx'],
 'مهارت':'skill','سناریو':['scenario','script'],'اتوماسیون':'automation','کد':'code','لوگو':'logo','رنگ':'color',
 'کسب':'business','محتوا':'content','محتوایی':'content','عسل':'honey','کافه':'cafe','سفر':['travel','itinerary'],'قیمت':'price',
 'قیمتگذاری':'pricing','موبایل':'mobile','پوستر':'poster','بنر':'banner','کپشن':'caption','ریلز':['reels','reel'],'پست':'post',
 'تبلیغ':'ad','تبلیغات':'ads','تبلیغاتی':['ad','promo'],'ایمیل':'email','خبرنامه':'newsletter','فروشگاه':['shop','store'],
 'فروشگاهی':'ecommerce','جدول':'sheet','گزارش':['report','reporter'],'داشبورد':'dashboard','پرامپت':'prompt','ایجنت':'agent',
 'عامل':'agent','برند':'brand','هویت':'identity','فونت':'font','تایپوگرافی':'typography','ارائه':'presentation',
 'اسلاید':'slides','لندینگ':'landing','سئو':'seo','کمپین':'campaign','تقویم':'calendar','منو':'menu','منوی':'menu',
 'رستوران':'restaurant','هتل':'hotel','عروسی':'wedding','دندانپزشکی':'dental','دندانپزشک':'dental','دندان':'dental',
 'کلینیک':'clinic','مطب':'clinic','آموزش':'tutorial','آموزشی':['tutorial','educational'],'ترجمه':'translate','خلاصه':['summary','summarizer'],
 'مقاله':'article','وبلاگ':'blog','کاروسل':'carousel','تامنیل':'thumbnail','یوتیوب':'youtube','تیک':'tiktok',
 'لینکدین':'linkedin','هشتگ':'hashtag','بایو':'bio','بروشور':'brochure','ویزیت':'business','دعوت':'invitation',
 'لیبل':'label','برچسب':'label','بسته‌بندی':'packaging','بستهبندی':'packaging','شعار':['slogan','tagline'],'تخفیف':'discount',
 'نوروز':'nowruz','نوروزی':'nowruz','یلدا':'yalda','یلدای':'yalda','ووکامرس':'woocommerce','وردپرس':'wordpress',
 'فرمول':'formula','فاکتور':'invoice','صورتحساب':'invoice','ماهانه':'monthly','هفتگی':'weekly','موجودی':'inventory',
 'انبار':'inventory','انبارداری':'inventory','شمسی':'jalali','میلادی':'gregorian','محصول':'product','غذا':'food',
 'نور':'lighting','نورپردازی':'lighting','ماکرو':'macro','جواهر':'jewelry','جواهرات':'jewelry','طلا':'jewelry',
 'زعفران':'saffron','تور':'tour','گردشگر':'tourist','گردشگری':'tourism','اسکریپت':'script','زیرنویس':['subtitle','captions'],
 'نریشن':['voiceover','narration'],'تیزر':'teaser','پادکست':'podcast','رقبا':'competitor','رقیب':'competitor',
 'کامنت':['comment','نظر','نظرات'],'دایرکت':'dm','پروپوزال':'proposal','انسانی':['human','humanizer'],'صورتجلسه':'meeting','جلسه':'meeting',
 'ویس':'voice','رونویسی':'transcribe','بازنویسی':'rewrite','بهتر':['improve','optimizer'],'بهبود':'improve',
 'چتبات':'chatbot','سیستم':'system','منفی':'negative','مثبت':'positive','پشتیبانی':'support','ایده':'ideas','بصری':'visual','وکتور':'vector','گرافیک':'graphic',
 'انیمیشن':'animation','موشن':'motion','قالب':'template','چکلیست':'checklist','پیامک':'sms','واتساپ':'whatsapp','تلگرام':'telegram'
};

// Finglish (Persian typed in Latin letters) → Persian; the Persian form then uses BRIDGES too.
const FINGLISH = {
 tarahi:'طراحی',tarrahi:'طراحی',gozaresh:'گزارش',foroosh:'فروش',forosh:'فروش',forush:'فروش',mahane:'ماهانه',maahane:'ماهانه',
 haftegi:'هفتگی',senario:'سناریو',senaryo:'سناریو',moarefi:'معرفی',javaheri:'جواهر',javaher:'جواهر',tala:'طلا',behtar:'بهتر',
 aks:'عکس',akse:'عکس',ax:'عکس',mahsool:'محصول',mahsul:'محصول',taghvim:'تقویم',taqvim:'تقویم',mohtava:'محتوا',mohtavayi:'محتوا',
 mohtavaei:'محتوا',mohtavaii:'محتوا',factor:'فاکتور',faktor:'فاکتور',shomare:'شماره',khodkar:'خودکار',barname:'برنامه',
 barnameh:'برنامه',barnamerizi:'برنامه',safar:'سفر',zirnevis:'زیرنویس',farsi:'فارسی',takhfif:'تخفیف',tabligh:'تبلیغ',
 tablighat:'تبلیغات',tablighati:'تبلیغاتی',matn:'متن',dandanpezeshki:'دندانپزشکی',dandoonpezeshki:'دندانپزشکی',
 dandanpezeshk:'دندانپزشک',kafe:'کافه',kafeh:'کافه',insta:'اینستاگرام',estori:'استوری',rils:'ریلز',kapshen:'کپشن',
 hashtagh:'هشتگ',sait:'سایت',eksel:'اکسل',porompt:'پرامپت',vidio:'ویدیو',shoar:'شعار',hoviat:'هویت',hoviyat:'هویت',
 kart:'کارت',davat:'دعوت',arusi:'عروسی',aroosi:'عروسی',tor:'تور',gheymat:'قیمت',qeymat:'قیمت',moshtari:'مشتری',
 kament:'کامنت',dayrekt:'دایرکت',tahlil:'تحلیل',raghib:'رقیب',reghabat:'رقبا',roghaba:'رقبا',khabarname:'خبرنامه',
 imeil:'ایمیل',maghale:'مقاله',foroshgah:'فروشگاه',forooshgah:'فروشگاه',zaferan:'زعفران',zafaran:'زعفران',
 jalase:'جلسه',jaleseh:'جلسه',kholase:'خلاصه',padkast:'پادکست',tamnil:'تامنیل',vois:'ویس',
 menoo:'منو',menu:'منو',post:'پست',bio:'بایو',brand:'برند',logo:'لوگو',poster:'پوستر',landing:'لندینگ',
 site:'سایت',reels:'ریلز',story:'استوری',caption:'کپشن',hashtag:'هشتگ',excel:'اکسل',prompt:'پرامپت',
 clinic:'کلینیک',kelinik:'کلینیک',tour:'تور',cafe:'کافه',video:'ویدیو',youtube:'یوتیوب',dashboard:'داشبورد',
 shiraz:'شیراز',esfahan:'اصفهان',isfahan:'اصفهان',kavir:'کویر',
 sefid:'سفید',moshkel:'مشکل',khadamat:'خدمات',daramad:'درآمد',hazine:'هزینه',hazineh:'هزینه',
 logoo:'لوگو',bastebandi:'بسته‌بندی',label:'لیبل',brochure:'بروشور',borooshor:'بروشور',vizit:'ویزیت',
 amoozesh:'آموزش',amoozeshi:'آموزشی',ide:'ایده',ideh:'ایده',podcast:'پادکست',
 email:'ایمیل',sms:'پیامک',payamak:'پیامک',seo:'سئو',maghaleh:'مقاله',weblog:'وبلاگ'
};

// Colloquial spellings → the written form used in skill triggers.
const COLLOQUIAL = {'گرونه':['گرانه','گران'],'گرون':'گران','ارزون':'ارزان','بزار':'بگذار','میخوام':'میخواهم','اینو':'این','کافهام':'کافه','جواب':'پاسخ'};

// Persian inflection: candidate suffixes/prefixes; a query word is reduced only to forms the index knows.
const Q_SUFFIXES=['هایی','هایم','هایت','هایش','هامون','های','ها','ترین','تر','یی','ای','ی','ام','ات','اش','مان','تان','شان','ان','ش','م','ه'];
const Q_PREFIXES=['نمی','می','ب'];
// Registry-side stemming stays conservative (plural/possessive only).
const SUFFIX = /(هایی|های|ها|ای|ی)$/u;
// Words in skill names that describe the *form* of a skill rather than its subject.
const NAME_FILLER = new Set('fa kit pack generator builder planner maker writer designer tool tools skill skills guide template templates library assistant workflow autopilot monitor reporter analyzer optimizer auditor'.split(' '));
// Domain-templated derivative skills ("cafe-slogan-workflow"): generic boilerplate bodies.
const TEMPLATED = /برای حوزهٔ|برای حوزه /u;

const asList=v=>v==null?[]:Array.isArray(v)?v:[v];
const DIGITS={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
function baseNormalize(v,keepZwnj){
 let s=String(v||'').toLowerCase().normalize('NFKC').replace(/[أإآ]/g,'ا').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ة/g,'ه')
  .replace(/[۰-۹٠-٩]/g,d=>DIGITS[d]).replace(/[ً-ٰٟ‏‪-‮]/g,'');
 s=keepZwnj?s.replace(/[^\p{L}\p{N}‌]+/gu,' ').replace(/‌*( |$)‌*/g,'$1').replace(/^‌+/,''):s.replace(/‌/g,'').replace(/[^\p{L}\p{N}]+/gu,' ');
 return s.replace(/\s+/g,' ').trim();
}
export function normalize(v) { return baseNormalize(v,false); }

const keep=s=>s.length>1&&!STOP.has(s);
function stem(w){const s=w.length>4?w.replace(SUFFIX,''):w;return s!==w&&s.length>1?s:null;}
/** Bridged / transliterated / colloquial alternatives of one word (not recursive beyond one Persian hop). */
function aliases(w){
 const out=[];
 for(const c of asList(COLLOQUIAL[w]))out.push(c);
 for(const p of asList(FINGLISH[w]))out.push(p);
 for(const x of [w,...out])for(const e of asList(BRIDGES[x]))out.push(e);
 return out.filter(x=>x!==w);
}

/** Words of a text: ZWNJ compounds give the joined form plus their parts. */
function wordsOfKept(kept){
 const out=[];
 for(const raw of kept.split(' ')){
   if(!raw)continue;const joined=raw.replace(/\u200c/g,'');
   const parts=raw.includes('\u200c')?raw.split('\u200c').filter(keep):[];
   if(keep(joined)||parts.length)out.push({joined,parts});
 }
 return out;
}
const words=v=>wordsOfKept(baseNormalize(v,true));

// Every surface word expands to itself, its conservative stem and its bridged aliases (memoized).
const EXPANSIONS=new Map();
function expandWord(w){
 let e=EXPANSIONS.get(w);if(e)return e;
 const out=new Set([w]);const s=stem(w);if(s)out.add(s);
 for(const x of [w,s])if(x)for(const a of aliases(x))out.add(a);
 e=[...out];EXPANSIONS.set(w,e);return e;
}
function addTerms(ws,into){for(const {joined,parts} of ws)for(const w of [joined,...parts])if(keep(w))for(const t of expandWord(w))into.add(t);return into;}

export function tokens(v) { return [...addTerms(words(v),new Set())]; }

function frontmatterDescription(text){
 const m=/^---\s*\n([\s\S]*?)\n---/.exec(text);if(!m)return '';
 const d=/^description:\s*(.*)$/m.exec(m[1]);if(!d)return '';
 return d[1].trim().replace(/^["']|["']$/g,'').slice(0,600);
}

/** Canonical key of a word for adjacency (bigram) matching. */
const canon=w=>stem(w)||w;
function addBigrams(ws,into){
 let prev=null;
 for(const {joined,parts} of ws){
   if(!keep(joined))continue;
   const c=canon(joined);if(prev)into.add(prev+' '+c);prev=c;
   for(let i=1;i<parts.length;i++)into.add(canon(parts[i-1])+' '+canon(parts[i]));
 }
}

/**
 * Load the metadata registry. With `skillsRoot`, every SKILL.md body is read and checked
 * against the registry's SHA-256 id (or the explicit repaired allowlist). Only verified bodies
 * are kept as `content`; their frontmatter description also enriches routing terms.
 */
export function loadRegistry(filename,{skillsRoot=null,repairedFile=null}={}) {
 const raw=JSON.parse(fs.readFileSync(filename,'utf8'));
 if(!Array.isArray(raw.skills)||raw.skills.length===0)throw Error('Invalid skill registry');
 const repaired=repairedFile&&fs.existsSync(repairedFile)?JSON.parse(fs.readFileSync(repairedFile,'utf8')).repaired||{}:{};
 const records=[],index=new Map(),content={verified:0,repaired:0,missing:0,rejected:0};
 const root=skillsRoot?fs.realpathSync(skillsRoot):null;
 for(const r of raw.skills){
   if(!r.skill_id||!r.name||!Array.isArray(r.triggers))continue;
   const record={id:r.skill_id,name:r.name,domain:r.domain||'general',triggers:r.triggers,source_path:r.source_path||null,content:null,contentStatus:'missing',description:''};
   if(root){const v=verifySkillFile(root,record,repaired[r.name]);record.contentStatus=v.status;content[v.status]++;
     if(v.text){record.content=v.text;record.description=frontmatterDescription(v.text);}}
   else content.missing++;
   // Field-separated terms: the name is the strongest signal, then triggers, then the description.
   // Each text is normalized once and feeds terms, bigrams and whole-phrase matching.
   const nameText=r.name.replace(/-/g,' ');
   const kept=[r.name,r.domain,...r.triggers].map(t=>baseNormalize(t,true));
   const nameWords=words(nameText),descWords=words(record.description);
   const triggerWords=kept.slice(1).map(wordsOfKept);
   record.nameTerms=addTerms(nameWords,new Set());
   record.triggerTerms=new Set();for(const ws of triggerWords)addTerms(ws,record.triggerTerms);
   record.descTerms=addTerms(descWords,new Set());
   record.nameCore=[...new Set(nameWords.map(w=>w.joined).filter(w=>keep(w)&&!NAME_FILLER.has(w)))];
   record.templated=TEMPLATED.test(r.triggers.join(' ')+' '+record.description);
   const tk=new Set([...record.nameTerms,...record.triggerTerms,...record.descTerms]);
   record.terms=tk;record.phrases=kept.map(k=>k.replace(/\u200c/g,''));
   record.bigrams=new Set();for(const ws of [nameWords,...triggerWords.slice(1),descWords])addBigrams(ws,record.bigrams);
   const n=records.push(record)-1;
   for(const term of tk){if(!index.has(term))index.set(term,[]);index.get(term).push(n);}
 }
 const idf=new Map();for(const [term,list] of index)idf.set(term,Math.log(1+records.length/list.length));
 return {records,index,idf,content,declaredSkills:raw.counts?.skills,declaredTriggers:raw.counts?.triggers};
}

// Imported SKILL.md is untrusted instruction data. It is hashed and read, never executed.
function verifySkillFile(root,record,repairedEntry){
 if(!record.source_path)return {status:'missing'};
 const relative=record.source_path.replace(/^mega-skills-3000\//,'');
 const candidate=path.resolve(root,relative);
 if(!candidate.startsWith(root+path.sep))return {status:'rejected',reason:'path traversal'};
 try{
   const real=fs.realpathSync(candidate);
   if(!real.startsWith(root+path.sep))return {status:'rejected',reason:'symlink escape'};
   const stat=fs.statSync(real);if(!stat.isFile()||stat.size>65536)return {status:'rejected',reason:'invalid skill file size'};
   const data=fs.readFileSync(real);const digest='sha256:'+crypto.createHash('sha256').update(data).digest('hex');
   const text=data.toString('utf8');if(!text.trim())return {status:'rejected',reason:'empty skill'};
   if(digest===record.id)return {status:'verified',text};
   if(repairedEntry&&repairedEntry.registry_id===record.id&&repairedEntry.repaired_sha256===digest)return {status:'repaired',text};
   return {status:'rejected',reason:'SHA-256 differs from registry; not trusted'};
 }catch(e){return {status:e.code==='ENOENT'?'missing':'rejected',reason:e.message};}
}

// Tunable weights (measured with scripts/eval-router.mjs; see docs/QA_REPORT.md).
const W={field:{name:1,trigger:0.85,desc:0.7},alias:0.85,stem:0.9,part:0.85,split:0.8,
 coverage:1.6,nameCover:0.45,bigram:0.18,bigramMax:0.45,phrase:1,nameInQuery:0.6,templated:0.82,domainScale:0.5};

/** Reduce an unknown inflected query word to forms present in the index. */
function vocabularyForms(w,index){
 const out=[];
 for(const p of ['',...Q_PREFIXES]){
   if(p&&!w.startsWith(p))continue;const b=w.slice(p.length);
   for(const s of ['',...Q_SUFFIXES]){
     if(s&&!b.endsWith(s))continue;const f=b.slice(0,b.length-s.length);
     if(f.length>=2&&f!==w&&index.has(f)&&!STOP.has(f))out.push(f);
   }
 }
 return out;
}
/** Split an unknown un-spaced compound (e.g. «جواهرفروشی») into two indexed words. */
function compoundSplit(w,index){
 if(w.length<6||index.has(w))return null;
 let best=null;
 for(let i=3;i<=w.length-3;i++){
   const a=w.slice(0,i),b=w.slice(i);
   const fa=index.has(a)?a:vocabularyForms(a,index)[0],fb=index.has(b)?b:vocabularyForms(b,index)[0];
   if(fa&&fb&&!STOP.has(fa)&&!STOP.has(fb)){const m=Math.min(a.length,b.length);if(!best||m>best.m)best={m,parts:[fa,fb]};}
 }
 return best&&best.parts;
}

/** Query → concept groups; each group holds weighted alternative forms of one typed word. */
function queryGroups(query,index){
 const groups=[];
 const addGroup=(primary,weightBase=1)=>{
   const members=new Map();const put=(t,w)=>{if(t&&keep(t)&&w>(members.get(t)||0))members.set(t,w);};
   put(primary,weightBase);
   const s=stem(primary);if(s)put(s,W.stem*weightBase);
   for(const f of vocabularyForms(primary,index))put(f,W.stem*weightBase);
   for(const x of [...members.keys()])for(const a of aliases(x))put(a,W.alias*(members.get(x)||1));
   groups.push({primary,members});
   return members;
 };
 for(const {joined,parts} of words(query)){
   if(keep(joined)){
     const m=addGroup(joined);
     for(const p of parts){m.set(p,Math.max(m.get(p)||0,W.part));for(const a of aliases(p))m.set(a,Math.max(m.get(a)||0,W.part*W.alias));}
     const known=[...m.keys()].some(t=>index.has(t)&&t!==joined)||index.has(joined);
     if(!known&&!parts.length){const sp=compoundSplit(joined,index);if(sp){groups.pop();for(const p of sp)addGroup(p,W.split);}}
   } else for(const p of parts)addGroup(p,W.part);
 }
 return groups;
}

export function routeSkills(registry,query,{limit=8}={}){
 const norm=normalize(query);
 const groups=norm?queryGroups(query,registry.index):[];
 const tk=[...new Set(groups.flatMap(g=>[...g.members.keys()]))];
 if(!norm||!tk.length)return {selected:[],matches:0,queryTokens:tk};
 const idf=t=>registry.idf?.get(t)??0;
 // Each group weighs as its strongest indexed form, so stems/aliases never double-count.
 const gw=groups.map(g=>Math.max(0,...[...g.members].map(([t,w])=>w*idf(t))));
 const queryWeight=gw.reduce((s,x)=>s+x,0)||1;
 const c=new Set();for(const t of tk)for(const i of registry.index.get(t)||[])c.add(i);
 // Adjacent typed words, expanded through their forms, for phrase-level matching.
 const qBigrams=new Set();
 for(let i=1;i<groups.length;i++){
   const A=[...groups[i-1].members.keys()].map(canon),B=[...groups[i].members.keys()].map(canon);
   for(const a of A)for(const b of B)qBigrams.add(a+' '+b);
 }
 const domainSignals=[];
 if(/استوری|instagram|story|اینستاگرام|ریلز|reels/.test(norm))domainSignals.push(['social-media',0.65],['content-writing',0.12]);
 if(/design|طراحی|تصویر|image|عکس|photo|لوگو|logo|پوستر|poster/.test(norm))domainSignals.push(['graphic-design',0.17],['image-ai',0.10]);
 if(/website|وبسایت|سایت|web|landing|لندینگ/.test(norm))domainSignals.push(['web-development',0.75],['product-design',0.12]);
 if(/تحقیق|research|رقبا|بازار/.test(norm))domainSignals.push(['knowledge-research',0.35],['business-sales',0.13]);
 if(/فروش|sales|مشتری|customer/.test(norm))domainSignals.push(['business-sales',0.42]);
 if(/اکسل|excel|جدول|spreadsheet|sheet/.test(norm))domainSignals.push(['data-spreadsheets',0.6]);
 if(/ویدیو|video|فیلم|reels/.test(norm))domainSignals.push(['video-ai',0.2]);
 const wantsPlan=/طراحی|بساز|ساخت|سناریو|برنامه|create|design|make|build|plan|generate/.test(norm);
 const wantsPublish=/انتشار|منتشر|زمانبندی|زمان بندی|publish|post|schedule/.test(norm);
 const allForms=new Set(tk);
 const out=[];
 for(const i of c){const r=registry.records[i];let hits=0,weight=0;
   for(const g of groups){let best=0;
     for(const [t,w] of g.members){if(!r.terms.has(t))continue;
       const f=r.nameTerms.has(t)?W.field.name:r.triggerTerms.has(t)?W.field.trigger:W.field.desc;
       const v=w*f*idf(t);if(v>best)best=v;}
     if(best>0){hits++;weight+=best;}
   }
   if(!hits)continue;
   let score=W.coverage*weight/queryWeight;
   // How much of the skill's own subject (its name) the request covers.
   if(r.nameCore.length){const covered=r.nameCore.filter(w=>allForms.has(w)||allForms.has(canon(w))).length;score+=W.nameCover*covered/r.nameCore.length;}
   let bg=0;for(const b of qBigrams)if(r.bigrams.has(b))bg+=W.bigram;score+=Math.min(bg,W.bigramMax);
   if(r.phrases.some(p=>p.length>6&&norm.includes(p)))score+=W.phrase;
   if(norm.includes(normalize(r.name)))score+=W.nameInQuery;
   for(const [domain,bonus] of domainSignals)if(domain===r.domain)score+=bonus*W.domainScale;
   if(wantsPlan&&/planner|generator|design|scripting|sequence|ideas|copy|frontend/.test(r.name))score+=0.1;
   if(wantsPlan&&!wantsPublish&&/repost|publisher|auto-publisher|monitor|scheduler|auditor|dm-export/.test(r.name))score-=0.15;
   if(r.domain==='general')score-=0.05;
   if(r.templated)score*=W.templated;
   out.push({id:r.id,name:r.name,domain:r.domain,score:Math.round(score*1000)/1000,triggerHits:hits,skillLoaded:!!r.content,contentStatus:r.contentStatus});
 }
 out.sort((a,b)=>b.score-a.score||b.triggerHits-a.triggerHits||a.name.localeCompare(b.name));
 return {selected:out.slice(0,Math.min(Math.max(limit,1),25)),matches:out.length,queryTokens:tk};
}

/** Verified instruction text for the selected skills; nothing is read from disk here. */
export function skillTexts(registry,selected,{maxEach=6000}={}){
 const loaded=[],missing=[],rejected=[];
 for(const item of selected){
   const r=registry.records.find(x=>x.id===item.id);
   if(!r||r.contentStatus==='missing')missing.push(item.name);
   else if(r.contentStatus==='rejected')rejected.push({name:item.name,reason:'integrity check failed'});
   else loaded.push({name:r.name,status:r.contentStatus,description:r.description,content:r.content.slice(0,maxEach)});
 }
 return {loaded,missing,rejected};
}
