import {guard,reply} from './_core.mjs';
import {listTasks} from './_store.mjs';
// GET /api/history?limit=20 — recent persisted tasks (newest first), or {enabled:false}.
export default async function handler(req,res){if(!guard(req,res,'GET'))return;
 const raw=req.query?.limit;const limit=raw===undefined?20:Number.parseInt(raw,10);
 if(!Number.isInteger(limit)||limit<1||limit>50)return reply(res,400,{error:'limit must be an integer between 1 and 50'});
 try{return reply(res,200,await listTasks(limit));}
 catch(e){return reply(res,502,{enabled:true,error:e?.code||'STORE_ERROR'});}
}
