import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const pub=join(dirname(fileURLToPath(import.meta.url)),'..','public');
const about=readFileSync(join(pub,'about.html'),'utf8');
test('about page is Persian RTL with a single h1 and a title',()=>{
 assert.match(about,/<html lang="fa" dir="rtl">/);
 assert.equal((about.match(/<h1[\s>]/g)||[]).length,1);
 assert.match(about,/<title>[^<]+<\/title>/);
 assert.match(about,/<meta name="description"/);
});
test('every local src/href on the about page resolves to a real file',()=>{
 const refs=[...about.matchAll(/(?:src|href|content)="([^"#:]+\.(?:html|css|js|webp))(?:#[^"]*)?"/g)].map(m=>m[1]);
 assert.ok(refs.length>5);
 for(const r of refs)assert.ok(existsSync(join(pub,r)),'missing '+r);
});
test('every image on the about page has alt text',()=>{
 for(const img of about.match(/<img[^>]*>/g))assert.match(img,/alt="[^"]+"/);
});
test('home page links to the about page in desktop and mobile nav',()=>{
 const home=readFileSync(join(pub,'index.html'),'utf8');
 assert.equal((home.match(/href="about\.html"/g)||[]).length,2);
});
test('brand is PSK everywhere; the old name does not appear in site files',()=>{
 const root=join(pub,'..');
 for(const f of ['public/index.html','public/about.html','public/app.js','public/engine-ui.js','README.md','package.json']){
  assert.doesNotMatch(readFileSync(join(root,f),'utf8'),/poors/i,f);
 }
 assert.match(about,/<span class="brand-mark">PSK</);
});
