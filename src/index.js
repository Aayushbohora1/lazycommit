#!/usr/bin/env node
// lazycommit — generate a conventional commit message from staged diff
// Free: heuristic (works offline, zero deps).
// Pro (--ai): calls hosted API at api.lazycommit.dev (set LAZYCOMMIT_API_KEY).
//   Get a key: https://lazycommit.dev/pricing

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { heuristicMessage } from './heuristic.js';

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

function parseArgs(argv) {
  const out = { _: [], ai: false, dry: false, commit: false, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ai') out.ai = true;
    else if (a === '--dry' || a === '-d') out.dry = true;
    else if (a === '--commit' || a === '-c') out.commit = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--version' || a === '-v') out.version = true;
    else if (a.startsWith('--')) out[a.slice(2)] = true;
    else out._.push(a);
  }
  return out;
}

function inGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getStagedDiff() {
  try {
    return execSync('git diff --staged --unified=3', { cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch {
    return '';
  }
}

function getChangedFiles() {
  try {
    const out = execSync('git diff --staged --name-only', { cwd, encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// ---- AI commit message (paid, hosted) ----
async function aiMessage(diff, files) {
  const apiKey = process.env.LAZYCOMMIT_API_KEY;
  if (!apiKey) {
    process.stderr.write(
      'lazycommit: --ai requires a key. Free tier at https://lazycommit.dev (5/day) or set LAZYCOMMIT_API_KEY.\n' +
      '  Falling back to heuristic message.\n'
    );
    return heuristicMessage(files, diff);
  }
  try {
    const res = await fetch('https://api.lazycommit.dev/v1/commit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ diff: diff.slice(0, 50_000), files }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.message || heuristicMessage(files, diff);
  } catch (e) {
    process.stderr.write(`lazycommit: ai failed (${e.message}), using heuristic.\n`);
    return heuristicMessage(files, diff);
  }
}

function printHelp() {
  process.stdout.write(`lazycommit — generate a conventional commit message from staged changes

Usage:
  lazycommit [flags]

Flags:
  --ai         Use hosted AI for higher-quality messages (requires LAZYCOMMIT_API_KEY)
  --dry, -d    Print the message but do not commit
  --commit, -c Print and commit (git commit -m)
  --help, -h   Show this help
  --version, -v  Show version

Free forever for heuristic mode. Upgrade at https://lazycommit.dev/pricing
`);
}

function readVersion() {
  // Read from package.json two dirs above
  try {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

async function main() {
  if (args.help) return printHelp();
  if (args.version) return process.stdout.write(`lazycommit ${readVersion()}\n`);
  if (!inGitRepo()) {
    process.stderr.write('lazycommit: not a git repository\n');
    process.exit(1);
  }
  const diff = getStagedDiff();
  if (!diff.trim()) {
    process.stderr.write('lazycommit: no staged changes. Run `git add` first.\n');
    process.exit(1);
  }
  const files = getChangedFiles();
  const msg = args.ai ? await aiMessage(diff, files) : heuristicMessage(files, diff);
  process.stdout.write(msg + '\n');
  if (args.commit && !args.dry) {
    try {
      execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd, stdio: 'inherit' });
    } catch (e) {
      process.exit(e.status || 1);
    }
  }
}

main().catch((e) => {
  process.stderr.write(`lazycommit: ${e.message}\n`);
  process.exit(1);
});