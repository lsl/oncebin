# Oncebin

[Oncebin](https://oncebin.com) is a secure pastebin where secrets self-destruct after one view. Share passwords, API keys, and other sensitive data through one-time-secret links that never reach our servers unencrypted.

## Security

- **End-to-end encrypted** — content is encrypted in the browser using AES-256-GCM before being sent to the server. The encryption key lives in the URL fragment (`#key`) which is never transmitted to the server.
- **One-time viewing** — each paste can only be read once. After viewing, the encrypted content is permanently burned.
- **Zero knowledge** — the server never sees plaintext content. Even if the database is compromised, the data is useless without the encryption key.
- **Auto-expiry** — all secrets are deleted after 30 days.

## How It Works

1. You paste a secret and click "Create Secret Link"
2. Your browser encrypts the content with a random AES-256-GCM key
3. Only the encrypted blob is sent to the server — the key stays in the URL fragment (`#...`)
4. The recipient clicks "Reveal Secret" which fetches and atomically burns the paste
5. Their browser decrypts the content using the key from the URL fragment
6. The paste is permanently destroyed on the server — subsequent attempts get a 410 Gone
7. Your recent secrets are tracked in localStorage so you can see if they've been read or are still pending.

## Stack

- [Hono](https://hono.dev/) — web framework with JSX/TSX server-side rendering
- [HTMX](https://htmx.org/) — declarative interactivity (status polling, fragments)
- [Tailwind CSS](https://tailwindcss.com/) v4 — utility-first styling
- [Cloudflare Workers](https://workers.cloudflare.com/) — serverless runtime
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite database
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) — client-side AES-256-GCM encryption

## Setup

### Prerequisites

- Node.js 18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)

### Install dependencies

```bash
npm install
```

### Create D1 database

```bash
npx wrangler d1 create oncebin-db
```

Copy the `database_id` from the output into `wrangler.jsonc`.

### Development

```bash
# Start the worker dev server
make dev

# Start Tailwind CSS watcher (in a separate terminal)
make css
```

### Deploy

Runs local tests, builds CSS, migrates the database, and deploys to Workers:

```bash
make deploy
```

### Other commands

```bash
make test           # run tests against production
make test-local     # run tests against local dev server
make migrate-local  # apply D1 migrations locally
make migrate-prod   # apply D1 migrations to production
make css-build      # one-off Tailwind build (minified)
bin/stats           # query D1 for usage stats
```

## CLI

```bash
curl -sO https://oncebin.com/oncebin.sh && chmod +x oncebin.sh

echo "my secret" | ./oncebin.sh        # create a secret
./oncebin.sh get <url>                  # retrieve a secret
```

See [SKILL.md](https://oncebin.com/SKILL.md) for the full API documentation.

## Limits

| Limit | Value |
|---|---|
| Max paste size | 50 KB |
| Secret expiry | 30 days |
