// Free-tier LLM adapter. Zero dependencies (built-in fetch), OpenAI-compatible chat endpoints.
// Policy: free-only by configuration. A provider is used only when its key is set on the server.
// Failover happens on rate limits, quota and server errors; nothing ever falls back to a paid route.

export const PROVIDERS = [
  {id:'groq',label:'Groq',env:'GROQ_API_KEY',base:'https://api.groq.com/openai/v1',model:'llama-3.3-70b-versatile'},
  {id:'cerebras',label:'Cerebras',env:'CEREBRAS_API_KEY',base:'https://api.cerebras.ai/v1',model:'llama-3.3-70b'},
  {id:'gemini',label:'Google AI Studio',env:'GEMINI_API_KEY',base:'https://generativelanguage.googleapis.com/v1beta/openai',model:'gemini-2.5-flash'},
  {id:'openrouter',label:'OpenRouter',env:'OPENROUTER_API_KEY',base:'https://openrouter.ai/api/v1',model:'meta-llama/llama-3.3-70b-instruct:free',freeSuffix:':free'},
];

const modelOf=(p,env)=>env[p.env.replace('_API_KEY','_MODEL')]||p.model;

/** Providers that are configured and pass the free-only guard, in priority order. */
export function configuredProviders(env=process.env){
  const order=String(env.PROVIDER_ORDER||'').split(',').map(s=>s.trim()).filter(Boolean);
  const list=PROVIDERS.filter(p=>env[p.env]).map(p=>({...p,model:modelOf(p,env),key:env[p.env]}));
  // OpenRouter mixes paid and free models: only ids ending in ":free" are allowed.
  const safe=list.filter(p=>!p.freeSuffix||p.model.endsWith(p.freeSuffix));
  if(order.length)safe.sort((a,b)=>(order.indexOf(a.id)+1||99)-(order.indexOf(b.id)+1||99));
  return safe;
}

/** Public description; never includes keys. */
export function providerStatus(env=process.env){
  const ready=configuredProviders(env);
  return {configured:ready.length>0,pricePolicy:'free-only; stop on exhausted quota',
    providers:PROVIDERS.map(p=>{const r=ready.find(x=>x.id===p.id);return {id:p.id,label:p.label,configured:!!r,model:r?r.model:null};})};
}

const RETRY=new Set([408,409,425,429,500,502,503,504]);

// Free model ids change often. When the configured id is gone (404/400/422), ask the provider
// which models it serves now and pick the best match; cached per warm instance.
const PREFER={
  groq:[/llama-3\.3-70b/,/gpt-oss-120b/,/llama.*70b/,/qwen/,/llama/],
  cerebras:[/llama-3\.3-70b/,/gpt-oss-120b/,/qwen.*(235|32)b/,/llama/],
  gemini:[/^gemini-[\d.]+-flash$/,/^gemini-[\d.]+-flash(-latest)?$/,/^gemini-[\d.]+-flash-lite$/],
  openrouter:[/llama-3\.3-70b.*:free$/,/qwen.*:free$/,/deepseek.*:free$/,/gpt-oss.*:free$/,/:free$/],
};
const SKIP=/(embed|whisper|tts|audio|image|vision|guard|moderation|live|native|preview-tts)/i;
const discovered=new Map();
export function pickModel(providerId,ids){
  const clean=ids.map(i=>String(i).replace(/^models\//,'')).filter(i=>!SKIP.test(i));
  const allowed=providerId==='openrouter'?clean.filter(i=>i.endsWith(':free')):clean;
  for(const re of PREFER[providerId]||[]){const hit=allowed.filter(i=>re.test(i)).sort();if(hit.length)return hit[hit.length-1];}
  return null;
}
async function discover(p,fetchImpl,signal){
  if(discovered.has(p.id))return discovered.get(p.id);
  let model=null;
  try{const r=await fetchImpl(p.base+'/models',{headers:{'Authorization':'Bearer '+p.key},signal});
    if(r.ok){const d=await r.json();model=pickModel(p.id,(d.data||d.models||[]).map(m=>m.id||m.name));}}catch{}
  discovered.set(p.id,model);return model;
}
const MODEL_GONE=new Set([400,404,422]);

/**
 * Try each configured provider in order (one model rediscovery per provider when its model is gone).
 * Returns {text, provider, model, attempts} or throws {code, attempts} with code
 * NO_PROVIDER_CONFIGURED | PROVIDERS_EXHAUSTED | PROVIDER_REJECTED (every provider refused with a non-retryable 4xx).
 */
export async function chat(messages,{env=process.env,fetchImpl=globalThis.fetch,timeoutMs=20000,maxTokens=1600,deadline=Date.now()+50000}={}){
  const list=configuredProviders(env);
  if(!list.length)throw Object.assign(new Error('No free provider key is configured on the server'),{code:'NO_PROVIDER_CONFIGURED',attempts:[]});
  const attempts=[];
  for(const p of list){
    let model=discovered.get(p.id)||p.model,rediscovered=false;
    while(true){
      const left=deadline-Date.now();if(left<2000)break;
      const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),Math.min(timeoutMs,left));
      const started=Date.now();
      try{
        const res=await fetchImpl(p.base+'/chat/completions',{method:'POST',signal:ctrl.signal,
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+p.key},
          body:JSON.stringify({model,messages,max_tokens:maxTokens,temperature:0.4})});
        const ms=Date.now()-started;
        if(!res.ok){
          attempts.push({provider:p.id,model,status:res.status,ms});
          if(MODEL_GONE.has(res.status)&&!rediscovered&&!env[p.env.replace('_API_KEY','_MODEL')]){
            rediscovered=true;discovered.delete(p.id);
            const next=await discover(p,fetchImpl,ctrl.signal);
            if(next&&next!==model){model=next;continue;}
          }
          break;
        }
        const data=await res.json();
        const text=data?.choices?.[0]?.message?.content;
        if(typeof text!=='string'||!text.trim()){attempts.push({provider:p.id,model,status:'empty',ms});break;}
        attempts.push({provider:p.id,model,status:200,ms});
        if(model!==p.model)discovered.set(p.id,model);
        return {text:text.trim(),provider:p.id,model:data.model||model,usage:data.usage||null,attempts};
      }catch(e){
        attempts.push({provider:p.id,model,status:e.name==='AbortError'?'timeout':'network',ms:Date.now()-started});break;
      }finally{clearTimeout(timer);}
    }
  }
  const rejected=attempts.length>0&&attempts.every(a=>typeof a.status==='number'&&a.status>=400&&a.status<500&&!RETRY.has(a.status)&&![401,402,403].includes(a.status));
  throw Object.assign(new Error(rejected?'Every provider rejected the request':'All configured free providers failed or are rate-limited'),{code:rejected?'PROVIDER_REJECTED':'PROVIDERS_EXHAUSTED',attempts});
}
