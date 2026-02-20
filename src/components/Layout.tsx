import type { FC, PropsWithChildren } from 'hono/jsx';

type LayoutProps = PropsWithChildren<{
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
}>;

const GitHubIcon = () => (
  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
  </svg>
);

export const Layout: FC<LayoutProps> = ({
  title,
  description,
  ogTitle,
  ogDescription,
  children,
}) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={description} />
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      <link rel="stylesheet" href="/style.css" />
      <link rel="icon" href="/img/favicon.svg" />
    </head>
    <body class="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <header class="w-full max-w-3xl mx-auto px-4 py-4">
        <nav class="flex justify-between items-center">
          <a href="/">
            <picture>
              <source srcset="/img/banner-dark.svg" media="(prefers-color-scheme: dark)" />
              <source srcset="/img/banner-light.svg" media="(prefers-color-scheme: light)" />
              <img src="/img/banner-light.svg" alt="Oncebin" class="h-8" />
            </picture>
          </a>
          <a
            href="https://github.com/lsl/oncebin"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            aria-label="GitHub"
          >
            <GitHubIcon />
          </a>
        </nav>
      </header>

      <main class="flex-1 w-full max-w-3xl mx-auto px-4 pb-12">
        {children}
      </main>

      <footer class="w-full max-w-3xl mx-auto px-4 pb-8">
        <p class="text-center text-sm text-gray-400 dark:text-gray-600 mt-12 pt-4 border-t border-gray-200 dark:border-gray-800">
          End-to-end encrypted. Your secrets never touch our servers in plain text.
        </p>
        <div class="flex items-center justify-center gap-4 mt-3 text-sm text-gray-400 dark:text-gray-600">
          <a href="/about" class="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">About</a>
          <a href="/contact" class="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Contact</a>
          <a
            href="https://github.com/lsl/oncebin"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            aria-label="GitHub"
          >
            <GitHubIcon />
          </a>
        </div>
      </footer>

      <script src="https://unpkg.com/htmx.org@2.0.4"></script>
      <script src="/js/crypto.js"></script>
      <script src="/js/app.js"></script>
    </body>
  </html>
);
