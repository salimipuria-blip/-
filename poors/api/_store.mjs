// Durable task history on the Supabase free tier, reached only through two
// SECURITY DEFINER RPCs (see supabase/migrations). The app holds just the
// publishable key plus HISTORY_SECRET; tables are not readable or writable directly.
// Every failure here is reported, never thrown into the task path.
const TIMEOUT_MS=3000;
const CAP={input:4000,answer:20000,skills:8,events:50,code:64,kind:64,provider:64,model:128};

export function storeConfig(env=process.env){
 const url=String(env.SUPABASE_URL||'').trim().replace(/\/+$/,'');
 const key=String(env.SUPABASE_PUBLISHABLE_KEY||'').trim();
 const secret=String(env.HISTORY_SECRET||'');
 if(!url||!key||!secret)return {enabled:false,reason:'NOT_CONFIGURED'};
 let parsed;try{parsed=new URL(url);}catch{return {enabled:false,reason:'INVALID_SUPABASE_URL'};}
 const local=parsed.hostname==='localhost'||parsed.hostname==='127.0.0.1';
 if(parsed.protocol!=='https:'&&!local)return {enabled:false,reason:'INVALID_SUPABASE_URL'};
 if(secret.length<24||secret.length>256)return {enabled:false,reason:'HISTORY_SECRET_INVALID'};
 return {enabled:true,url,key,secret};
}

/** Safe for /api/health: never includes the URL, key or secret. */
export function storeStatus(env=process.env){
 const c=storeConfig(env);
 return c.enabled?{enabled:true,backend:'supabase'}:{enabled:false,backend:'none',reason:c.reason};
}

const str=(v,max)=>typeof v==='string'&&v.length?v.slice(0,max):null;

/** Flatten a finished task into the row shape poors_log_task accepts. */
export function taskRecord(task,input){
 const result=task.result||{};
 return {
  id:task.id,mode:task.mode,input:String(input||'').slice(0,CAP.input),status:task.status,
  error_code:str(task.error?.code,CAP.code),
  selected_skills:(task.route?.selected||[]).slice(0,CAP.skills).map(s=>({name:s.name,domain:s.domain,score:s.score})),
  result_kind:str(result.kind,CAP.kind),answer:str(result.answer,CAP.answer),
  provider:str(result.provider,CAP.provider),model:str(result.model,CAP.model),
  events:(task.events||[]).slice(0,CAP.events).map(e=>({id:e.id,type:e.type,at:e.at,...(e.error?{error:e.error.code}:{}),...(e.provider?{provider:e.provider}:{})}))
 };
}

class StoreError extends Error{constructor(code,status){super(code);this.code=code;this.status=status;}}

async function rpc(config,fn,args){
 let r;
 try{
  r=await fetch(`${config.url}/rest/v1/rpc/${fn}`,{method:'POST',
   headers:{apikey:config.key,Authorization:`Bearer ${config.key}`,'Content-Type':'application/json',Accept:'application/json'},
   body:JSON.stringify(args),signal:AbortSignal.timeout(TIMEOUT_MS)});
 }catch(e){throw new StoreError(e?.name==='TimeoutError'||e?.name==='AbortError'?'STORE_TIMEOUT':'STORE_UNREACHABLE');}
 if(!r.ok)throw new StoreError(r.status===401||r.status===403?'STORE_DENIED':'STORE_HTTP_'+r.status,r.status);
 try{return await r.json();}catch{throw new StoreError('STORE_BAD_RESPONSE');}
}

/** Persist a finished task. Never throws; returns {persisted, reason?}. */
export async function logTask(task,input,env=process.env){
 const config=storeConfig(env);
 if(!config.enabled)return {persisted:false,reason:'STORE_DISABLED'};
 try{await rpc(config,'poors_log_task',{p_secret:config.secret,p_task:taskRecord(task,input)});return {persisted:true};}
 catch(e){return {persisted:false,reason:e instanceof StoreError?e.code:'STORE_ERROR'};}
}

/** Recent tasks, newest first. Returns {enabled:false} when not configured; throws StoreError on failure. */
export async function listTasks(limit=20,env=process.env){
 const config=storeConfig(env);
 if(!config.enabled)return {enabled:false,reason:config.reason};
 const n=Math.min(Math.max(Number.parseInt(limit,10)||20,1),50);
 const rows=await rpc(config,'poors_list_tasks',{p_secret:config.secret,p_limit:n});
 return {enabled:true,tasks:Array.isArray(rows)?rows:[]};
}
export {StoreError};
