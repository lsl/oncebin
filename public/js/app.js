// Copyright (c) 2026 Louis Laugesen. MIT License.

'use strict';

const MAX_SIZE = 50 * 1024;
const STORAGE_KEY = 'oncebin_pastes';

// --- Helpers ---

const $ = (sel) => document.querySelector(sel);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}

function formatBytes(bytes) {
  return bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' KB';
}

async function copyToClipboard(text, feedbackEl) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  if (feedbackEl) {
    feedbackEl.textContent = 'Copied!';
    setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
  }
}

// --- Local Storage ---

function getSavedPastes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function savePaste(entry) {
  const pastes = getSavedPastes();
  pastes.unshift(entry);
  if (pastes.length > 50) pastes.length = 50;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pastes));
}

function removePaste(id) {
  const pastes = getSavedPastes().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pastes));
}

function updatePasteStatus(id, status) {
  const pastes = getSavedPastes();
  const paste = pastes.find((p) => p.id === id);
  if (paste) paste.status = status;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pastes));
}

// --- Home Page ---

function initHome() {
  const content = $('#content');
  if (!content) return;

  const sizeInfo = $('#size-info');
  const createBtn = $('#create-btn');
  const createForm = $('#create-form');
  const createResult = $('#create-result');
  const resultUrl = $('#result-url');
  const copyBtn = $('#copy-btn');
  const copyFeedback = $('#copy-feedback');
  const newBtn = $('#new-btn');

  content.addEventListener('input', () => {
    const bytes = new TextEncoder().encode(content.value).length;
    sizeInfo.textContent = formatBytes(bytes) + ' / 50 KB';
    if (bytes > MAX_SIZE) {
      sizeInfo.classList.add('text-red-500', 'font-semibold');
      sizeInfo.classList.remove('text-gray-400');
      createBtn.disabled = true;
    } else {
      sizeInfo.classList.remove('text-red-500', 'font-semibold');
      sizeInfo.classList.add('text-gray-400');
      createBtn.disabled = !content.value.trim();
    }
  });

  createBtn.addEventListener('click', async () => {
    const text = content.value;
    if (!text.trim()) return;
    if (new TextEncoder().encode(text).length > MAX_SIZE) return;

    createBtn.disabled = true;
    createBtn.setAttribute('aria-busy', 'true');
    createBtn.textContent = 'Encrypting...';

    try {
      const result = await Crypto.encrypt(text);
      const response = await fetch('/api/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted: result.encrypted, iv: result.iv }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create paste');
      }

      const data = await response.json();
      const url = location.origin + '/o/' + data.id + '#' + result.key;

      resultUrl.value = url;
      hide(createForm);
      show(createResult);

      savePaste({
        id: data.id,
        url,
        created_at: new Date().toISOString(),
        status: 'pending',
      });
      loadRecentPastes();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      createBtn.disabled = false;
      createBtn.removeAttribute('aria-busy');
      createBtn.textContent = 'Create Secret Link';
    }
  });

  copyBtn.addEventListener('click', () => copyToClipboard(resultUrl.value, copyFeedback));
  resultUrl.addEventListener('click', () => {
    resultUrl.select();
    copyToClipboard(resultUrl.value, copyFeedback);
  });

  newBtn.addEventListener('click', () => {
    content.value = '';
    sizeInfo.textContent = '0 B / 50 KB';
    createBtn.disabled = true;
    hide(createResult);
    show(createForm);
    content.focus();
  });

  const copyInstallBtn = $('#copy-install-btn');
  if (copyInstallBtn) {
    copyInstallBtn.addEventListener('click', () => {
      copyToClipboard('curl -sO https://oncebin.com/oncebin.sh && chmod +x oncebin.sh');
      copyInstallBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
      setTimeout(() => {
        copyInstallBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      }, 2000);
    });
  }

  loadRecentPastes();
}

// --- Recent Pastes ---

async function loadRecentPastes() {
  const section = $('#recent-section');
  const list = $('#recent-list');
  if (!section || !list) return;

  const pastes = getSavedPastes();
  if (!pastes.length) { hide(section); return; }
  show(section);

  // Check status of pending pastes
  const pendingChecks = pastes
    .filter((p) => p.status === 'pending')
    .map((p) => checkPasteStatus(p.id));
  if (pendingChecks.length) await Promise.allSettled(pendingChecks);

  const updatedPastes = getSavedPastes();
  list.innerHTML = updatedPastes.map(createPasteRow).join('');

  // Bind burn/remove buttons
  list.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { action, id } = btn.dataset;
      if (action === 'burn') {
        btn.disabled = true;
        try {
          const res = await fetch('/api/paste/' + id + '/burn', { method: 'POST' });
          if (!res.ok) throw new Error();
          updatePasteStatus(id, 'burned');
        } catch {
          btn.disabled = false;
          alert('Could not burn this secret. Please try again.');
          return;
        }
      } else {
        removePaste(id);
      }
      loadRecentPastes();
    });
  });

  // Enable HTMX polling on new elements
  if (typeof htmx !== 'undefined') htmx.process(list);
}

async function checkPasteStatus(id) {
  try {
    const res = await fetch('/api/paste/' + id + '/status');
    const data = await res.json();
    if (data.status && data.status !== 'pending') {
      updatePasteStatus(id, data.status === 'not_found' ? 'expired' : data.status);
    }
  } catch { /* ignore */ }
}

function createPasteRow(paste) {
  const status = paste.status || 'pending';
  const badgeClasses = {
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    read: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    burned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  const badge = badgeClasses[status] || badgeClasses.expired;
  const label = status === 'burned' ? 'Burned' : status.charAt(0).toUpperCase() + status.slice(1);
  const isPending = status === 'pending';

  // HTMX polling attribute for pending pastes
  const poll = isPending
    ? ` hx-get="/fragments/status/${paste.id}" hx-trigger="every 60s" hx-swap="innerHTML"`
    : '';

  return `
    <div class="flex items-center justify-between px-4 py-3 gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
      <div class="min-w-0 flex-1">
        <div class="font-mono text-xs text-gray-400 truncate">${escapeHtml(paste.url.split('#')[0])}</div>
        <div class="flex items-center gap-2 mt-1">
          <span id="status-${paste.id}"${poll} class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge}">${label}</span>
          <span class="text-xs text-gray-400">${timeAgo(paste.created_at)}</span>
        </div>
      </div>
      <button
        data-action="${isPending ? 'burn' : 'remove'}"
        data-id="${paste.id}"
        class="text-xs font-medium py-1 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      >${isPending ? 'Burn' : 'Remove'}</button>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- View Page ---

function initView() {
  const revealSection = $('#view-reveal');
  const contentSection = $('#view-content');
  const errorSection = $('#view-error');
  const revealBtn = $('#reveal-btn');
  const pasteContent = $('#paste-content');
  const copyContentBtn = $('#copy-content-btn');
  const copyContentFeedback = $('#copy-content-feedback');
  const errorTitle = $('#error-title');
  const errorMessage = $('#error-message');

  if (!revealBtn) return;

  const pathParts = location.pathname.split('/');
  const pasteId = pathParts[2];
  const encryptionKey = location.hash.slice(1);

  if (!pasteId || !encryptionKey) {
    showError('Invalid Link', 'This link is incomplete. Make sure you copied the entire URL including everything after the # symbol.');
    return;
  }

  revealBtn.addEventListener('click', async () => {
    revealBtn.disabled = true;
    revealBtn.setAttribute('aria-busy', 'true');
    revealBtn.textContent = 'Decrypting...';

    try {
      const response = await fetch('/api/paste/' + pasteId + '/burn', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        const errors = {
          already_read: ['Already Viewed', 'This secret has already been viewed and permanently destroyed.'],
          expired: ['Expired', 'This secret has expired and can no longer be accessed.'],
        };
        const [title, msg] = errors[data.error] || ['Not Found', 'This secret does not exist or has already been destroyed.'];
        showError(title, msg);
        return;
      }

      const decrypted = await Crypto.decrypt(data.encrypted, data.iv, encryptionKey);
      pasteContent.textContent = decrypted;
      hide(revealSection);
      show(contentSection);
    } catch (e) {
      if (e.name === 'OperationError') {
        showError('Decryption Failed', 'Could not decrypt this secret. The link may be corrupted or incomplete.');
      } else {
        showError('Error', 'Something went wrong. Please try again.');
      }
    }
  });

  if (copyContentBtn) {
    copyContentBtn.addEventListener('click', () => copyToClipboard(pasteContent.textContent, copyContentFeedback));
  }

  function showError(title, message) {
    hide(revealSection);
    hide(contentSection);
    show(errorSection);
    errorTitle.textContent = title;
    errorMessage.textContent = message;
  }
}

// --- About Page (contact form) ---

function initAbout() {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = ($('#contact-email')?.value || '').trim();
    const message = ($('#contact-message')?.value || '').trim();
    if (!message) { $('#contact-message')?.focus(); return; }

    const bodyParts = [];
    if (email) { bodyParts.push('From: ' + email, ''); }
    bodyParts.push(message);

    location.href = 'mailto:hello@Oncebin.com?subject=' +
      encodeURIComponent('Oncebin feedback') +
      '&body=' + encodeURIComponent(bodyParts.join('\n'));
  });
}

// --- Init ---

function init() {
  if (!window.crypto?.subtle) {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = '<div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"><h2 class="text-xl font-bold mb-2">Unsupported Browser</h2><p class="text-gray-500">Oncebin requires a modern browser with encryption support. Please use a recent version of Chrome, Firefox, Safari, or Edge.</p></div>';
    }
    return;
  }

  const path = location.pathname;
  if (path === '/') initHome();
  else if (path.startsWith('/o/')) initView();
  else if (path === '/about' || path === '/contact') initAbout();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
