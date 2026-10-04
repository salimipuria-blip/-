import {guard,reply,route,getRegistry} from './_core.mjs';
export default function handler(req,res){if(!guard(req,res,'GET'))return;
 const q=String(req.query?.q||'');if(q.length>4000)return reply(res,400,{error:'Query too long'});
 return reply(res,200,{...route(q,15),indexed:getRegistry().records.length});}
