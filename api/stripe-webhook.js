// Minimal Stripe webhook → updates PRO_KEYS map in Cloudflare KV + pushes to worker.
// Run on your own server (Render free tier, fly.io, etc.) — not on the worker itself.
// Listens for `checkout.session.completed` and `customer.subscription.deleted`.
//
// Env:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   WRANGLER_API_TOKEN      — Cloudflare API token with Workers KV write
//   CF_ACCOUNT_ID
//   KV_NAMESPACE_ID         — id of RATE_LIMIT / PRO_KEYS kv namespace

import Stripe from 'stripe';
import { createServer } from 'node:http';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

createServer(async (req, res) => {
  if (req.url !== '/webhook/stripe' || req.method !== 'POST') return res.end();

  let body = '';
  for await (const chunk of req) body += chunk;
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, req.headers['stripe-signature'], WH_SECRET);
  } catch (e) {
    res.writeHead(400);
    return res.end(`bad sig: ${e.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const apiKey = `lc_${crypto.randomUUID().replace(/-/g, '')}`;
    const customerId = s.customer;
    const expiresAt = new Date(Date.now() + 31 * 86400 * 1000).toISOString();
    await upsertProKey(apiKey, { stripeCustomerId: customerId, expiresAt });
    // send apiKey to customer via Stripe receipt or your own email
    console.log(`new pro: ${apiKey} → ${customerId}`);
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await removeProKeyByCustomer(sub.customer);
  }

  res.writeHead(200);
  res.end('ok');
}).listen(3000);

async function upsertProKey(key, value) {
  const map = await fetchProKeys();
  map[key] = value;
  await pushProKeys(map);
}
async function removeProKeyByCustomer(customerId) {
  const map = await fetchProKeys();
  for (const [k, v] of Object.entries(map)) {
    if (v.stripeCustomerId === customerId) delete map[k];
  }
  await pushProKeys(map);
}
async function fetchProKeys() {
  // Read from the same KV namespace as the worker
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.KV_NAMESPACE_ID}/values/pro_keys`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${process.env.WRANGLER_API_TOKEN}` } });
  return res.ok ? await res.json() : {};
}
async function pushProKeys(map) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.KV_NAMESPACE_ID}/values/pro_keys`;
  await fetch(url, {
    method: 'PUT',
    headers: { authorization: `Bearer ${process.env.WRANGLER_API_TOKEN}` },
    body: JSON.stringify(map),
  });
}