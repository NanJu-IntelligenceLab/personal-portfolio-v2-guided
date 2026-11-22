import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicFiles = new Set(['.gitignore', '.gitattributes', 'README.md', 'package.json', 'package-lock.json', 'playwright.config.mjs']);
const publicFolders = ['site/', 'scripts/', 'tests/', '.github/workflows/'];
const forbidden = /(?:^|\/)(?:\.artifacts|\.cache|node_modules|test-results|playwright-report|\.env(?:\.[^/]*)?)(?:\/|$)|(?:^|\/)profile\.md$/i;
const machinePath = /\b[A-Z]:[\\/]|\/(?:Users|home)\/[^\s/]+|file:\/\//;
const entryPage = 'site/me-designed-page.html';
const approvedSite = new Set(['site/.nojekyll', 'site/index.html', entryPage, 'site/assets/css/styles.css', 'site/assets/js/main.js', 'site/assets/brand/mark.svg', 'site/assets/brand/favicon.svg']);
const staged = process.argv.includes('--staged');
const committed = process.argv.includes('--committed');
let paths;
if (staged || committed) {
  const arguments_ = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'];
  paths = execFileSync('git', ['-C', root, ...arguments_], { encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }).split('\0').filter(Boolean);
} else {
  paths = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const rel = relative(root, path).replaceAll('\\', '/');
      if (entry.isSymbolicLink()) throw new Error(`Public content must not contain links: ${rel}`);
      if (entry.isDirectory()) await walk(path);
      else paths.push(rel);
    }
  }
  for (const file of publicFiles) paths.push(file);
  for (const folder of ['site', 'scripts', 'tests', '.github']) await walk(join(root, folder));
}
const issues = [];
for (const path of paths) {
  if (forbidden.test(path) || !(publicFiles.has(path) || publicFolders.some(prefix => path.startsWith(prefix)))) issues.push(`Not on the public allowlist: ${path}`);
  if (path.startsWith('site/') && !approvedSite.has(path)) issues.push(`Not on the deployment allowlist: ${path}`);
  if (/\.(?:png|jpe?g|webp)$/i.test(path)) issues.push(`Screenshot requires separate publication review: ${path}`);
  if (/\.(?:html|css|js|mjs|md|json|yml|svg)$/.test(path) || path.startsWith('.git')) {
    const text = staged || committed
      ? execFileSync('git', ['-C', root, 'show', `:${path}`], { encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } })
      : await readFile(join(root, path), 'utf8');
    if (machinePath.test(text)) issues.push(`Machine-specific path found: ${path}`);
    if (/document_type:\s*personal_profile|document_version:\s*["']?2\.0/.test(text)) issues.push(`Original profile content found: ${path}`);
    if (/-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/.test(text)) issues.push(`Private material found: ${path}`);
  }
}
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else console.log(`Public-file boundary passed for ${paths.length} ${staged ? 'staged' : committed ? 'tracked' : 'candidate'} files. No development records or screenshots are approved for commit yet.`);
