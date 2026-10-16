// Quick demo of the heuristic message generator without needing a git repo.
import { heuristicMessage } from '../src/heuristic.js';

const cases = [
  {
    name: 'fix in src/auth/login.js',
    files: ['src/auth/login.js'],
    diff: `--- a/src/auth/login.js\n+++ b/src/auth/login.js\n@@ -10,3 +10,5 @@ function loginState() {\n+  if (!token) return null;\n+  // fix crash when token is undefined\n+  return verify(token);\n`,
  },
  {
    name: 'docs update',
    files: ['README.md'],
    diff: `--- a/README.md\n+++ b/README.md\n@@ -1,1 +1,3 @@\n+# lazycommit\n+\n+Generate commit messages from diffs.\n`,
  },
  {
    name: 'deps bump',
    files: ['package.json', 'package-lock.json'],
    diff: `--- a/package.json\n+++ b/package.json\n@@ -3,3 +3,3 @@\n-  "lodash": "4.17.20"\n+  "lodash": "4.17.21"\n`,
  },
];

let failed = 0;
for (const c of cases) {
  const got = heuristicMessage(c.files, c.diff);
  console.log(`[${c.name}]`);
  console.log(`  ${got}`);
  if (!got || !got.includes(':')) failed++;
}

if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log('\nall cases produced a conventional-commit-style message');