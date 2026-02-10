const PICO_CSS = 'https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css';

const styles = `
  textarea#content {
    font-family: 'Courier New', Courier, monospace;
    resize: vertical;
    min-height: 10rem;
  }
  .hidden { display: none !important; }
  #size-info {
    display: block;
    text-align: right;
    font-size: 0.875rem;
    color: var(--pico-muted-color);
    margin-top: -0.5rem;
    margin-bottom: 1rem;
  }
  #size-info.over-limit { color: var(--pico-del-color); font-weight: 600; }
  #result-url {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .btn-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .btn-group button { width: auto; margin-bottom: 0; }
  pre#paste-content {
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 60vh;
    overflow-y: auto;
    margin: 0;
    padding: 1rem;
    font-size: 0.875rem;
  }
  .status-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .status-pending { background: var(--pico-primary-background); color: var(--pico-primary-inverse); }
  .status-read { background: #c0392b; color: #fff; }
  .status-expired { background: var(--pico-secondary-background); color: var(--pico-secondary-inverse); }
  .recent-paste {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--pico-muted-border-color);
    gap: 1rem;
  }
  .recent-paste:last-child { border-bottom: none; }
  .recent-paste-info { flex: 1; min-width: 0; }
  .recent-paste-url {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.8rem;
    color: var(--pico-muted-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .recent-paste-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: var(--pico-muted-color);
  }
  .copied { color: var(--pico-ins-color); font-weight: 600; font-size: 0.875rem; }
  .encrypt-note {
    text-align: center;
    font-size: 0.8rem;
    color: var(--pico-muted-color);
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--pico-muted-border-color);
  }
  @media (max-width: 576px) {
    .recent-paste {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
`;

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="Share secrets that self-destruct after one view. End-to-end encrypted.">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Share secrets that self-destruct after one view. End-to-end encrypted.">
  <link rel="stylesheet" href="${PICO_CSS}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27><text y=%27.9em%27 font-size=%2790%27>&#128274;</text></svg>">
  <style>${styles}</style>
</head>
<body>
  <header class="container">
    <nav>
      <ul><li><a href="/"><strong>OnceBin</strong></a></li></ul>
    </nav>
  </header>
  <main class="container">${body}</main>
  <footer class="container">
    <p class="encrypt-note">End-to-end encrypted. Your secrets never touch our servers in plain text.</p>
  </footer>
  <script src="/app.js"></script>
</body>
</html>`;
}

export function homePage(): string {
  return layout('OnceBin - Share secrets securely', `
    <section>
      <hgroup style="text-align:center;margin-bottom:2rem;">
        <h1>Share a secret</h1>
        <p>Create a one-time link that self-destructs after being read.</p>
      </hgroup>

      <div id="create-form">
        <textarea id="content" placeholder="Paste your secret here..." rows="6" autofocus></textarea>
        <small id="size-info">0 B / 50 KB</small>
        <button id="create-btn" disabled>Create Secret Link</button>
      </div>

      <article id="create-result" class="hidden">
        <header>Your secret link is ready</header>
        <input type="text" id="result-url" readonly>
        <span id="copy-feedback"></span>
        <div class="btn-group">
          <button id="copy-btn">Copy Link</button>
          <button id="new-btn" class="secondary outline">Create Another</button>
        </div>
        <footer>
          <small>This link can only be opened <strong>once</strong>. After viewing, the secret is permanently destroyed.</small>
        </footer>
      </article>
    </section>

    <section id="recent-section" class="hidden">
      <h3>Your Recent Pastes</h3>
      <div id="recent-list"></div>
    </section>
  `);
}

export function viewPage(): string {
  return layout('OnceBin - Secret shared with you', `
    <article id="view-reveal">
      <header><strong>Someone shared a secret with you</strong></header>
      <p>This secret can only be viewed <strong>once</strong>. It will be permanently destroyed after you reveal it.</p>
      <button id="reveal-btn">Reveal Secret</button>
    </article>

    <article id="view-content" class="hidden">
      <header>
        <strong>Secret Content</strong>
        <span id="copy-content-feedback" style="margin-left:1rem;"></span>
      </header>
      <pre id="paste-content"></pre>
      <footer>
        <div class="btn-group" style="margin-bottom:0.5rem;">
          <button id="copy-content-btn" class="secondary outline">Copy to Clipboard</button>
        </div>
        <small>This secret has been permanently destroyed and can no longer be accessed.</small>
      </footer>
    </article>

    <article id="view-error" class="hidden">
      <header><strong id="error-title"></strong></header>
      <p id="error-message"></p>
      <footer><a href="/">Create a new secret</a></footer>
    </article>
  `);
}
