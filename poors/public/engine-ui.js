(()=>{
 const $=id=>document.getElementById(id);
 const online=$('engineOnline'),overview=$('engineOverview'),run=$('engineRun'),input=$('engineInput'),mode=$('engineMode'),events=$('engineEvents'),skills=$('engineSkills'),response=$('engineResponse'),status=$('engineStatus');
 if(!online||!run)return;
 // Auth is an HttpOnly cookie set by /api/session. The token only passes through the password field once
 // and is never kept in JS state, localStorage or sessionStorage.
 const api=(path,opts={})=>fetch(path,{credentials:'same-origin',cache:'no-store',...opts,
  headers:{'X-Requested-With':'poors',...(opts.body?{'Content-Type':'application/json'}:{}),...opts.headers}});
 const el=(tag,props={},...kids)=>{const n=Object.assign(document.createElement(tag),props);n.append(...kids);return n;};
 let controller=null,authed=false;
 const clear=n=>n.replaceChildren();
 function line(target,message){target.appendChild(el('li',{textContent:message}))}
 function setState(state,caption){online.dataset.state=state;online.textContent=caption;}

 // ---- login form (built from the existing #engineToken field) and logout button ----
 let token=$('engineToken');
 if(!token){token=el('input',{id:'engineToken',type:'password'});input.before(token);}
 const tokenLabel=document.querySelector('label[for="engineToken"]');
 const loginBtn=el('button',{type:'submit',className:'engine-action engine-login-btn',textContent:'ورود به موتور'});
 const loginTitle=el('p',{className:'engine-login-title',textContent:'ورود به موتور'});
 const form=el('form',{className:'engine-login',id:'engineLogin',noValidate:true,hidden:true});
 form.setAttribute('aria-label','ورود به موتور');
 token.before(form);
 if(tokenLabel){tokenLabel.textContent='رمز دسترسی موتور';form.append(loginTitle,tokenLabel);}else form.append(loginTitle);
 Object.assign(token,{type:'password',placeholder:'رمز تنظیم‌شده در Vercel',autocomplete:'current-password',required:true,name:'token'});
 token.setAttribute('autocapitalize','off');token.setAttribute('spellcheck','false');token.removeAttribute('value');
 form.append(el('div',{className:'engine-login-row'},token,loginBtn));
 const logout=el('button',{type:'button',className:'engine-logout',id:'engineLogout',textContent:'خروج',hidden:true});
 online.parentElement.append(logout);

 // ---- task history (optional endpoint) ----
 const historyBox=el('div',{className:'engine-result engine-history',id:'engineHistory',hidden:true},
  el('h3',{textContent:'آخرین وظایف'}),el('ol',{id:'engineHistoryList'}));
 const historyList=historyBox.querySelector('ol');
 const results=response.closest('.engine-results');
 (results||response.parentElement).after(historyBox);

 function showLogin(message){
  authed=false;form.hidden=false;logout.hidden=true;historyBox.hidden=true;clear(historyList);run.disabled=true;
  setState('locked','LOCKED');overview.textContent='برای استفاده از موتور وارد شو.';
  if(message!==undefined)status.textContent=message;
 }
 function showAuthed(open){
  authed=true;form.hidden=true;logout.hidden=!!open;
 }
 async function checkSession(){
  try{const r=await api('/api/session');
   if(r.status===404){showAuthed(false);logout.hidden=true;return true;} // older deployment without sessions
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);
   if(d.authenticated){showAuthed(d.open);return true;}
   showLogin('');return false;
  }catch(e){setState('error','ENGINE DISCONNECTED');overview.textContent='موتور ابری در دسترس نیست؛ تنظیمات پروژه را بررسی کن.';run.disabled=true;status.textContent=e.message;form.hidden=true;return false;}
 }
 const unauthorized=()=>showLogin('نشست منقضی شده است؛ دوباره وارد شو.');

 form.addEventListener('submit',async ev=>{
  ev.preventDefault();
  const value=token.value;token.value='';
  if(!value.trim()){status.textContent='رمز دسترسی را وارد کن.';token.focus();return;}
  loginBtn.disabled=true;status.textContent='در حال ورود…';
  try{
   const r=await api('/api/session',{method:'POST',body:JSON.stringify({token:value.trim()})});
   const d=await r.json().catch(()=>({}));
   if(r.status===401){status.textContent='رمز دسترسی نادرست است.';token.focus();return;}
   if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);
   showAuthed(false);status.textContent='وارد شدی.';await health();loadHistory();
  }catch(e){status.textContent='ورود ناموفق بود: '+e.message;}
  finally{loginBtn.disabled=false;}
 });
 logout.addEventListener('click',async()=>{
  logout.disabled=true;if(controller)controller.abort();
  try{const r=await api('/api/session',{method:'DELETE'});if(!r.ok)throw Error(`HTTP ${r.status}`);
   clear(events);clear(skills);response.textContent='هنوز وظیفه‌ای اجرا نشده است.';showLogin('از موتور خارج شدی.');
  }catch(e){status.textContent='خروج ناموفق بود: '+e.message;}finally{logout.disabled=false;}
 });

 async function health(){
  try{const res=await api('/api/health');if(res.status===401){unauthorized();return;}
   if(!res.ok)throw Error('پاسخ نامعتبر سرور');const d=await res.json();setState('online','ENGINE CONNECTED');const sc=d.skillContent||{};const verified=(sc.verified||0)+(sc.repaired||0);const prov=(d.provider.providers||[]).filter(p=>p.configured).map(p=>p.label).join('، ');overview.textContent=`${d.skillsIndexed.toLocaleString('fa-IR')} مهارت · ${verified.toLocaleString('fa-IR')} متن تأییدشده · مدل رایگان: ${prov||'متصل نیست'}`;run.disabled=false;status.textContent=d.provider.configured?'موتور ابری و مدل رایگان متصل‌اند.':'موتور ابری متصل است. برای حالت پاسخ، یک کلید مدل رایگان روی سرور لازم است.';
  }catch(e){setState('error','ENGINE DISCONNECTED');overview.textContent='موتور ابری در دسترس نیست؛ تنظیمات پروژه را بررسی کن.';run.disabled=true;status.textContent=e.message;}
 }

 const statusFa={completed:'انجام شد',failed:'ناموفق',queued:'در صف',running:'در حال اجرا'};
 async function loadHistory(){
  if(!authed)return;
  try{const r=await api('/api/history');if(!r.ok){historyBox.hidden=true;return;}
   const d=await r.json();if(!d||d.enabled===false||!Array.isArray(d.tasks)){historyBox.hidden=true;return;}
   clear(historyList);
   for(const t of d.tasks.slice(0,10)){
    const when=t.createdAt?new Date(t.createdAt):null;
    const text=String(t.input??t.result?.input??t.route?.query??'').trim();
    const li=el('li',{},
     el('span',{className:'engine-history-meta',textContent:[statusFa[t.status]||t.status||'—',t.mode==='answer'?'پاسخ':t.mode==='plan'?'برنامه':t.mode,when&&!isNaN(when)?when.toLocaleString('fa-IR',{dateStyle:'short',timeStyle:'short'}):''].filter(Boolean).join(' · ')}),
     el('span',{className:'engine-history-text',textContent:text?(text.length>90?text.slice(0,90)+'…':text):'(بدون متن)'}));
    if(t.status==='failed')li.dataset.state='failed';
    if(Array.isArray(t.events)||t.result){li.tabIndex=0;li.setAttribute('role','button');
     const open=()=>{displayTask(t);response.scrollIntoView({behavior:'smooth',block:'nearest'});};
     li.addEventListener('click',open);li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});}
    historyList.append(li);
   }
   historyBox.hidden=!historyList.children.length;
  }catch{historyBox.hidden=true;}
 }


 // Readable Persian summary of a routing plan (the raw JSON is far too long for a phone).
 function planText(r){
  if(!r||r.kind!=='verified-routing-plan')return JSON.stringify(r,null,2);
  const lines=[r.message||'',''];
  const loaded=r.skillContent?.loaded||[];
  if(loaded.length){lines.push('مهارت‌های تأییدشده:');for(const s of loaded)lines.push(`• ${s.name}${s.description?' — '+s.description:''}`);lines.push('');}
  if(r.skillContent?.missing?.length)lines.push('بدون متن: '+r.skillContent.missing.join('، '),'');
  if(r.nextActions?.length){lines.push('گام‌های بعدی:');for(const a of r.nextActions)lines.push(`${(a.step||'').toLocaleString('fa-IR')}. ${a.action}`);}
  if(typeof r.matchedSkillCount==='number')lines.push('',`${r.matchedSkillCount.toLocaleString('fa-IR')} مهارت با این درخواست هم‌پوشانی داشتند.`);
  return lines.join('\n').trim();
 }
 function displayTask(task){
  clear(events);clear(skills);response.textContent='';
  for(const ev of task.events||[])line(events,`${ev.type} · ${new Date(ev.at).toLocaleTimeString('fa-IR')}`);
  for(const s of task.route?.selected||[])line(skills,`${s.name} · ${s.domain} · ${Number(s.score||0).toFixed(2)}${s.skillLoaded?' · ✓ تأییدشده':''}`);
  if(task.status==='failed'){status.textContent=`اجرا متوقف شد: ${task.error?.code||'خطا'}`;const ready=(task.result?.skillsReady||[]).map(s=>`• ${s.name}: ${s.description||''}`).join('\n');response.textContent=(task.error?.message||'خطا')+(ready?`\n\nمهارت‌های تأییدشدهٔ آماده:\n${ready}`:'');}
  else if(task.status==='completed'){
    status.textContent=task.result?.kind==='llm-response'?`پاسخ از ${task.result.provider} · ${task.result.model} دریافت شد؛ هیچ ابزار خارجی اجرا نشده است.`:'مسیریابی و تولید برنامه به پایان رسید؛ هنوز خروجی تخصصی تولید نشده است.';
    response.textContent=task.result?.kind==='llm-response'?task.result.answer:planText(task.result);
  }else status.textContent='در حال اجرای واقعی مسیر وظیفه…';
 }
 run.addEventListener('click',async()=>{
  if(!authed){showLogin('ابتدا وارد شو.');token.focus();return;}
  const text=input.value.trim();if(!text){status.textContent='درخواست را بنویس.';input.focus();return;}
  if(controller)controller.abort();controller=new AbortController();run.disabled=true;clear(events);clear(skills);response.textContent='';status.textContent='در حال اجرای درخواست روی سرور ابری…';
  try{
   const r=await api('/api/tasks',{method:'POST',body:JSON.stringify({input:text,mode:mode?.checked?'answer':'plan'}),signal:controller.signal});
   if(r.status===401){unauthorized();return;}
   const d=await r.json();if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);
   if(d.status==='completed'||d.status==='failed'){displayTask(d);loadHistory();return;}
   const until=Date.now()+65000;
   while(Date.now()<until){const t=await api('/api/tasks/'+encodeURIComponent(d.id),{signal:controller.signal});if(t.status===401){unauthorized();return;}if(!t.ok)throw Error(`Task HTTP ${t.status}`);const task=await t.json();displayTask(task);if(['completed','failed'].includes(task.status))break;await new Promise(res=>setTimeout(res,650));}
   loadHistory();
  }catch(e){if(e.name!=='AbortError')status.textContent='خطا در ارتباط: '+e.message;}finally{if(authed)run.disabled=false;controller=null;}
 });

 (async()=>{if(await checkSession()){await health();loadHistory();}})();
})();
