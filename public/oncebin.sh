#!/usr/bin/env bash
# oncebin.sh - Create and retrieve one-time secrets via oncebin.com
#
# Usage:
#   echo "secret" | ./oncebin.sh              # Store, prints URL
#   ./oncebin.sh "my secret text"             # Store from argument
#   ./oncebin.sh get <url>                    # Retrieve and decrypt
#
# Requires: bash, node (v16+), curl
# Install: curl -sO https://oncebin.com/oncebin.sh && chmod +x oncebin.sh

set -euo pipefail

ONCEBIN="${ONCEBIN_URL:-https://oncebin.com}"

store() {
  local plaintext
  if [ $# -gt 0 ]; then
    plaintext="$*"
  elif [ ! -t 0 ]; then
    plaintext=$(cat)
  else
    echo "Usage: echo 'secret' | ./oncebin.sh" >&2
    echo "       ./oncebin.sh \"my secret text\"" >&2
    echo "       ./oncebin.sh get <url>" >&2
    exit 1
  fi

  if [ -z "$plaintext" ]; then
    echo "Error: empty input" >&2
    exit 1
  fi

  node -e '
    const crypto = require("crypto");
    const plaintext = process.argv[1];
    const base = process.argv[2];

    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
      cipher.getAuthTag()
    ]);

    const body = JSON.stringify({
      encrypted: enc.toString("base64"),
      iv: iv.toString("base64")
    });

    fetch(base + "/api/paste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    })
    .then(r => {
      if (!r.ok) return r.text().then(t => { throw new Error(t); });
      return r.json();
    })
    .then(data => {
      console.log(base + "/o/" + data.id + "#" + key.toString("base64url"));
    })
    .catch(e => {
      console.error("Error: " + e.message);
      process.exit(1);
    });
  ' "$plaintext" "$ONCEBIN"
}

get() {
  local url="$1"
  local base id key_b64url

  base=$(echo "$url" | grep -oP '^https?://[^/]+')
  id=$(echo "$url" | grep -oP '/o/\K[^#]+')
  key_b64url=$(echo "$url" | grep -oP '#\K.*')

  if [ -z "$id" ] || [ -z "$key_b64url" ]; then
    echo "Error: invalid oncebin URL" >&2
    exit 1
  fi

  node -e '
    const crypto = require("crypto");
    const base = process.argv[1];
    const id = process.argv[2];
    const keyB64url = process.argv[3];

    fetch(base + "/api/paste/" + id + "/burn", { method: "POST" })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        console.error("Error: " + data.error);
        process.exit(1);
      }
      const enc = Buffer.from(data.encrypted, "base64");
      const iv = Buffer.from(data.iv, "base64");
      const key = Buffer.from(keyB64url, "base64url");
      const tag = enc.slice(-16);
      const ct = enc.slice(0, -16);
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      process.stdout.write(
        Buffer.concat([decipher.update(ct), decipher.final()])
      );
    })
    .catch(e => {
      console.error("Error: " + e.message);
      process.exit(1);
    });
  ' "$base" "$id" "$key_b64url"
}

case "${1:-}" in
  get|fetch|read)
    shift
    get "$1"
    ;;
  *)
    store "$@"
    ;;
esac
