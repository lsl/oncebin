import type { FC } from 'hono/jsx';

export const View: FC = () => (
  <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8">
    <div id="view-reveal">
      <h2 class="text-2xl font-bold mb-4">Someone shared a secret with you</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        This secret can only be viewed <strong class="text-gray-700 dark:text-gray-200">once</strong>.
        It will be permanently destroyed after you reveal it.
      </p>
      <button
        id="reveal-btn"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
      >
        Reveal Secret
      </button>
    </div>

    <div id="view-content" class="hidden">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">Secret Content</h2>
        <span id="copy-content-feedback" class="text-sm font-semibold text-green-600" />
      </div>
      <pre
        id="paste-content"
        class="whitespace-pre-wrap break-all max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-4 font-mono text-sm mb-4"
      />
      <div class="flex gap-2 flex-wrap mb-4">
        <button
          id="copy-content-btn"
          class="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Copy to Clipboard
        </button>
      </div>
      <p class="text-sm text-gray-500">
        This secret has been permanently destroyed and can no longer be accessed.
        <br />
        Need to share a secret yourself?{' '}
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">
          Create a one-time link
        </a>
      </p>
    </div>

    <div id="view-error" class="hidden">
      <h2 id="error-title" class="text-2xl font-bold mb-4 text-red-600 dark:text-red-400" />
      <p id="error-message" class="text-gray-500 dark:text-gray-400 mb-6" />
      <a
        href="/"
        class="inline-block text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        Create a new secret
      </a>
    </div>
  </div>
);
