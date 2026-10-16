# Pricing & revenue model

## Free tier (forever)
- Heuristic mode, runs offline
- 5 AI generations / IP / day
- MIT license
- No signup, no telemetry

## Pro tier — $5/month
- Unlimited AI generations
- Higher-quality messages via Claude Haiku
- Hosted API at api.lazycommit.dev
- Cancel anytime via Stripe customer portal

## Why $5/mo?
- Under the impulse-purchase threshold for dev tools
- Stripe fees ($0.40 + 2.9%) eat ~$0.55 — net $4.45/customer
- 100 customers = ~$445/mo, covers coffee
- Volume makes this viable; an MCP server pivot could push $20/mo

## Revenue streams
1. **Stripe subscriptions** — primary, scales with active users
2. **GitHub Sponsors** — long tail from open-source users
3. **Buy Me a Coffee / Ko-fi** — one-time tips from happy users

## Costs (per 1000 Pro users)
- Anthropic API (Claude Haiku): ~$0.001/msg × ~10 msg/day × 30 days × 1000 = **$300/mo**
- Cloudflare Workers + KV: ~**$5/mo** (well within paid plan)
- Stripe fees: ~**$0.55/subscriber/mo**
- **Margin: ~$4,195/mo per 1000 paying users**

## Targets
- 10 paying users in month 1 (validation)
- 100 in month 3
- 1,000 in month 12

## What to ship next (if traction)
- Body line in AI mode (`feat: ...` + paragraph)
- Multi-commit splitting for big changes
- Editor extensions (VSCode, JetBrains)
- Team / org pricing at $20/mo (5 seats)