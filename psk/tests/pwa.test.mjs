import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const pub=join(dirname(fileURLToPath(import.meta.url)),'..','public');
const manifest=JSON.parse(readFileSync(join(pub,'manifest.webmanifest'),'utf8'));
test('manifest is installable: name, start_url, standalone, 192 and 512 icons that exist',()=>{
 assert.ok(manifest.name&&manifest.short_name);assert.equal(manifest.start_url,'/');assert.equal(manifest.display,'standalone');
 for(const size of ['192x192','512x512'])assert.ok(manifest.icons.some(i=>i.sizes===size),size);
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
 for(const i of manifest.icons)assert.ok(existsSync(join(pub,i.src)),i.src);
});
test('pages link the manifest and register the service worker',()=>{
 for(const p of ['index.html','about.html']){const s=readFileSync(join(pub,p),'utf8');assert.match(s,/rel="manifest" href="\/manifest\.webmanifest"/,p);assert.match(s,/src="\/pwa\.js"/,p);assert.match(s,/apple-touch-icon/,p);}
});
test('service worker never caches the API and precaches only existing files',()=>{
 const sw=readFileSync(join(pub,'sw.js'),'utf8');assert.match(sw,/startsWith\('\/api\/'\)\) return/);
 const shell=JSON.parse(sw.match(/const SHELL = (\[.*?\]);/s)[1].replace(/'/g,'"'));
 for(const f of shell){if(f==='/'||f==='/about')continue;assert.ok(existsSync(join(pub,f)),f);}
});
