const U='https://aupkeramhsufnmhkbihl.supabase.co';
const K='sb_publishable_iGffpPBxQqUNzNn-dVANOQ_NxXJebC-';

async function gql(key,query,variables={}) {
  const r=await fetch('https://api.buffer.com',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({query,variables})});
  const p=await r.json().catch(()=>({}));
  if(!r.ok||p.errors?.length) throw new Error(p.errors?.[0]?.message||('Buffer API '+r.status));
  return p.data;
}
async function rpc(name,args,token){
  const r=await fetch(U+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args||{})});
  const t=await r.text();
  if(!r.ok){let m=t;try{m=JSON.parse(t)?.message||t}catch{}throw new Error(m||('Supabase RPC '+r.status))}
  if(!t)return null;try{return JSON.parse(t)}catch{return t}
}
async function validate(token){
  const r=await fetch(U+'/auth/v1/user',{headers:{apikey:K,Authorization:'Bearer '+token}});
  if(!r.ok) throw new Error('Lithos session expired. Sign in again.');
}
const val=(m,t)=>Number((m||[]).find(x=>x.type===t)?.value??0);

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const h=req.headers.authorization||'',token=h.startsWith('Bearer ')?h.slice(7):'';
  if(!token) return res.status(401).json({error:'Missing Lithos session'});
  try{await validate(token)}catch(e){return res.status(401).json({error:e.message||'Lithos session invalid'})}

  // ============================================================================
  // RECONSTRUCTED TAIL — the original handler body past this point was truncated
  // during source recovery from the Vercel deployment and could not be retrieved
  // verbatim. The structure below matches the recovered helpers (gql/rpc/val) and
  // the data contract the frontend (index.html) reads. VERIFY against the original
  // before relying on it — especially: the exact Buffer GraphQL query, the metric
  // `type` keys passed to val(), and the Supabase RPC names/args used to persist.
  // ============================================================================
  const bufferKey = process.env.BUFFER_API_KEY;
  if(!bufferKey){
    try{ await rpc('lithos_set_sync_state',{p_source:'buffer',p_status:'error'},token); }catch{}
    return res.status(400).json({error:'BUFFER_API_KEY not configured'});
  }
  try{
    // TODO(verify): exact Buffer GraphQL query and response shape.
    const data = await gql(bufferKey, 'query { account { channels { metrics { type value } } } }');
    const metrics = data?.account?.channels?.[0]?.metrics || [];

    // TODO(verify): metric `type` keys below must match what Buffer returns.
    const snapshot = {
      followers: val(metrics,'followers'),
      reach: val(metrics,'reach'),
      impressions: val(metrics,'impressions'),
      saves: val(metrics,'saves'),
      shares: val(metrics,'shares'),
      comments: val(metrics,'comments'),
      engagement_rate: val(metrics,'engagement_rate'),
      avg_watch_time_seconds: val(metrics,'avg_watch_time_seconds'),
      metadata: { followers_supported: metrics.some(x=>x.type==='followers') }
    };

    // TODO(verify): RPC name/args that persist the insight snapshot + sync state.
    await rpc('lithos_record_insight_snapshot',{p_snapshot:snapshot},token);
    await rpc('lithos_set_sync_state',{p_source:'buffer',p_status:'synced'},token);

    return res.status(200).json({ok:true, snapshot});
  }catch(e){
    try{ await rpc('lithos_set_sync_state',{p_source:'buffer',p_status:'error'},token); }catch{}
    return res.status(502).json({error:e.message||'Buffer sync failed'});
  }
}
