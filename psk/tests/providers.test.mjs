import test from 'node:test';
import assert from 'node:assert/strict';
import {chat,pickModel} from '../engine/providers.mjs';
const msgs=[{role:'user',content:'سلام'}];
const ok=(text,model)=>new Response(JSON.stringify({model,choices:[{message:{content:text}}]}),{status:200});

test('pickModel prefers strong free chat models and never a paid OpenRouter id',()=>{
 assert.equal(pickModel('openrouter',['openai/gpt-4o','meta-llama/llama-3.3-70b-instruct','qwen/qwen3-coder:free']),'qwen/qwen3-coder:free');
 assert.equal(pickModel('openrouter',['openai/gpt-4o','anthropic/claude']),null);
 assert.equal(pickModel('gemini',['models/gemini-2.5-flash-preview-tts','models/text-embedding-004','models/gemini-2.5-flash']),'gemini-2.5-flash');
 assert.equal(pickModel('groq',['whisper-large-v3','llama-3.1-8b-instant','openai/gpt-oss-120b']),'openai/gpt-oss-120b');
});

test('a retired model triggers one rediscovery on the same provider',async()=>{
 const seen=[];
 const fetchImpl=async(url,opts)=>{seen.push(url+' '+(opts?.body?JSON.parse(opts.body).model:''));
  if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'llama-3.1-8b-instant'},{id:'openai/gpt-oss-120b'}]}),{status:200});
  const m=JSON.parse(opts.body).model;
  return m==='openai/gpt-oss-120b'?ok('درود','openai/gpt-oss-120b'):new Response('{"error":"model_not_found"}',{status:404});};
 const out=await chat(msgs,{env:{GROQ_API_KEY:'k'},fetchImpl});
 assert.equal(out.text,'درود');assert.equal(out.model,'openai/gpt-oss-120b');
 assert.equal(seen.filter(s=>s.includes('/models')).length,1);
});

test('an explicit *_MODEL override is never replaced by discovery',async()=>{
 let modelsCalls=0;
 const fetchImpl=async(url)=>{if(url.endsWith('/models')){modelsCalls++;return new Response('{"data":[]}');}return new Response('{}',{status:404});};
 await assert.rejects(chat(msgs,{env:{CEREBRAS_API_KEY:'k',CEREBRAS_MODEL:'my-model'},fetchImpl}),e=>e.code==='PROVIDER_REJECTED');
 assert.equal(modelsCalls,0);
});

test('a 400 on one provider fails over to the next instead of stopping',async()=>{
 const fetchImpl=async(url)=>url.includes('generativelanguage')?ok('ok','gemini-2.5-flash'):url.endsWith('/models')?new Response('{"data":[]}'):new Response('{}',{status:400});
 const out=await chat(msgs,{env:{OPENROUTER_API_KEY:'k',GEMINI_API_KEY:'k',PROVIDER_ORDER:'openrouter,gemini'},fetchImpl});
 assert.equal(out.provider,'gemini');
});
