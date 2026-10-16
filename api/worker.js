// Cloudflare Worker — api.lazycommit.dev
// POST /v1/commit with body { diff, files } and Authorization: Bearer <API_KEY>
// Free tier: 5/day per IP. Pro: $5/mo via Stripe — set PRO_KEYS in wrangler secrets.
//
// Wrangler secrets to configure:
//   STRIPE_SECRET_KEY      — for checking Pro subscriptions
//   ANTHROPIC_API_KEY      — Claude call for the AI message
//   PRO_KEYS               — JSON map of apiKey -> { stripeCustomerId, expiresAt }
//
// KV namespace binding:
//   RATE_LIMIT             — key: ip, value: { count, day }
//
// Deploy:  npx wrangler deploy

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok');
    if (url.pathname !== '/v1/commit' || req.method !== 'POST') {
      return new Response('not found', { status: 404 });
    }

    // --- rate limit ---
    const ip = req.headers.get('cf-connecting-ip') || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    const rlKey = `${ip}:${day}`;
    const rlRaw = await env.RATE_LIMIT.get(rlKey);
    const rl = rlRaw ? JSON.parse(rlRaw) : { count: 0 };
    const apiKey = req.headers.get('authorization')?.replace(/^Bearer /, '');
    const isPro = apiKey && await isProKey(apiKey, env);
    if (!isPro && rl.count >= 5) {
      return json({ error: 'free_limit_reached', upgrade_url: 'https://lazycommit.dev/pricing' }, 429);
    }
    if (!isPro) {
      await env.RATE_LIMIT.put(rlKey, JSON.stringify({ count: rl.count + 1 }), { expirationTtl: 86400 * 2 });
    }

    // --- input ---
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }
    const diff = String(body.diff ?? '').slice(0, 50_000);
    const files = Array.isArray(body.files) ? body.files.slice(0, 200).map(String) : [];
    if (!diff) return json({ error: 'diff_required' }, 400);

    // --- generate ---
    const message = await generateCommit(diff, files, env);
    return json({ message });
  },
};

async function isProKey(key, env) {
  try {
    const raw = env.PRO_KEYS;
    if (!raw) return false;
    const map = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const entry = map[key];
    if (!entry) return false;
    return new Date(entry.expiresAt).getTime() > Date.now();
  } catch {
    return false;
  }
}

async function generateCommit(diff, files, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return heuristic(files);
  }
  const prompt = `Generate a single-line conventional commit message for the following diff.
Files changed: ${files.join(', ') || '(none)'}

Diff (truncated):
\`\`\`diff
${diff.slice(0, 20_000)}
\`\`\`

Reply with ONLY the commit message. No code block, no explanation. Format: <type>(<scope>): <subject>
Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text || !text.includes(':')) throw new Error('bad output');
    // first non-empty line, max 72 chars on the subject
    const line = text.split('\n').find((l) => l.trim()) || '';
    return line.slice(0, 100);
  } catch (e) {
    return heuristic(files);
  }
}

function heuristic(files) {
  const scope = files.length && files[0].includes('/') ? files[0].split('/')[0] : '';
  const type = files.some((f) => /\.test\.|\.spec\./.test(f))
    ? 'test'
    : files.some((f) => /README|\.md/.test(f))
    ? 'docs'
    : files.some((f) => /package\.json|lock/.test(f))
    ? 'chore'
    : 'feat';
  return `${type}${scope ? `(${scope})` : ''}: update ${files.length || 1} file${files.length === 1 ? '' : 's'}`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });
}