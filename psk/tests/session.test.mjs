import test from 'node:test';
import assert from 'node:assert/strict';
import session from '../api/session.js';
import health from '../api/health.js';
import tasks from '../api/tasks.js';
import {signSession,verifySession,SESSION_TTL} from '../api/_core.mjs';
for(const k of ['GROQ_API_KEY','CEREBRAS_API_KEY','GEMINI_API_KEY','OPENROUTER_API_KEY'])delete process.env[k];
const SECRET='test-example-token-1234567890123456';
const original=process.env.ENGINE_TOKEN;process.env.ENGINE_TOKEN=SECRET;
process.on('exit',()=>{if(original===undefined)delete process.env.ENGINE_TOKEN;else process.env.ENGINE_TOKEN=original});
function res(){return {statusCode:null,headers:{},setHeader(k,v){this.headers[k]=v;return this},status(n){this.statusCode=n;return this},json(v){this.body=v;return this}}}
const XRW={'x-requested-with':'poors'};
const cookieOf=r=>String(r.headers['Set-Cookie']||'').split(';')[0];
async function login(token=SECRET){const r=res();await session({method:'POST',headers:{...XRW},body:{token}},r);return r;}
const now=()=>Math.floor(Date.now()/1000);
const planBody={input:'طراحی سه استوری اینستاگرام',mode:'plan'};

test('login success sets a hardened HttpOnly cookie and never echoes the token',async()=>{
 const r=await login();
 assert.equal(r.statusCode,200);assert.equal(r.body.authenticated,true);
 const c=r.headers['Set-Cookie'];
 assert.match(c,/^poors_session=\d+\.[A-Za-z0-9_-]{43}; /);
 for(const attr of ['HttpOnly','Secure','SameSite=Strict','Path=/api','Max-Age=604800'])assert.ok(c.includes(attr),attr);
 assert.ok(!JSON.stringify(r.body).includes(SECRET));assert.ok(!c.includes(SECRET));
 assert.equal(r.headers['Cache-Control'],'no-store');
 const g=res();await session({method:'GET',headers:{cookie:'other=1; '+cookieOf(r)}},g);assert.deepEqual(g.body,{authenticated:true});
 const h=res();health({method:'GET',headers:{cookie:cookieOf(r)}},h);assert.equal(h.statusCode,200);
});

test('login failure is delayed, returns 401 and sets no cookie',async()=>{
 const t0=Date.now();const r=await login('wrong-token-wrong-token-wrong-token!');
 assert.ok(Date.now()-t0>=380,'failed login should be slowed down');
 assert.equal(r.statusCode,401);assert.equal(r.headers['Set-Cookie'],undefined);
 for(const body of [{},{token:42},'not json',{token:SECRET.slice(0,-1)}]){
  const x=res();await session({method:'POST',headers:{...XRW},body},x);assert.equal(x.statusCode,401);}
 const g=res();await session({method:'GET',headers:{}},g);assert.deepEqual(g.body,{authenticated:false});
});

test('tampered, foreign-key and malformed cookies are rejected',async()=>{
 const c=cookieOf(await login());const [name,value]=c.split('=');const [exp,sig]=value.split('.');
 const flip=sig.slice(0,-1)+(sig.at(-1)==='A'?'B':'A');
 const bad=[`${exp}.${flip}`,`${Number(exp)+1}.${sig}`,`${exp}.${sig}x`,exp,'',`${exp}.${sig}.${sig}`,
  signSession('another-secret-another-secret-123',Number(exp))];
 for(const v of bad){const r=res();health({method:'GET',headers:{cookie:`${name}=${v}`}},r);assert.equal(r.statusCode,401,v);}
 assert.equal(verifySession(SECRET,value),true);
});

test('expired and over-long sessions are rejected; token rotation revokes sessions',()=>{
 assert.equal(verifySession(SECRET,signSession(SECRET,now()-1)),false);
 assert.equal(verifySession(SECRET,signSession(SECRET,now()+10)),true);
 assert.equal(verifySession(SECRET,signSession(SECRET,now()+10),now()+11),false);
 assert.equal(verifySession(SECRET,signSession(SECRET,now()+SESSION_TTL*4)),false,'far-future expiry is not trusted');
 const r=res();health({method:'GET',headers:{cookie:'poors_session='+signSession(SECRET,now()-5)}},r);assert.equal(r.statusCode,401);
 const v=signSession(SECRET,now()+100);process.env.ENGINE_TOKEN=SECRET+'-rotated';
 try{assert.equal(verifySession(process.env.ENGINE_TOKEN,v),false);}finally{process.env.ENGINE_TOKEN=SECRET;}
});

test('cookie-authenticated POST requires X-Requested-With: poors (CSRF guard)',async()=>{
 const cookie=cookieOf(await login());
 let r=res();await tasks({method:'POST',headers:{cookie},body:planBody},r);assert.equal(r.statusCode,403);
 r=res();await tasks({method:'POST',headers:{cookie,'x-requested-with':'XMLHttpRequest'},body:planBody},r);assert.equal(r.statusCode,403);
 r=res();await tasks({method:'POST',headers:{cookie,...XRW},body:planBody},r);assert.equal(r.statusCode,200);assert.equal(r.body.status,'completed');
 // Login and logout also refuse requests without the header.
 r=res();await session({method:'POST',headers:{},body:{token:SECRET}},r);assert.equal(r.statusCode,403);assert.equal(r.headers['Set-Cookie'],undefined);
 r=res();await session({method:'DELETE',headers:{cookie}},r);assert.equal(r.statusCode,403);
});

test('logout clears the cookie',async()=>{
 const cookie=cookieOf(await login());
 const r=res();await session({method:'DELETE',headers:{cookie,...XRW}},r);
 assert.equal(r.statusCode,200);assert.equal(r.body.authenticated,false);
 assert.match(r.headers['Set-Cookie'],/^poors_session=; HttpOnly; Secure; SameSite=Strict; Path=\/api; Max-Age=0$/);
 const m=res();await session({method:'PUT',headers:{cookie,...XRW}},m);assert.equal(m.statusCode,405);
});

test('bearer header still works for scripts and needs no CSRF header; a wrong bearer is not rescued by a cookie',async()=>{
 const cookie=cookieOf(await login());
 let r=res();await tasks({method:'POST',headers:{authorization:'Bearer '+SECRET},body:planBody},r);assert.equal(r.statusCode,200);
 r=res();health({method:'GET',headers:{authorization:'Bearer nope',cookie}},r);assert.equal(r.statusCode,401);
 r=res();await session({method:'GET',headers:{authorization:'Bearer '+SECRET}},r);assert.equal(r.body.authenticated,true);
});

test('fail closed with 503 on Vercel/production when ENGINE_TOKEN is missing or short',async()=>{
 const prev={VERCEL:process.env.VERCEL,NODE_ENV:process.env.NODE_ENV};
 try{
  for(const env of [{VERCEL:'1'},{NODE_ENV:'production'}]){Object.assign(process.env,env);
   for(const tok of [undefined,'short-token']){
    if(tok===undefined)delete process.env.ENGINE_TOKEN;else process.env.ENGINE_TOKEN=tok;
    let r=res();await session({method:'GET',headers:{}},r);assert.equal(r.statusCode,503);
    r=res();await session({method:'POST',headers:{...XRW},body:{token:tok||''}},r);assert.equal(r.statusCode,503);assert.equal(r.headers['Set-Cookie'],undefined);
    r=res();health({method:'GET',headers:{cookie:'poors_session='+signSession('short-token',now()+60)}},r);assert.equal(r.statusCode,503);
   }
   for(const k of Object.keys(env))delete process.env[k];}
 }finally{process.env.ENGINE_TOKEN=SECRET;for(const [k,v] of Object.entries(prev)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
