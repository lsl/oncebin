import type { FC } from 'hono/jsx';

export const About: FC = () => (
  <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">About Oncebin</h1>
      <p class="text-gray-500 dark:text-gray-400">
        Oncebin lets you create and share one time secrets.
      </p>
    </div>

    <section class="mb-8">
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Oncebin is a free, zero-knowledge tool for sharing passwords, API keys,
        and other sensitive text without leaving them sitting around in chat
        logs, email inboxes, or ticketing systems. You create a one-time link,
        send it, and once opened the secret is permanently destroyed.
      </p>
      <p class="text-gray-600 dark:text-gray-300">
        No signup, no accounts, no tracking. Encryption happens entirely in your
        browser &mdash; our servers never see your secrets in plain text.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Common Use Cases</h2>
      <ul class="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
        <li>
          <strong>Onboarding</strong> &mdash; Send initial passwords or
          credentials to new team members.
        </li>
        <li>
          <strong>DevOps</strong> &mdash; Share API keys, database connection
          strings, or environment variables.
        </li>
        <li>
          <strong>Client handoffs</strong> &mdash; Pass login credentials to
          freelancers or clients without email trails.
        </li>
        <li>
          <strong>IT support</strong> &mdash; Send temporary passwords or WiFi
          credentials to end users.
        </li>
        <li>
          <strong>Automation</strong> &mdash; Use the{' '}
          <a href="/oncebin.sh" class="text-blue-600 dark:text-blue-400 hover:underline">
            CLI script
          </a>
          ,{' '}
          <a href="/SKILL.md" class="text-blue-600 dark:text-blue-400 hover:underline">
            API
          </a>
          , or{' '}
          <a href="/SKILL.md" class="text-blue-600 dark:text-blue-400 hover:underline">
            SKILL.md
          </a>{' '}
          to integrate into your workflow.
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">FAQ</h2>
      <div class="space-y-6">
        <div>
          <h3 class="font-semibold mb-1">
            What happens when someone opens my link?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            The encrypted secret is fetched once, decrypted in the browser, and
            immediately marked as burned. After that, the same link will only
            show that the secret has already been viewed or has expired.
          </p>
        </div>
        <div>
          <h3 class="font-semibold mb-1">How long are secrets kept?</h3>
          <p class="text-gray-600 dark:text-gray-300">
            All secrets are automatically deleted after 30 days.
          </p>
        </div>
        <div>
          <h3 class="font-semibold mb-1">Can Oncebin see my secrets?</h3>
          <p class="text-gray-600 dark:text-gray-300">
            Secrets are encrypted in your browser before they are sent to
            Oncebin. The server only stores the encrypted blob and never sees the
            plaintext. The decryption key lives in the URL fragment and is never
            sent to the server.
          </p>
        </div>
        <div>
          <h3 class="font-semibold mb-1">Is this a password manager?</h3>
          <p class="text-gray-600 dark:text-gray-300">
            No. Oncebin is designed for short-lived sharing, not long-term
            storage. Use a dedicated password manager for ongoing storage of your
            secrets.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-4">Security Overview</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Oncebin is built around a simple principle: store as little as possible,
        for as short a time as possible. Encryption happens client-side using
        modern browser crypto APIs before any data reaches our database.
      </p>
      <ul class="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300 mb-4">
        <li>
          Secrets are encrypted in your browser using a randomly generated key.
        </li>
        <li>
          The encryption key is embedded in the URL fragment, which is not sent
          to the server.
        </li>
        <li>
          Encrypted secrets are deleted after a single successful read or when
          they expire.
        </li>
        <li>
          We track aggregate counters (like total secrets revealed) but never
          store plaintext content.
        </li>
      </ul>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Like any tool, Oncebin should be one part of your security story. Use
        unique passwords, enable multi-factor authentication where possible, and
        treat secret links as you would any other sensitive information.
      </p>
      <p class="text-gray-600 dark:text-gray-300">
        Oncebin is open source.{' '}
        <a
          href="https://github.com/lsl/oncebin"
          class="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </p>
      <p class="text-gray-600 dark:text-gray-300 mt-2">
        Have questions or feedback?{' '}
        <a href="/contact" class="text-blue-600 dark:text-blue-400 hover:underline">
          Get in touch
        </a>
      </p>
    </section>
  </div>
);
