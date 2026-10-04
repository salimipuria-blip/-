// Browser login: exchanges ENGINE_TOKEN once for a signed HttpOnly cookie. The token is never echoed or logged.
import {reply,configured,authenticate,safeEqual,signSession,sessionCookie,SESSION_TTL} from './_core.mjs';
const FAIL_DELAY_MS=400; // no shared rate-limit store on serverless; slow down guessing instead
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const csrfOk=req=>String(req.headers?.['x-requested-with']||'').toLowerCase()==='poors';
export default async function handler(req,res){
 if(!['GET','POST','DELETE'].includes(req.method)){res.setHeader('Allow','GET, POST, DELETE');return reply(res,405,{error:'Method not allowed'});}
 if(!configured(res))return;
 const secret=process.env.ENGINE_TOKEN||'';
 if(req.method==='GET'){const a=authenticate(req);return reply(res,200,{authenticated:a.ok,...(a.via==='open'?{open:true}:{})});}
 if(!csrfOk(req))return reply(res,403,{error:'Missing X-Requested-With header'});
 if(req.method==='DELETE'){res.setHeader('Set-Cookie',sessionCookie('',0));return reply(res,200,{authenticated:false});}
 if(!secret)return reply(res,400,{error:'Sessions are disabled: ENGINE_TOKEN is not set'});
 let d=req.body;
 if(typeof d==='string'){try{d=JSON.parse(d)}catch{d=null}}
 const token=d&&typeof d==='object'&&typeof d.token==='string'&&d.token.length<=512?d.token:'';
 if(!token||!safeEqual(token,secret)){await sleep(FAIL_DELAY_MS);return reply(res,401,{error:'Invalid access token'});}
 const exp=Math.floor(Date.now()/1000)+SESSION_TTL;
 res.setHeader('Set-Cookie',sessionCookie(signSession(secret,exp),SESSION_TTL));
 return reply(res,200,{authenticated:true,expiresAt:new Date(exp*1000).toISOString()});
}
