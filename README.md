# Oncebin

A secure pastebin where secrets self-destruct after one view. Share passwords, API keys, and other sensitive data through one-time links.

## Security

- **End-to-end encrypted** — content is encrypted in the browser using AES-256-GCM before being sent to the server. The encryption key lives in the URL fragment (`#key`) which is never transmitted to the server.
- **One-time viewing** — each paste can only be read once. After viewing, the encrypted content is permanently burned.
- **Zero knowledge** — the server never sees plaintext content. Even if the database is compromised, the data is useless without the encryption key.
- **Auto-expiry** — unread pastes expire after 7 days.

## Stack

- [Cloudflare Workers](https://workers.cloudflare.com/) — serverless runtime
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite database
- [Pico CSS](https://picocss.com/) — classless styling
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

Copy the `database_id` from the output and replace `YOUR_DATABASE_ID` in `wrangler.toml`.

### Run schema migration

```bash
# Local development
npm run db:migrate:local

# Production
npm run db:migrate:prod
```

### Development

```bash
npm run dev
```

### Deploy

```bash
npm run deploy
```

## Limits

| Limit | Value |
|---|---|
| Max paste size | 50 KB |
| Unread paste expiry | 30 days |
| Burned paste record retention | 30 days |

## How It Works

1. You paste a secret and click "Create Secret Link"
2. Your browser encrypts the content with a random AES-256-GCM key
3. Only the encrypted blob is sent to the server — the key stays in the URL fragment (`#...`)
4. The recipient clicks "Reveal Secret" which fetches and atomically burns the paste
5. Their browser decrypts the content using the key from the URL fragment
6. The paste is permanently destroyed on the server — subsequent attempts get a 410 Gone

Your recent secrets are tracked in localStorage so you can see if they've been read or are still pending.
