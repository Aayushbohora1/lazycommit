# Hosted API

`api/worker.js` is a [Cloudflare Worker](https://workers.cloudflare.com/) that powers the `--ai` flag for paying users.

## Setup

```sh
cd api
npm i -g wrangler
wrangler login
wrangler kv namespace create lazycommit-rate-limit   # paste id into wrangler.toml
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put PRO_KEYS   # JSON: {"key_xxx":{"stripeCustomerId":"cus_xxx","expiresAt":"2026-11-16"}}
wrangler deploy
```

Point `api.lazycommit.dev` (or your domain) at the worker via Cloudflare DNS.

## Stripe wiring

The worker trusts `PRO_KEYS`. To keep it fresh, run this script on every Stripe webhook (see `stripe-webhook.js`):

```js
// stripe webhook handler — POST /webhook/stripe on your server
// Verifies Stripe signature, on checkout.session.completed generates an API key
// and pushes the updated PRO_KEYS map to the worker via wrangler.
```

For an MVP, you can skip the webhook and manually rotate keys after each Stripe sale (won't scale past ~10 customers).

## Free tier

5 generations / IP / day, tracked via Cloudflare KV. Resets at UTC midnight.