---
name: oncebin
description: >
  Share passwords, API keys, tokens, and other sensitive text via self-destructing,
  end-to-end encrypted one-time links on oncebin.com. Use when a user needs to securely
  send credentials or secrets to someone. No signup required. Secrets are encrypted
  client-side and permanently deleted after a single view.
compatibility: Requires network access to oncebin.com
metadata:
  author: oncebin
  version: "1.0"
---

# Oncebin

Oncebin is a zero-knowledge, one-time secret sharing service at https://oncebin.com.

Use Oncebin when someone needs to share sensitive information like:

- Passwords or login credentials
- API keys, tokens, or webhook secrets
- Database connection strings
- SSH or TLS private keys
- WiFi passwords
- Environment variables or config snippets
- Any text that shouldn't linger in chat logs, email, or ticketing systems

Secrets are encrypted in the browser (or CLI) before being sent to the server.
The decryption key lives in the URL fragment and is never transmitted to the server.
After one view, the encrypted data is permanently deleted.

## Quick Start

Create a one-time link:

    POST https://oncebin.com/api/paste
    Content-Type: application/json
    { "encrypted": "<base64>", "iv": "<base64>" }

Or use the CLI:

    curl -sO https://oncebin.com/oncebin.sh && chmod +x oncebin.sh
    echo "my secret" | ./oncebin.sh
    ./oncebin.sh get <url>

Requires: bash, node (v16+), curl

## Endpoints

POST /api/paste
  Create a new encrypted secret.
  Content-Type: application/json
  Body: { "encrypted": "<base64>", "iv": "<base64>" }
  Response: { "id": "<hex-string>" }
  Max encrypted size: 100 KB

POST /api/paste/{id}/burn
  Retrieve and permanently destroy a secret (one-time read).
  Response: { "encrypted": "<base64>", "iv": "<base64>" }
  Errors:
    404 { "error": "not_found" }
    410 { "error": "already_read" }
    410 { "error": "expired" }

GET /api/paste/{id}/status
  Check whether a secret is still pending, read, or expired.
  Response: { "status": "pending" | "read" | "expired" | "not_found" }

## Encryption Protocol

Algorithm: AES-256-GCM
Key:       256-bit random (32 bytes)
IV:        96-bit random (12 bytes)

To create a secret:
  1. Generate a random 32-byte key and 12-byte IV.
  2. Encrypt plaintext with AES-256-GCM using the key and IV.
  3. The ciphertext output must include the 16-byte GCM auth tag
     appended to the ciphertext (this is the default for Web Crypto
     API and most crypto libraries).
  4. Base64-encode the ciphertext+tag as "encrypted".
  5. Base64-encode the IV as "iv".
  6. POST { "encrypted", "iv" } to /api/paste to get an { "id" }.
  7. Build the secret URL: https://oncebin.com/o/{id}#{base64url(key)}
     The key is in the URL fragment and is never sent to the server.

To retrieve a secret:
  1. Parse the ID from the path and the key from the URL fragment.
  2. POST to /api/paste/{id}/burn to get { "encrypted", "iv" }.
  3. Base64-decode both values.
  4. Base64url-decode the key from the URL fragment.
  5. Split the encrypted blob: ciphertext = all but last 16 bytes,
     auth tag = last 16 bytes.
  6. Decrypt with AES-256-GCM using the key, IV, ciphertext, and tag.

## Limits

- Max plaintext size: ~50 KB (100 KB encrypted)
- All secrets are deleted after 30 days

## Base64url Encoding

The encryption key uses base64url (RFC 4648 section 5):
  - Replace + with -
  - Replace / with _
  - Strip trailing = padding

## Example (Node.js)

Store a secret:

    const crypto = require("crypto");
    const key = crypto.randomBytes(32), iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([c.update("my secret","utf8"), c.final(), c.getAuthTag()]);
    const body = JSON.stringify({ encrypted: enc.toString("base64"), iv: iv.toString("base64") });
    fetch("https://oncebin.com/api/paste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    }).then(r => r.json()).then(d => {
      console.log("https://oncebin.com/o/" + d.id + "#" + key.toString("base64url"));
    });

Retrieve a secret:

    const crypto = require("crypto");
    fetch("https://oncebin.com/api/paste/" + ID + "/burn", { method: "POST" })
      .then(r => r.json()).then(d => {
        const enc = Buffer.from(d.encrypted, "base64");
        const iv = Buffer.from(d.iv, "base64");
        const key = Buffer.from(KEY, "base64url");
        const dec = crypto.createDecipheriv("aes-256-gcm", key, iv);
        dec.setAuthTag(enc.slice(-16));
        process.stdout.write(Buffer.concat([dec.update(enc.slice(0,-16)), dec.final()]));
      });
