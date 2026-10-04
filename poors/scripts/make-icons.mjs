// Renders the POORS / ALGORITHME 3000 app icons as PNG via Playwright (Chromium).
// Usage: node scripts/make-icons.mjs   (falls back to a globally installed Playwright.)
import {createRequire} from 'node:module';import {execSync} from 'node:child_process';
import path from 'node:path';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(require.resolve('playwright',{paths:[execSync('npm root -g').toString().trim()]}))}
const out=path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))),'public','icons');
fs.mkdirSync(out,{recursive:true});

// scale: fraction of the mark size (maskable must stay inside the 80% safe circle).
function svg(size,{scale=1,label=true}={}){
  const s=512,k=scale,c=s/2;
  const R=170*k,r2=128*k,d=78*k;
  const nodes=[0,60,120,180,240,300].map(a=>{const t=(a-90)*Math.PI/180;return `<circle cx="${(c+R*Math.cos(t)).toFixed(1)}" cy="${(c+R*Math.sin(t)).toFixed(1)}" r="${9*k}" fill="#00E5FF"/>`}).join('');
  const q=d*0.48;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
<defs>
 <radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#0B1E38"/><stop offset=".55" stop-color="#07111F"/><stop offset="1" stop-color="#04080F"/></radialGradient>
 <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00E5FF"/><stop offset="1" stop-color="#287BFF"/></linearGradient>
 <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#287BFF" stop-opacity=".5"/><stop offset="1" stop-color="#287BFF" stop-opacity="0"/></radialGradient>
 <linearGradient id="dia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0EDE8"/><stop offset="1" stop-color="#9FDFFF"/></linearGradient>
</defs>
<rect width="${s}" height="${s}" fill="url(#bg)"/>
<circle cx="${c}" cy="${c}" r="${R*1.25}" fill="url(#glow)"/>
<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="url(#ring)" stroke-width="${14*k}"/>
<circle cx="${c}" cy="${c}" r="${r2}" fill="none" stroke="#287BFF" stroke-opacity=".45" stroke-width="${4*k}" stroke-dasharray="${10*k} ${12*k}"/>
${nodes}
<path d="M${c} ${c-d} L${c+d} ${c} L${c} ${c+d} L${c-d} ${c} Z" fill="none" stroke="url(#dia)" stroke-width="${12*k}" stroke-linejoin="round"/>
<path d="M${c} ${c-q} L${c+q} ${c} L${c} ${c+q} L${c-q} ${c} Z" fill="#00E5FF"/>
${label?`<text x="${c}" y="${c+R+53*k}" text-anchor="middle" font-family="DejaVu Sans Mono, Menlo, monospace" font-weight="700" font-size="${40*k}" letter-spacing="${6*k}" fill="#F0EDE8">3000</text>`:''}
</svg>`;
}
const targets=[
  ['icon-192.png',192,{scale:1}],
  ['icon-512.png',512,{scale:1}],
  ['icon-maskable-512.png',512,{scale:0.76}],
  ['apple-touch-icon.png',180,{scale:0.92}],
  ['favicon-32.png',32,{scale:1.3,label:false}],
];
const browser=await pw.chromium.launch();
try{
  for(const [name,size,opt] of targets){
    const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#04080F">${svg(size,opt)}</body></html>`);
    await page.screenshot({path:path.join(out,name),clip:{x:0,y:0,width:size,height:size}});
    await page.close();console.log('wrote',name);
  }
}finally{await browser.close()}
