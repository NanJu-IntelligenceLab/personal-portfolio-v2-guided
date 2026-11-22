import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join, dirname, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const output = join(project, '.artifacts', 'integrity');
const baselineFile = join(output, 'baseline.json');
const excluded = new Set(['.artifacts', '.cache', 'node_modules', 'playwright-report', 'test-results']);
const rootFiles = new Set(['README.md', '.gitignore', '.gitattributes', 'package.json', 'package-lock.json', 'playwright.config.mjs', 'profile.md']);
const rootDirectories = new Set(['site', '.github', 'scripts', 'tests', 'docs', 'brand', 'version-1-generated']);
const gitFiles = new Set(['HEAD', 'config', 'packed-refs']);

async function collect(source) {
  const files = [];
  async function walk(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = join(directory, entry.name);
      if (prefix === '.git/refs' && !['heads', 'remotes', 'tags'].includes(entry.name)) continue;
      if (entry.isSymbolicLink()) throw new Error(`Link requires separate review: ${rel}`);
      if (excluded.has(entry.name)) continue;
      if (!prefix && !rootFiles.has(entry.name) && !rootDirectories.has(entry.name) && entry.name !== '.git') continue;
      if (rel === '.git' && entry.isDirectory()) {
        for (const child of await readdir(absolute, { withFileTypes: true })) {
          if (child.name === 'refs' && child.isDirectory()) await walk(join(absolute, 'refs'), '.git/refs');
          else if (gitFiles.has(child.name) && child.isFile()) await hash(join(absolute, child.name), `.git/${child.name}`);
        }
      } else if (entry.name === '.git') {
        throw new Error('Unexpected Git directory layout');
      } else if (entry.isDirectory()) await walk(absolute, rel);
      else if (entry.isFile()) await hash(absolute, rel);
    }
  }
  async function hash(path, rel) {
    const data = await readFile(path);
    files.push({ path: rel, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
  }
  await walk(source);
  return files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

const operation = process.argv[2];
if (operation === 'snapshot') {
  const sourceArgument = process.argv[3];
  if (!sourceArgument) throw new Error('Supply the read-only source directory as an argument');
  const source = resolve(sourceArgument);
  const rel = relative(source, project);
  if (!rel || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))) {
    throw new Error('The V2 directory must be outside the protected source');
  }
  const files = await collect(source);
  if (!files.some(file => file.path === 'site/ai-generated-page.html')) throw new Error('Expected V1 source was not found');
  await mkdir(output, { recursive: true });
  await writeFile(baselineFile, JSON.stringify({ source, files }, null, 2) + '\n', { flag: 'wx' });
  console.log(`Recorded ${files.length} protected files using file reads only.`);
} else if (operation === 'verify') {
  const baseline = JSON.parse(await readFile(baselineFile, 'utf8'));
  const current = await collect(baseline.source);
  const stableFiles = baseline.files.filter(file => !file.path.startsWith('.git/refs/') || /^\.git\/refs\/(?:heads|remotes|tags)\//.test(file.path));
  const original = new Map(stableFiles.map(file => [file.path, file]));
  const observed = new Map(current.map(file => [file.path, file]));
  const changes = [];
  for (const [path, file] of original) if (JSON.stringify(file) !== JSON.stringify(observed.get(path))) changes.push(path);
  for (const path of observed.keys()) if (!original.has(path)) changes.push(path);
  const result = { passed: changes.length === 0, protectedFiles: current.length, excludedVolatileBaselineRefs: baseline.files.length - stableFiles.length, changed: changes };
  const destination = join(output, `verification-${Date.now()}.json`);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(result));
  if (changes.length) process.exitCode = 1;
} else throw new Error('Use snapshot <source> or verify');
