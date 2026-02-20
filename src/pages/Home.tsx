import type { FC } from 'hono/jsx';

export const Home: FC = () => (
  <>
    <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 mb-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">Share a one time secret</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Create a one-time link that self-deletes after being read.
        </p>
      </div>

      <div id="create-form">
        <textarea
          id="content"
          placeholder="Paste your secret here..."
          rows={6}
          autofocus
          class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 font-mono text-sm resize-y min-h-40 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
        <div id="size-info" class="text-right text-sm text-gray-400 mt-2 mb-4">
          0 B / 50 KB
        </div>
        <button
          id="create-btn"
          disabled
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
        >
          Create Secret Link
        </button>
      </div>

      <div id="create-result" class="hidden">
        <div class="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-4 mb-4">
          <p class="font-medium text-green-800 dark:text-green-200 mb-3">
            Your secret link is ready
          </p>
          <input
            type="text"
            id="result-url"
            readonly
            class="w-full font-mono text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 cursor-pointer select-all"
          />
        </div>
        <span id="copy-feedback" class="text-sm font-semibold text-green-600" />
        <div class="flex gap-2 flex-wrap mt-2">
          <button
            id="copy-btn"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Copy Link
          </button>
          <button
            id="new-btn"
            class="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Create Another
          </button>
        </div>
        <p class="text-sm text-gray-500 mt-4">
          This link can only be opened <strong>once</strong>. After viewing, the
          secret is permanently destroyed.
        </p>
      </div>
    </div>

    <div id="recent-section" class="hidden mb-8">
      <h3 class="text-lg font-semibold mb-3">Your Recent Secrets</h3>
      <div
        id="recent-list"
        class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden"
      />
    </div>

    <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8">
      <h3 class="text-lg font-semibold mb-2">
        Passwords, API keys, credentials — shared safely
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Stop pasting secrets into Slack, email, or Jira tickets. Oncebin creates
        encrypted, self-destructing links that vanish after one view.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p class="font-semibold mb-1">Paste</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Enter sensitive text — passwords, tokens, connection strings, private
            keys.
          </p>
        </div>
        <div>
          <p class="font-semibold mb-1">Share</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Send the one-time link over any channel. The secret stays encrypted.
          </p>
        </div>
        <div>
          <p class="font-semibold mb-1">Gone</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            One view and it's permanently destroyed. Nothing lingers on our
            servers.
          </p>
        </div>
      </div>
      <p class="text-sm text-gray-400 mt-6">
        Encryption happens in your browser. The key lives in the URL fragment
        and never reaches our servers.{' '}
        <a href="/about" class="text-blue-600 dark:text-blue-400 hover:underline">
          Learn more
        </a>
      </p>
    </div>

    <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 mt-8">
      <h3 class="text-lg font-semibold mb-2">Install oncebin.sh</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        Share secrets from your terminal. Requires bash, node (v16+), and curl.
      </p>
      <div class="relative rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 pr-12 font-mono text-sm overflow-x-auto mb-4">
        <button
          id="copy-install-btn"
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          aria-label="Copy install command"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>
        <p>curl -sO https://oncebin.com/oncebin.sh && chmod +x oncebin.sh</p>
      </div>
      <div class="rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 font-mono text-sm overflow-x-auto mb-4">
        <p class="text-gray-500 dark:text-gray-500 mb-2"># Create a secret</p>
        <p>$ echo "my secret" | ./oncebin.sh</p>
        <p class="text-green-600 dark:text-green-400">https://oncebin.com/o/989f7a85eb6#63uDYL9Hc</p>
        <p class="text-gray-500 dark:text-gray-500 mt-4 mb-2"># Retrieve a secret</p>
        <p>$ ./oncebin.sh get "https://oncebin.com/o/989f7a85eb6#63uDYL9Hc"</p>
        <p class="text-green-600 dark:text-green-400">my secret</p>
      </div>
      <p class="text-sm text-gray-400">
        See the full{' '}
        <a href="/SKILL.md" class="text-blue-600 dark:text-blue-400 hover:underline">
          API documentation (SKILL.md)
        </a>{' '}
        for programmatic usage.
      </p>
    </div>
  </>
);
