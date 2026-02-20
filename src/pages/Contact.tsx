import type { FC } from 'hono/jsx';

export const Contact: FC = () => (
  <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">Contact</h1>
      <p class="text-gray-500 dark:text-gray-400">
        Questions, feedback, or issues — we'd love to hear from you.
      </p>
    </div>

    <form id="contact-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Your email (optional)
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          placeholder="you@example.com"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          placeholder="Tell us what's on your mind..."
          class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm resize-y outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
      </div>
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
      >
        Email us
      </button>
    </form>
    <p class="text-sm text-gray-400 mt-2">
      Submitting will open your email client with a pre-filled message.
    </p>

    <div class="pt-6 mt-8 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500">
      <p>
        You can also open an issue on{' '}
        <a
          href="https://github.com/lsl/oncebin"
          class="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>
    </div>
  </div>
);
