(()=>{
 const $=id=>document.getElementById(id);
 const online=$('engineOnline'),overview=$('engineOverview'),run=$('engineRun'),input=$('engineInput'),token=$('engineToken'),mode=$('engineMode'),events=$('engineEvents'),skills=$('engineSkills'),response=$('engineResponse'),status=$('engineStatus');
 if(!online)return;
 const headers=()=>({'Content-Type':'application/json',...(token.value.trim()?{'Authorization':'Bearer '+token.value.trim()}:{})});
 let controller=null;
 const clear=n=>n.replaceChildren();
 function line(target,message){const li=document.createElement('li');li.textContent=message;target.appendChild(li)}
 function setState(state,caption){online.dataset.state=state;online.textContent=caption;}
 async function health(){
  try{const res=await fetch('/api/health',{headers:headers(),cache:'no-store'});if(!res.ok)throw Error(res.status===401?(token.value.trim()?'کلید دسترسی معتبر نیست':'برای اتصال، کلید دسترسی را وارد کن.'):res.status===503?'کلید دسترسی روی سرور تنظیم نشده است (ENGINE_TOKEN در Vercel).':'پاسخ نامعتبر سرور');const d=await res.json();setState('online','ENGINE CONNECTED');const sc=d.skillContent||{};const verified=(sc.verified||0)+(sc.repaired||0);const prov=(d.provider.providers||[]).filter(p=>p.configured).map(p=>p.label).join('، ');overview.textContent=`${d.skillsIndexed.toLocaleString('fa-IR')} مهارت · ${verified.toLocaleString('fa-IR')} متن تأییدشده · مدل رایگان: ${prov||'متصل نیست'}`;run.disabled=false;status.textContent=d.provider.configured?'موتور ابری و مدل رایگان متصل‌اند.':'موتور ابری متصل است. برای حالت پاسخ، یک کلید مدل رایگان روی سرور لازم است.';
  }catch(e){setState('error','ENGINE DISCONNECTED');overview.textContent='موتور ابری در دسترس نیست؛ کلید دسترسی یا تنظیمات پروژه را بررسی کن.';run.disabled=true;status.textContent=e.message;}
 }
 token.addEventListener('change',health);
 function displayTask(task){
  clear(events);clear(skills);response.textContent='';
  for(const ev of task.events||[])line(events,`${ev.type} · ${new Date(ev.at).toLocaleTimeString('fa-IR')}`);
  for(const s of task.route?.selected||[])line(skills,`${s.name} · ${s.domain} · ${s.score.toFixed(2)}${s.skillLoaded?' · ✓ تأییدشده':''}`);
  if(task.status==='failed'){status.textContent=`اجرا متوقف شد: ${task.error?.code||'خطا'}`;const ready=(task.result?.skillsReady||[]).map(s=>`• ${s.name}: ${s.description||''}`).join('\n');response.textContent=(task.error?.message||'خطا')+(ready?`\n\nمهارت‌های تأییدشدهٔ آماده:\n${ready}`:'');}
  else if(task.status==='completed'){
    status.textContent=task.result?.kind==='llm-response'?`پاسخ از ${task.result.provider} · ${task.result.model} دریافت شد؛ هیچ ابزار خارجی اجرا نشده است.`:'مسیریابی و تولید برنامه به پایان رسید؛ هنوز خروجی تخصصی تولید نشده است.';
    response.textContent=task.result?.kind==='llm-response'?task.result.answer:JSON.stringify(task.result,null,2);
  }else status.textContent='در حال اجرای واقعی مسیر وظیفه…';
 }
 run.addEventListener('click',async()=>{
  const text=input.value.trim();if(!text){status.textContent='درخواست را بنویس.';input.focus();return;}
  if(controller)controller.abort();controller=new AbortController();run.disabled=true;clear(events);clear(skills);response.textContent='';status.textContent='در حال اجرای درخواست روی سرور ابری…';
  try{
   // The API completes each task within the same call, so the response is final.
   const r=await fetch('/api/tasks',{method:'POST',headers:headers(),body:JSON.stringify({input:text,mode:mode.checked?'answer':'plan'}),signal:controller.signal});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);
   displayTask(d);
  }catch(e){if(e.name!=='AbortError')status.textContent='خطا در ارتباط: '+e.message;}finally{run.disabled=false;controller=null;}
 });
 health();
})();
