import fs from 'node:fs';
import path from 'node:path';
const TOKEN = fs.readFileSync('.gh_token','utf8').trim();
const SKIP = new Set(['node_modules','.git','.npmcache','frames','demo-b-frames']);
function walk(d, out=[]) {
  for (const e of fs.readdirSync(d,{withFileTypes:true})) {
    const full = path.join(d,e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(full,out); }
    else if (!['.gh_token','src.zip','.DS_Store'].includes(e.name) && !e.name.endsWith('.mp4')) out.push({full, rel: path.relative(process.cwd(), full)});
  }
  return out;
}
const files = walk(process.cwd());
for (const f of files) {
  const buf = fs.readFileSync(f.full);
  process.stdout.write(`${f.rel} (${buf.length}B) -> `);
  const res = await fetch('https://api.github.com/repos/zhaoyue-lu/vibe-video/git/blobs', {
    method:'POST',
    headers:{Authorization:`Bearer ${TOKEN}`,Accept:'application/vnd.github+json',Authorization2:'x','Content-Type':'application/json','User-Agent':'dbg'},
    body: JSON.stringify({content: buf.toString('base64'), encoding:'base64'}),
  });
  console.log(res.status);
  if (!res.ok) { console.log((await res.text()).slice(0,200)); break; }
}
