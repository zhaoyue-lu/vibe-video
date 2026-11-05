// Push the workspace to GitHub via the REST API (no local git needed).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TOKEN = fs.readFileSync(path.join(ROOT, '.gh_token'), 'utf8').trim();
const API = 'https://api.github.com';
const REPO = 'vibe-video';

const SKIP_DIRS = new Set(['node_modules', '.git', '.npmcache', 'frames', 'demo-b-frames']);
const SKIP_FILES = new Set(['.gh_token', 'src.zip']);

async function gh(method, url, body, attempt = 1) {
  const res = await fetch(API + url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'vibe-video-push',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  // the proxy chain throws the odd transient 400/401/429/5xx on big bodies -> retry
  if (!res.ok && attempt <= 5 && (res.status >= 500 || [400, 401, 429].includes(res.status))) {
    await new Promise((r) => setTimeout(r, 1000 * attempt));
    return gh(method, url, body, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else {
      if (SKIP_FILES.has(entry.name)) continue;
      if (entry.name.endsWith('.mp4')) continue;
      if (entry.name === '.DS_Store') continue;
      out.push({ full, rel });
    }
  }
  return out;
}

const files = walk(ROOT);
console.log(`files: ${files.length}`);

// 1. who am I
const me = await gh('GET', '/user');
console.log(`user: ${me.login}`);

// 2. create repo if missing
let repo;
try {
  repo = await gh('GET', `/repos/${me.login}/${REPO}`);
  console.log(`repo exists: ${repo.html_url}`);
} catch (e) {
  if (!String(e.message).includes('404')) throw e;
  repo = await gh('POST', '/user/repos', {
    name: REPO,
    private: false,
    description: 'vibe video: code-generated short videos',
    auto_init: false,
  });
  console.log(`repo created: ${repo.html_url}`);
}

// 3. the Git API refuses to work on an empty repo -> seed a first commit
let refSha = null;
try {
  const existing = await gh('GET', `/repos/${me.login}/${REPO}/git/ref/heads/main`);
  refSha = existing.object.sha;
  console.log('repo has commits');
} catch (e) {
  console.log('empty repo, seeding initial commit');
  await gh('PUT', `/repos/${me.login}/${REPO}/contents/.vibe-init`, {
    message: 'init',
    content: Buffer.from('init\n').toString('base64'),
  });
  const seeded = await gh('GET', `/repos/${me.login}/${REPO}/git/ref/heads/main`);
  refSha = seeded.object.sha;
}

// 4. blobs
const tree = [];
for (const f of files) {
  const buf = fs.readFileSync(f.full);
  const blob = await gh('POST', `/repos/${me.login}/${REPO}/git/blobs`, {
    content: buf.toString('base64'),
    encoding: 'base64',
  });
  tree.push({ path: f.rel.split(path.sep).join('/'), mode: '100644', type: 'blob', sha: blob.sha });
  process.stdout.write('.');
}
console.log(`\nblobs: ${tree.length}`);

// 5. tree + commit + move the ref
const treeRes = await gh('POST', `/repos/${me.login}/${REPO}/git/trees`, { tree });
const commit = await gh('POST', `/repos/${me.login}/${REPO}/git/commits`, {
  message: 'vibe-video: two demo pipelines + cloud render workflow',
  tree: treeRes.sha,
  parents: [refSha],
});

await gh('PATCH', `/repos/${me.login}/${REPO}/git/refs/heads/main`, { sha: commit.sha, force: true });

console.log(`commit: ${commit.sha}`);
console.log(`url: ${repo.html_url}`);
