(function () {
  'use strict';

  var MAX_SIZE = 50 * 1024;

  // --- Crypto ---

  function base64urlEncode(bytes) {
    return btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Uint8Array.from(atob(str), function (c) {
      return c.charCodeAt(0);
    });
  }

  function toBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var chunks = [];
    for (var i = 0; i < bytes.length; i += 8192) {
      chunks.push(
        String.fromCharCode.apply(
          null,
          bytes.subarray(i, Math.min(i + 8192, bytes.length))
        )
      );
    }
    return btoa(chunks.join(''));
  }

  function fromBase64(str) {
    return Uint8Array.from(atob(str), function (c) {
      return c.charCodeAt(0);
    });
  }

  async function encryptContent(text) {
    var key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var encoded = new TextEncoder().encode(text);
    var encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    );
    var exportedKey = await crypto.subtle.exportKey('raw', key);
    return {
      encrypted: toBase64(encrypted),
      iv: toBase64(iv),
      key: base64urlEncode(new Uint8Array(exportedKey)),
    };
  }

  async function decryptContent(encryptedB64, ivB64, keyB64url) {
    var keyBytes = base64urlDecode(keyB64url);
    var key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    var iv = fromBase64(ivB64);
    var encrypted = fromBase64(encryptedB64);
    var decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  }

  // --- Local Storage ---

  var STORAGE_KEY = 'oncebin_pastes';

  function getSavedPastes() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function savePaste(entry) {
    var pastes = getSavedPastes();
    pastes.unshift(entry);
    if (pastes.length > 50) {
      pastes.length = 50;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pastes));
  }

  function removePaste(id) {
    var pastes = getSavedPastes().filter(function (p) {
      return p.id !== id;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pastes));
  }

  function updatePasteStatus(id, status) {
    var pastes = getSavedPastes();
    for (var i = 0; i < pastes.length; i++) {
      if (pastes[i].id === id) {
        pastes[i].status = status;
        break;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pastes));
  }

  // --- Helpers ---

  function $(sel) {
    return document.querySelector(sel);
  }
  function show(el) {
    el.classList.remove('hidden');
  }
  function hide(el) {
    el.classList.add('hidden');
  }

  function timeAgo(dateStr) {
    var seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) {
      return 'just now';
    }
    if (seconds < 3600) {
      return Math.floor(seconds / 60) + 'm ago';
    }
    if (seconds < 86400) {
      return Math.floor(seconds / 3600) + 'h ago';
    }
    if (seconds < 604800) {
      return Math.floor(seconds / 86400) + 'd ago';
    }
    return new Date(dateStr).toLocaleDateString();
  }

  function formatBytes(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    }
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  async function copyToClipboard(text, feedbackEl) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (feedbackEl) {
      feedbackEl.textContent = 'Copied!';
      feedbackEl.className = 'copied';
      setTimeout(function () {
        feedbackEl.textContent = '';
        feedbackEl.className = '';
      }, 2000);
    }
  }

  // --- Home Page ---

  function initHome() {
    var content = $('#content');
    var sizeInfo = $('#size-info');
    var createBtn = $('#create-btn');
    var createForm = $('#create-form');
    var createResult = $('#create-result');
    var resultUrl = $('#result-url');
    var copyBtn = $('#copy-btn');
    var copyFeedback = $('#copy-feedback');
    var newBtn = $('#new-btn');

    if (!content) {
      return;
    }

    content.addEventListener('input', function () {
      var bytes = new TextEncoder().encode(content.value).length;
      sizeInfo.textContent = formatBytes(bytes) + ' / 50 KB';
      if (bytes > MAX_SIZE) {
        sizeInfo.classList.add('over-limit');
        createBtn.disabled = true;
      } else {
        sizeInfo.classList.remove('over-limit');
        createBtn.disabled = !content.value.trim();
      }
    });

    createBtn.addEventListener('click', async function () {
      var text = content.value;
      if (!text.trim()) {
        return;
      }

      var bytes = new TextEncoder().encode(text).length;
      if (bytes > MAX_SIZE) {
        return;
      }

      createBtn.disabled = true;
      createBtn.setAttribute('aria-busy', 'true');

      try {
        var result = await encryptContent(text);
        var response = await fetch('/api/paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encrypted: result.encrypted, iv: result.iv }),
        });

        if (!response.ok) {
          var err = await response.json();
          throw new Error(err.error || 'Failed to create paste');
        }

        var data = await response.json();
        var url = window.location.origin + '/p/' + data.id + '#' + result.key;

        resultUrl.value = url;
        hide(createForm);
        show(createResult);

        savePaste({
          id: data.id,
          url: url,
          created_at: new Date().toISOString(),
          status: 'pending',
        });

        loadRecentPastes();
      } catch (e) {
        alert('Error: ' + e.message);
      } finally {
        createBtn.disabled = false;
        createBtn.removeAttribute('aria-busy');
      }
    });

    copyBtn.addEventListener('click', function () {
      copyToClipboard(resultUrl.value, copyFeedback);
    });

    resultUrl.addEventListener('click', function () {
      resultUrl.select();
      copyToClipboard(resultUrl.value, copyFeedback);
    });

    newBtn.addEventListener('click', function () {
      content.value = '';
      sizeInfo.textContent = '0 B / 50 KB';
      createBtn.disabled = true;
      hide(createResult);
      show(createForm);
      content.focus();
    });

    loadRecentPastes();
  }

  async function loadRecentPastes() {
    var section = $('#recent-section');
    var list = $('#recent-list');
    if (!section || !list) {
      return;
    }

    var pastes = getSavedPastes();
    if (pastes.length === 0) {
      hide(section);
      return;
    }

    show(section);

    var pendingChecks = [];
    for (var i = 0; i < pastes.length; i++) {
      if (pastes[i].status === 'pending') {
        pendingChecks.push(checkPasteStatus(pastes[i].id));
      }
    }

    if (pendingChecks.length > 0) {
      await Promise.allSettled(pendingChecks);
      pastes = getSavedPastes();
    }

    list.innerHTML = '';
    for (var i = 0; i < pastes.length; i++) {
      list.appendChild(createPasteRow(pastes[i]));
    }
  }

  async function checkPasteStatus(id) {
    try {
      var response = await fetch('/api/paste/' + id + '/status');
      var data = await response.json();
      if (data.status && data.status !== 'pending') {
        updatePasteStatus(
          id,
          data.status === 'not_found' ? 'expired' : data.status
        );
      }
    } catch (e) {
      // ignore network errors during status check
    }
  }

  function createPasteRow(paste) {
    var row = document.createElement('div');
    row.className = 'recent-paste';
    var status = paste.status || 'pending';

    var info = document.createElement('div');
    info.className = 'recent-paste-info';

    var urlDiv = document.createElement('div');
    urlDiv.className = 'recent-paste-url';
    urlDiv.textContent = paste.url.split('#')[0];

    var meta = document.createElement('div');
    meta.className = 'recent-paste-meta';

    var badge = document.createElement('span');
    badge.className = 'status-badge status-' + status;
    if (status === 'burned') {
      badge.textContent = 'Burned';
    } else {
      badge.textContent =
        status.charAt(0).toUpperCase() + status.slice(1);
    }

    var time = document.createElement('span');
    time.textContent = timeAgo(paste.created_at);

    meta.appendChild(badge);
    meta.appendChild(time);
    info.appendChild(urlDiv);
    info.appendChild(meta);

    var removeBtn = document.createElement('button');
    removeBtn.className = 'outline secondary';
    removeBtn.style.cssText =
      'width:auto;padding:0.25rem 0.75rem;font-size:0.75rem;margin:0;';
    if (status === 'pending') {
      removeBtn.textContent = 'Burn';
      removeBtn.addEventListener('click', function () {
        removeBtn.disabled = true;
        fetch('/api/paste/' + paste.id + '/burn', {
          method: 'POST',
        })
          .then(function (response) {
            if (!response.ok) {
              throw new Error('Failed to burn secret');
            }
            updatePasteStatus(paste.id, 'burned');
            return null;
          })
          .then(function () {
            loadRecentPastes();
          })
          .catch(function () {
            removeBtn.disabled = false;
            alert('Could not burn this secret. Please try again.');
          });
      });
    } else {
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function () {
        removePaste(paste.id);
        loadRecentPastes();
      });
    }

    row.appendChild(info);
    row.appendChild(removeBtn);

    return row;
  }

  // --- View Page ---

  function initView() {
    var revealSection = $('#view-reveal');
    var contentSection = $('#view-content');
    var errorSection = $('#view-error');
    var revealBtn = $('#reveal-btn');
    var pasteContent = $('#paste-content');
    var copyContentBtn = $('#copy-content-btn');
    var copyContentFeedback = $('#copy-content-feedback');
    var errorTitle = $('#error-title');
    var errorMessage = $('#error-message');

    if (!revealBtn) {
      return;
    }

    var pathParts = window.location.pathname.split('/');
    var pasteId = pathParts[2];
    var encryptionKey = window.location.hash.slice(1);

    if (!pasteId || !encryptionKey) {
      showError(
        'Invalid Link',
        'This link is incomplete. Make sure you copied the entire URL including everything after the # symbol.'
      );
      return;
    }

    revealBtn.addEventListener('click', async function () {
      revealBtn.disabled = true;
      revealBtn.setAttribute('aria-busy', 'true');

      try {
        var response = await fetch('/api/paste/' + pasteId + '/burn', {
          method: 'POST',
        });
        var data = await response.json();

        if (!response.ok) {
          if (data.error === 'already_read') {
            showError(
              'Already Viewed',
              'This secret has already been viewed and permanently destroyed.'
            );
          } else if (data.error === 'expired') {
            showError(
              'Expired',
              'This secret has expired and can no longer be accessed.'
            );
          } else {
            showError(
              'Not Found',
              'This secret does not exist or has already been destroyed.'
            );
          }
          return;
        }

        var decrypted = await decryptContent(
          data.encrypted,
          data.iv,
          encryptionKey
        );
        pasteContent.textContent = decrypted;
        hide(revealSection);
        show(contentSection);
      } catch (e) {
        if (e.name === 'OperationError') {
          showError(
            'Decryption Failed',
            'Could not decrypt this secret. The link may be corrupted or incomplete.'
          );
        } else {
          showError('Error', 'Something went wrong. Please try again.');
        }
      }
    });

    if (copyContentBtn) {
      copyContentBtn.addEventListener('click', function () {
        copyToClipboard(pasteContent.textContent, copyContentFeedback);
      });
    }

    function showError(title, message) {
      hide(revealSection);
      hide(contentSection);
      show(errorSection);
      errorTitle.textContent = title;
      errorMessage.textContent = message;
    }
  }

  // --- Init ---

  function init() {
    if (!window.crypto || !window.crypto.subtle) {
      var main = document.querySelector('main');
      if (main) {
        main.innerHTML =
          '<article><header><strong>Unsupported Browser</strong></header><p>OnceBin requires a modern browser with encryption support. Please use a recent version of Chrome, Firefox, Safari, or Edge.</p></article>';
      }
      return;
    }

    var path = window.location.pathname;
    if (path === '/') {
      initHome();
    } else if (path.indexOf('/p/') === 0) {
      initView();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
