// Copyright (c) 2026 Louis Laugesen. MIT License.
// Client-side AES-256-GCM encryption — key never leaves the browser.

'use strict';

const Crypto = (() => {
  function base64urlEncode(bytes) {
    return btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  }

  function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunks = [];
    for (let i = 0; i < bytes.length; i += 8192) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, bytes.length))));
    }
    return btoa(chunks.join(''));
  }

  function fromBase64(str) {
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  }

  async function encrypt(text) {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    return {
      encrypted: toBase64(encrypted),
      iv: toBase64(iv),
      key: base64urlEncode(new Uint8Array(exportedKey)),
    };
  }

  async function decrypt(encryptedB64, ivB64, keyB64url) {
    const keyBytes = base64urlDecode(keyB64url);
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const iv = fromBase64(ivB64);
    const encrypted = fromBase64(encryptedB64);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  }

  return { encrypt, decrypt };
})();
