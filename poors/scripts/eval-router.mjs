#!/usr/bin/env node
// Router evaluation harness: hit@k, MRR and latency of routeSkills() against tests/gold.jsonl.
//   node scripts/eval-router.mjs                 human-readable report (train misses listed)
//   node scripts/eval-router.mjs --json          machine-readable report
//   node scripts/eval-router.mjs --show-holdout  also list holdout misses (do NOT use while tuning)
//   node scripts/eval-router.mjs --gold <file>   alternative gold set
//   node scripts/eval-router.mjs --router <file> evaluate another router module (A/B against a baseline copy)
//   node scripts/eval-router.mjs --min-hit5 0.9  exit 1 if overall hit@5 falls below the value
// Gold rows: {"q","expected":[skill names],"lang":"fa|finglish|en","split"?:"holdout","set"?:"post-freeze"}
import fs from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import * as productionRouter from '../engine/router.mjs';

const here=p=>fileURLToPath(new URL(p, import.meta.url));
export const DEFAULT_GOLD=here('../tests/gold.jsonl');

/** Load the registry exactly as api/_core.mjs does (verified SKILL.md bodies included). */
export function loadProductionRegistry(router=productionRouter){
 const t0=performance.now();
 const registry=router.loadRegistry(new URL('../data/skills-registry.json', import.meta.url),{
  skillsRoot:here('../data'),repairedFile:here('../data/skills-repaired.json')});
 return {registry,loadMs:performance.now()-t0};
}

export function readGold(file=DEFAULT_GOLD){
 return fs.readFileSync(file,'utf8').split('\n').map(s=>s.trim()).filter(Boolean).map((line,i)=>{
  const row=JSON.parse(line);
  if(typeof row.q!=='string'||!Array.isArray(row.expected)||!row.expected.length)throw Error(`gold line ${i+1}: needs q and expected[]`);
  return {q:row.q,expected:row.expected,lang:row.lang||'fa',split:row.split==='holdout'?'holdout':'train',set:row.set||'initial'};
 });
}

function percentile(values,p){
 if(!values.length)return 0;const s=[...values].sort((a,b)=>a-b);
 return s[Math.min(s.length-1,Math.ceil(p/100*s.length)-1)];
}
function summarize(rows){
 const n=rows.length||1,hit=k=>rows.filter(r=>r.rank&&r.rank<=k).length/n;
 const round=x=>Math.round(x*1000)/1000;
 return {n:rows.length,hit1:round(hit(1)),hit3:round(hit(3)),hit5:round(hit(5)),mrr:round(rows.reduce((s,r)=>s+(r.rank?1/r.rank:0),0)/n)};
}

/** Route every gold query (top 25) and score the rank of the first acceptable skill. */
export function evaluate(registry,gold,{repeat=3,router=productionRouter}={}){
 const names=new Set(registry.records.map(r=>r.name));
 const unknown=[...new Set(gold.flatMap(g=>g.expected).filter(n=>!names.has(n)))];
 const rows=[],latencies=[];
 for(const g of gold){
  let routed;
  for(let i=0;i<repeat;i++){const t=performance.now();routed=router.routeSkills(registry,g.q,{limit:25});latencies.push(performance.now()-t);}
  const ranked=routed.selected.map(s=>s.name);const idx=ranked.findIndex(n=>g.expected.includes(n));
  rows.push({...g,rank:idx<0?null:idx+1,top3:ranked.slice(0,3)});
 }
 const group=key=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].sort().map(v=>[v,summarize(rows.filter(r=>r[key]===v))]));
 const byLangSplit={};for(const split of ['train','holdout'])byLangSplit[split]=Object.fromEntries(
  [...new Set(rows.map(r=>r.lang))].sort().map(l=>[l,summarize(rows.filter(r=>r.split===split&&r.lang===l))]));
 return {overall:summarize(rows),bySplit:group('split'),bySet:group('set'),byLang:group('lang'),byLangSplit,
  latencyMs:{p50:+percentile(latencies,50).toFixed(3),p95:+percentile(latencies,95).toFixed(3),max:+Math.max(...latencies).toFixed(3)},
  unknownExpected:unknown,
  misses:rows.filter(r=>!r.rank||r.rank>5).map(({q,lang,split,set,expected,rank,top3})=>({q,lang,split,set,expected,rank,top3}))};
}

async function main(argv){
 const opt=k=>{const i=argv.indexOf(k);return i>=0?argv[i+1]:undefined;};
 const json=argv.includes('--json'),showHoldout=argv.includes('--show-holdout');
 const gold=readGold(opt('--gold')||DEFAULT_GOLD);
 const router=opt('--router')?await import(pathToFileURL(fs.realpathSync(opt('--router'))).href):productionRouter;
 const {registry,loadMs}=loadProductionRegistry(router);
 const report={loadMs:Math.round(loadMs),...evaluate(registry,gold,{router})};
 const min=opt('--min-hit5');const failed=min!==undefined&&report.overall.hit5<Number(min);
 if(failed)process.exitCode=1;
 if(json){
  if(!showHoldout)report.misses=report.misses.filter(m=>m.split!=='holdout');
  console.log(JSON.stringify(report,null,1));return;
 }
 const line=(label,m)=>`${label.padEnd(18)} n=${String(m.n).padStart(3)}  hit@1 ${m.hit1.toFixed(3)}  hit@3 ${m.hit3.toFixed(3)}  hit@5 ${m.hit5.toFixed(3)}  MRR ${m.mrr.toFixed(3)}`;
 console.log(`Router eval — ${gold.length} gold queries, registry load ${report.loadMs} ms, route latency p50 ${report.latencyMs.p50} ms / p95 ${report.latencyMs.p95} ms`);
 console.log(line('overall',report.overall));
 for(const [k,m] of Object.entries(report.bySplit))console.log(line('split:'+k,m));
 for(const [k,m] of Object.entries(report.bySet))console.log(line('set:'+k,m));
 for(const [k,m] of Object.entries(report.byLang))console.log(line('lang:'+k,m));
 for(const [s,langs] of Object.entries(report.byLangSplit))for(const [l,m] of Object.entries(langs))if(m.n)console.log(line(`${s}/${l}`,m));
 if(report.unknownExpected.length)console.log('\nUNKNOWN expected skill names:',report.unknownExpected.join(', '));
 const shown=report.misses.filter(m=>showHoldout||m.split!=='holdout');
 const hidden=report.misses.length-shown.length;
 console.log(`\nMisses (not in top 5): ${report.misses.length}${hidden?` (${hidden} holdout hidden; --show-holdout to list)`:''}`);
 for(const m of shown)console.log(`- [${m.split}/${m.lang}] ${m.q}\n    expected ${m.expected.join(', ')} | rank ${m.rank??'-'} | top3 ${m.top3.join(', ')}`);
 if(failed)console.log(`\nFAIL: overall hit@5 ${report.overall.hit5} < required ${min}`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main(process.argv.slice(2));
