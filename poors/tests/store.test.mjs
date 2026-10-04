import test from 'node:test';
import assert from 'node:assert/strict';
import tasks from '../api/tasks.js';
import history from '../api/history.js';
import {storeConfig,storeStatus,taskRecord,logTask,listTasks} from '../api/_store.mjs';
for(const k of ['GROQ_API_KEY','CEREBRAS_API_KEY','GEMINI_API_KEY','OPENROUTER_API_KEY','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','HISTORY_SECRET'])delete process.env[k];
process.env.ENGINE_TOKEN='test-example-token-1234567890123456';
const token='Bearer '+process.env.ENGINE_TOKEN;
const SECRET='history-test-secret-0123456789abcdef';
const ENV={SUPABASE_URL:'https://example.supabase.co/',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',HISTORY_SECRET:SECRET};
function res(){return {statusCode:null,headers:{},setHeader(k,v){this.headers[k]=v;return this},status(n){this.statusCode=n;return this},json(v){this.body=v;return this}}}
const planReq=()=>({method:'POST',headers:{authorization:token},body:{input:'طراحی سه استوری اینستاگرام',mode:'plan'}});
async function withStore(fetchImpl,fn){
 const realFetch=globalThis.fetch;Object.assign(process.env,ENV);globalThis.fetch=fetchImpl;
 try{return await fn();}finally{globalThis.fetch=realFetch;for(const k of Object.keys(ENV))delete process.env[k];}
}

test('store config: disabled unless all three variables are valid',()=>{
 assert.deepEqual(storeConfig({}),{enabled:false,reason:'NOT_CONFIGURED'});
 assert.equal(storeConfig({...ENV,SUPABASE_URL:'http://evil.example'}).reason,'INVALID_SUPABASE_URL');
 assert.equal(storeConfig({...ENV,HISTORY_SECRET:'short'}).reason,'HISTORY_SECRET_INVALID');
 const c=storeConfig(ENV);assert.equal(c.enabled,true);assert.equal(c.url,'https://example.supabase.co');
 const s=storeStatus(ENV);assert.deepEqual(s,{enabled:true,backend:'supabase'});
 assert.ok(!JSON.stringify(s).includes(SECRET)&&!JSON.stringify(s).includes('sb_publishable'));
});

test('disabled path: tasks complete as before with persisted:false and no network call',async()=>{
 let calls=0;const realFetch=globalThis.fetch;globalThis.fetch=async()=>{calls++;return new Response('[]');};
 try{
  const r=res();await tasks(planReq(),r);
  assert.equal(r.statusCode,200);assert.equal(r.body.status,'completed');
  assert.equal(r.body.persisted,false);assert.equal(r.body.persistReason,'STORE_DISABLED');assert.equal(calls,0);
  const h=res();await history({method:'GET',headers:{authorization:token},query:{}},h);
  assert.equal(h.statusCode,200);assert.equal(h.body.enabled,false);assert.equal(calls,0);
 }finally{globalThis.fetch=realFetch;}
});

test('success path: finished task is sent to poors_log_task with the publishable key and secret',async()=>{
 const seen=[];
 await withStore(async(url,opts)=>{seen.push({url,opts});return new Response(JSON.stringify('00000000-0000-0000-0000-000000000000'),{status:200});},async()=>{
  const r=res();await tasks(planReq(),r);
  assert.equal(r.body.status,'completed');assert.equal(r.body.persisted,true);assert.equal(r.body.persistReason,undefined);
 });
 assert.equal(seen.length,1);
 const {url,opts}=seen[0];
 assert.equal(url,'https://example.supabase.co/rest/v1/rpc/poors_log_task');
 assert.equal(opts.method,'POST');assert.equal(opts.headers.apikey,'sb_publishable_test');assert.equal(opts.headers.Authorization,'Bearer sb_publishable_test');
 assert.ok(opts.signal instanceof AbortSignal);
 const body=JSON.parse(opts.body);assert.equal(body.p_secret,SECRET);
 assert.equal(body.p_task.mode,'plan');assert.equal(body.p_task.status,'completed');assert.equal(body.p_task.input,'طراحی سه استوری اینستاگرام');
 assert.ok(body.p_task.selected_skills.length>0&&body.p_task.selected_skills.length<=8);
 assert.ok(body.p_task.events.some(e=>e.type==='completed'));assert.equal(body.p_task.result_kind,'verified-routing-plan');
});

test('failure path: HTTP error, network error and timeout never fail the task',async()=>{
 const cases=[[async()=>new Response('{"message":"denied"}',{status:401}),'STORE_DENIED'],
  [async()=>new Response('oops',{status:500}),'STORE_HTTP_500'],
  [async()=>{throw new TypeError('fetch failed');},'STORE_UNREACHABLE'],
  [async()=>{const e=new Error('timed out');e.name='TimeoutError';throw e;},'STORE_TIMEOUT']];
 for(const [impl,reason] of cases){
  await withStore(impl,async()=>{
   const r=res();await tasks(planReq(),r);
   assert.equal(r.statusCode,200);assert.equal(r.body.status,'completed');assert.equal(r.body.result.kind,'verified-routing-plan');
   assert.equal(r.body.persisted,false);assert.equal(r.body.persistReason,reason);
  });
 }
});

test('record shape is capped and carries no secrets',()=>{
 const rec=taskRecord({id:'x',mode:'answer',status:'completed',route:{selected:Array.from({length:20},(_, i)=>({name:'s'+i,domain:'d',score:1,id:'h'}))},
  result:{kind:'llm-response',answer:'a'.repeat(30000),provider:'groq',model:'m'},events:Array.from({length:80},(_, i)=>({id:i,type:'t',at:'now',taskId:'x'}))},'q'.repeat(5000));
 assert.equal(rec.input.length,4000);assert.equal(rec.answer.length,20000);assert.equal(rec.selected_skills.length,8);assert.equal(rec.events.length,50);
 assert.equal(rec.events[0].taskId,undefined);
});

test('history endpoint: requires the engine token, validates limit, returns rows',async()=>{
 const seen=[];
 await withStore(async(url,opts)=>{seen.push({url,body:JSON.parse(opts.body)});return new Response(JSON.stringify([{id:'a',status:'completed'}]),{status:200});},async()=>{
  let r=res();await history({method:'GET',headers:{},query:{}},r);assert.equal(r.statusCode,401);
  r=res();await history({method:'GET',headers:{authorization:'Bearer wrong-token-wrong-token-wrong-1'},query:{}},r);assert.equal(r.statusCode,401);
  r=res();await history({method:'POST',headers:{authorization:token},query:{}},r);assert.equal(r.statusCode,405);
  r=res();await history({method:'GET',headers:{authorization:token},query:{limit:'500'}},r);assert.equal(r.statusCode,400);
  assert.equal(seen.length,0,'unauthenticated or invalid requests must not reach the store');
  r=res();await history({method:'GET',headers:{authorization:token},query:{limit:'5'}},r);
  assert.equal(r.statusCode,200);assert.equal(r.body.enabled,true);assert.equal(r.body.tasks[0].id,'a');assert.equal(r.body.tasks[0].status,'completed');assert.deepEqual(r.body.tasks[0].route,{selected:[]});assert.equal(r.body.tasks[0].result,null);
  assert.equal(r.headers['Cache-Control'],'no-store');
  assert.equal(seen[0].url,'https://example.supabase.co/rest/v1/rpc/poors_list_tasks');assert.equal(seen[0].body.p_limit,5);
 });
 await withStore(async()=>new Response('x',{status:503}),async()=>{
  const r=res();await history({method:'GET',headers:{authorization:token},query:{}},r);
  assert.equal(r.statusCode,502);assert.equal(r.body.error,'STORE_HTTP_503');assert.ok(!JSON.stringify(r.body).includes(SECRET));
 });
});

test('listTasks and logTask report disabled without throwing',async()=>{
 assert.deepEqual(await listTasks(10,{}),{enabled:false,reason:'NOT_CONFIGURED'});
 assert.deepEqual(await logTask({},'',{}),{persisted:false,reason:'STORE_DISABLED'});
});
