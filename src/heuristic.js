// Pure functions, exported for testing. Mirrors the logic in src/index.js.
const TYPE_WEIGHTS = {
  feat: /^(feat|feature|add)/i,
  fix: /\b(fix|bug|broken|error|crash|leak|null|undefined|regression)/i,
  docs: /\b(README|\.md|docs?|comment)/i,
  style: /\b(format|lint|prettier|whitespace|indent)/i,
  refactor: /\b(refactor|restructure|reorganize|rename|move|extract)/i,
  perf: /\b(perf|cache|optimi[sz]e|speed|faster|memo)/i,
  test: /\b(test|spec|coverage|mock)/i,
  chore: /\b(deps?|package\.json|lockfile|yarn|npm|pnpm|bump|version)/i,
  ci: /\b(\.github|\.gitlab|workflow|ci|action|circle)/i,
  build: /\b(webpack|vite|rollup|tsconfig|babel|build|dist)/i,
};

export function inferType(diff, files) {
  for (const file of files) {
    for (const [type, re] of Object.entries(TYPE_WEIGHTS)) {
      if (re.test(file)) return type;
    }
  }
  for (const [type, re] of Object.entries(TYPE_WEIGHTS)) {
    if (re.test(diff)) return type;
  }
  return 'chore';
}

export function inferScope(files) {
  if (!files.length) return '';
  const top = files.map((f) => f.split('/')[0]);
  const counts = {};
  for (const d of top) counts[d] = (counts[d] || 0) + 1;
  const [name, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (name && !name.includes('.') && n > 0 && top.length > 1) return name;
  return '';
}

export function summarize(diff, files = []) {
  if (!diff.trim()) return 'update';
  const lines = diff.split('\n');
  const added = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
  const removed = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;
  const hunkHeaders = lines.filter((l) => l.startsWith('@@')).slice(0, 3);
  if (hunkHeaders.length) {
    const fn = hunkHeaders[0].match(/@@[^a-zA-Z]+([A-Za-z][\w.-]+)/);
    if (fn && fn[1] && fn[1] !== 'function') return `update ${fn[1]}`;
  }
  if (added > removed * 2 && added > 5) return `add ${Math.max(1, Math.round(added / 20))} change${added > 20 ? 's' : ''}`;
  if (removed > added * 2 && removed > 5) return `remove ${Math.max(1, Math.round(removed / 20))} line${removed > 20 ? 's' : ''}`;
  return `update ${files.length || 1} file${files.length === 1 ? '' : 's'}`;
}

export function heuristicMessage(files, diff) {
  const type = inferType(diff, files);
  const scope = inferScope(files);
  const subject = summarize(diff, files);
  const scopePart = scope ? `(${scope})` : '';
  return `${type}${scopePart}: ${subject}`;
}