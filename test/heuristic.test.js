import test from 'node:test';
import assert from 'node:assert/strict';
import { inferType, inferScope, summarize, heuristicMessage } from '../src/heuristic.js';

test('inferType picks type from filename patterns', () => {
  assert.equal(inferType('', ['README.md']), 'docs');
  assert.equal(inferType('', ['.github/workflows/ci.yml']), 'ci');
});

test('inferType picks type from diff content', () => {
  assert.equal(inferType('this fixes a regression in flow', []), 'fix');
  assert.equal(inferType('cache the response for perf', []), 'perf');
  assert.equal(inferType('bump version in deps', []), 'chore');
});

test('inferType defaults to chore', () => {
  assert.equal(inferType('', []), 'chore');
  assert.equal(inferType('misc tweaks', ['random.txt']), 'chore');
});

test('inferScope returns top dir when files share one', () => {
  assert.equal(inferScope(['src/a.js', 'src/b.js', 'src/c.js']), 'src');
});

test('inferScope returns empty for single file at root', () => {
  assert.equal(inferScope(['package.json']), '');
});

test('inferScope picks dominant dir when mixed', () => {
  // 2 src vs 1 test, src wins
  assert.equal(inferScope(['src/a.js', 'src/b.js', 'test/a.js']), 'src');
});

test('summarize extracts symbol name from hunk header', () => {
  const diff = `@@ -10,3 +10,5 @@ loginState\n+  foo\n`;
  assert.match(summarize(diff), /loginState/);
});

test('summarize falls back to update N files when no hunk info', () => {
  assert.equal(summarize(''), 'update');
  assert.match(summarize('+x\n+y', ['a.js', 'b.js']), /2 files/);
  assert.match(summarize('+x\n+y', ['a.js']), /1 file\b/);
});

test('heuristicMessage produces conventional-commit format', () => {
  const m = heuristicMessage(['src/auth/login.js'], 'fix crash on null token');
  assert.match(m, /^(fix|feat|chore|docs|refactor|perf|style|test|build|ci)\(?[\w-]*\)?: /);
  assert.ok(m.includes(':'));
});

test('heuristicMessage uses scope when shared dir exists', () => {
  const m = heuristicMessage(['src/a.js', 'src/b.js'], 'feat new endpoint');
  assert.match(m, /^feat\(src\):/);
});