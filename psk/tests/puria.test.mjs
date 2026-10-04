import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const dir=join(dirname(fileURLToPath(import.meta.url)),'..','public','puria');
const html=readFileSync(join(dir,'index.html'),'utf8');
const js=readFileSync(join(dir,'puria.js'),'utf8');
test('PURIAS page assets exist and only load local scripts',()=>{
 for(const f of ['puria.css','puria.js','puria-salimi-salt-flat.jpeg']){assert.ok(existsSync(join(dir,f)),f);assert.ok(html.includes('/puria/'+f),f)}
 for(const m of html.matchAll(/<script[^>]*src="([^"]+)"/g))assert.ok(!/^https?:/.test(m[1]),m[1]);
});
test('PURIAS keeps bilingual copy and WhatsApp conversion',()=>{
 assert.match(js,/en: \{/);assert.match(js,/fa: \{/);
 assert.match(js,/https:\/\/wa\.me\/989127038177/);
 assert.equal((html.match(/<a class="[^"]*\bwa"/g)||[]).length,2);
});
test('about page links to the PURIAS portfolio',()=>{
 const about=readFileSync(join(dir,'..','about.html'),'utf8');
 assert.match(about,/href="puria\/"/);
 assert.doesNotMatch(about,/نام و نقش به‌زودی/);
});
