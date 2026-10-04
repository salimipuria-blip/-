// Local stand-in for Vercel: serves public/ and maps /api/<name> to api/<name>.js handlers.
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));const pub=path.join(root,'public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const port=Number(process.env.PORT||3000);
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');
  if(url.pathname.startsWith('/api/')){
    const name=url.pathname.slice(5).replace(/[^a-z]/g,'');const file=path.join(root,'api',name+'.js');
    if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
    let body='';for await(const c of req)body+=c;
    const vres={status(n){res.statusCode=n;return this},setHeader(k,v){res.setHeader(k,v);return this},json(v){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(v));return this}};
    const {default:h}=await import(file);
    return h({method:req.method,headers:req.headers,query:Object.fromEntries(url.searchParams),body:body?(()=>{try{return JSON.parse(body)}catch{return body}})():undefined},vres);
  }
  const p=path.join(pub,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));
  if(!p.startsWith(pub)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);return res.end('not found');}
  res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(res);
}).listen(port,()=>console.log('http://localhost:'+port));
