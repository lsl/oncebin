# Oncebin - Agent & API Reference
# https://oncebin.com
#
# Oncebin is a one-time secret sharing service. Secrets are encrypted
# client-side with AES-256-GCM before being sent to the server. The
# server never sees plaintext or encryption keys.
#
# The web interface uses JavaScript for encryption/decryption. Bots and
# CLI tools must perform the same cryptographic operations themselves.

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
- Secrets expire after 30 days if unread
- Secrets are permanently deleted immediately after being read

## Base64url Encoding

The encryption key uses base64url (RFC 4648 section 5):
  - Replace + with -
  - Replace / with _
  - Strip trailing = padding

## CLI Script

A bash script for creating and retrieving secrets from the command line
is available at: https://oncebin.com/oncebin.sh

  curl -sO https://oncebin.com/oncebin.sh && chmod +x oncebin.sh

Usage:
  echo "my secret" | ./oncebin.sh            # prints one-time URL
  ./oncebin.sh get <url>                      # retrieves and decrypts

Requires: bash, node (v16+), curl

## Example (Node.js inline)

# Store a secret:
#   SECRET="hunter2"
#   node -e '
#     const crypto = require("crypto");
#     const key = crypto.randomBytes(32), iv = crypto.randomBytes(12);
#     const c = crypto.createCipheriv("aes-256-gcm", key, iv);
#     const enc = Buffer.concat([c.update(process.argv[1],"utf8"), c.final(), c.getAuthTag()]);
#     const body = JSON.stringify({ encrypted: enc.toString("base64"), iv: iv.toString("base64") });
#     fetch("https://oncebin.com/api/paste", {
#       method: "POST",
#       headers: { "Content-Type": "application/json" },
#       body
#     }).then(r => r.json()).then(d => {
#       console.log("https://oncebin.com/o/" + d.id + "#" + key.toString("base64url"));
#     });
#   ' "$SECRET"
#
# Retrieve a secret:
#   URL="https://oncebin.com/o/abc123#keyhere"
#   # Parse ID and key from URL, then:
#   node -e '
#     const crypto = require("crypto");
#     fetch("https://oncebin.com/api/paste/" + process.argv[1] + "/burn", { method: "POST" })
#       .then(r => r.json()).then(d => {
#         const enc = Buffer.from(d.encrypted, "base64");
#         const iv = Buffer.from(d.iv, "base64");
#         const key = Buffer.from(process.argv[2], "base64url");
#         const dec = crypto.createDecipheriv("aes-256-gcm", key, iv);
#         dec.setAuthTag(enc.slice(-16));
#         process.stdout.write(Buffer.concat([dec.update(enc.slice(0,-16)), dec.final()]));
#       });
#   ' "$ID" "$KEY"
