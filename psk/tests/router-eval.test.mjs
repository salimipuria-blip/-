import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProductionRegistry, readGold, evaluate} from '../scripts/eval-router.mjs';

// Regression floors sit slightly below the measured values (docs/QA_REPORT.md, "Router evaluation"):
// overall hit@5 0.979, holdout hit@5 0.947, MRR 0.945 on 96 gold queries. Raise them when the router improves.
const FLOOR={hit5:0.95,holdoutHit5:0.89,mrr:0.9};

const gold=readGold();
const {registry}=loadProductionRegistry();
const report=evaluate(registry,gold,{repeat:1});

test('gold set is well-formed and names only real skills',()=>{
 assert.ok(gold.length>=60,`gold set has ${gold.length} queries`);
 assert.deepEqual(report.unknownExpected,[]);
 for(const lang of ['fa','finglish','en'])assert.ok(gold.some(g=>g.lang===lang),`no ${lang} queries`);
 assert.ok(gold.filter(g=>g.split==='holdout').length>=20,'needs a holdout split of at least 20 queries');
});

test(`router hit@5 on the full gold set stays >= ${FLOOR.hit5}`,()=>{
 const misses=report.misses.map(m=>`${m.q} -> ${m.top3.join(', ')}`).join('\n');
 assert.ok(report.overall.hit5>=FLOOR.hit5,`hit@5 ${report.overall.hit5} < ${FLOOR.hit5}\n${misses}`);
 assert.ok(report.overall.mrr>=FLOOR.mrr,`MRR ${report.overall.mrr} < ${FLOOR.mrr}`);
});

test(`router generalizes: holdout hit@5 stays >= ${FLOOR.holdoutHit5}`,()=>{
 assert.ok(report.bySplit.holdout.hit5>=FLOOR.holdoutHit5,`holdout hit@5 ${report.bySplit.holdout.hit5}`);
});
