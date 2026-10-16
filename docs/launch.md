# Launch playbook

Three posts, three audiences. Post one per day, time-zone-shifted so they get morning US / afternoon EU visibility.

---

## Show HN draft (post Wed/Thu morning US time)

**Title:** Show HN: lazycommit – a CLI that writes conventional commit messages from your diff

**Body:**

I kept rewriting the same `feat: ...`, `fix: ...` lines for every commit. So I wrote a tiny CLI that does it from `git diff --staged`. Heuristic mode is free, offline, and zero-dep — picks a type from filenames + diff keywords, infers scope from the dominant top-level dir, and prints a one-liner.

```
$ lazycommit
fix(auth): null-token guard
```

There's also an `--ai` flag that calls Claude via a hosted API for $5/mo. The free tier is 5/day per IP, no signup. Source is MIT, npm package is `lazycommit`, repo is at the URL.

The interesting design choice was making the free tier useful enough to never want the paid one — but not so useful that nobody upgrades. Heuristic mode is genuinely fine for small diffs; AI mode earns its $5/mo on multi-file refactors and feature commits.

Stack: Node 18+, no deps. The hosted API is a Cloudflare Worker with KV-backed rate limiting and Stripe for the $5/mo tier.

Curious what HN thinks — especially around the free-vs-paid line. Too aggressive? Too generous?

---

## Reddit r/programming (post Tue, between 9–11am ET)

**Title:** I wrote a CLI that generates conventional commit messages from your staged diff (free, zero deps)

**Body:**

Sharing a small tool I built because I was tired of writing the same commit headers. It's called `lazycommit`, runs on Node 18+, and has zero dependencies.

```
npm i -g lazycommit
git add -p
lazycommit -c
```

It looks at file paths and the diff content, picks a type (feat/fix/docs/refactor/perf/etc), and prints a conventional-commit one-liner. It also has an AI mode that calls Claude for higher-quality messages, $5/mo, 5/day free.

Happy to answer questions or take feature requests. Repo in profile.

---

## Twitter / X launch thread (post any time)

1/ I kept writing the same `feat:` and `fix:` lines for every commit so I built a CLI that does it for me. Free, offline, zero deps. `npm i -g lazycommit`

2/ It reads your staged diff, picks a conventional-commit type from the filenames + content, and prints a one-liner. Heuristic mode is fast enough to feel like autocomplete.

3/ If the heuristic isn't good enough there's an `--ai` flag that calls Claude. 5 free generations/day per IP, $5/mo for unlimited. No signup, no telemetry on the free path.

4/ Built it on Node 18 + Cloudflare Workers for the API. Source is MIT. Repo link in bio. Roast me, I'd love feedback on the heuristic rules.