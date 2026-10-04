import {guard,reply} from './_core.mjs';
import {listTasks} from './_store.mjs';
// GET /api/history?limit=20 — recent persisted tasks (newest first), or {enabled:false}.
export default async function handler(req,res){if(!guard(req,res,'GET'))return;
 const raw=req.query?.limit;const limit=raw===undefined?20:Number.parseInt(raw,10);
 if(!Number.isInteger(limit)||limit<1||limit>50)return reply(res,400,{error:'limit must be an integer between 1 and 50'});
 try{const out=await listTasks(limit);
  if(out.enabled&&Array.isArray(out.tasks))out.tasks=out.tasks.map(toTask);
  return reply(res,200,out);}
 catch(e){return reply(res,502,{enabled:true,error:e?.code||'STORE_ERROR'});}
}

// Same shape the console renders for a live task.
function toTask(r){
 return {id:r.id,createdAt:r.created_at,mode:r.mode,input:r.input,status:r.status,
  error:r.error_code?{code:r.error_code}:null,events:Array.isArray(r.events)?r.events:[],
  route:{selected:Array.isArray(r.selected_skills)?r.selected_skills:[]},
  result:r.result_kind?{kind:r.result_kind,answer:r.answer??undefined,provider:r.provider??undefined,model:r.model??undefined}:null};
}
