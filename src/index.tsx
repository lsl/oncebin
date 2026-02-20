// Copyright (c) 2026 Louis Laugesen. MIT License.

import { Hono } from 'hono';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { View } from './pages/View';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

type Env = {
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
  };
};

const MAX_ENCRYPTED_SIZE = 100 * 1024;

const app = new Hono<Env>();

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Page Routes (TSX server-rendered) ---

app.get('/', (c) =>
  c.html(
    <Layout
      title="Oncebin - Share Passwords &amp; Secrets with Self-Destructing Links"
      description="Share passwords, API keys, and credentials securely. End-to-end encrypted one-time links that self-destruct after viewing. No signup required."
      ogTitle="Oncebin - Self-Destructing Secret Sharing"
      ogDescription="Share passwords, API keys, and credentials with end-to-end encrypted one-time links. No signup required."
    >
      <Home />
    </Layout>
  )
);

app.get('/o/:id', (c) =>
  c.html(
    <Layout
      title="Oncebin - A Secret Has Been Shared With You"
      description="Someone shared an encrypted secret with you. View it once — it will be permanently destroyed after reading."
      ogTitle="Oncebin - A Secret Has Been Shared With You"
      ogDescription="Someone shared an encrypted, self-destructing secret with you via Oncebin."
    >
      <View />
    </Layout>
  )
);

app.get('/about', (c) =>
  c.html(
    <Layout
      title="About Oncebin - Secure One-Time Secret Sharing"
      description="How Oncebin keeps your shared secrets safe with end-to-end encryption, zero-knowledge architecture, and self-destructing one-time links."
      ogTitle="About Oncebin - Secure One-Time Secret Sharing"
      ogDescription="End-to-end encrypted, self-destructing links for sharing passwords, API keys, and credentials. No signup required."
    >
      <About />
    </Layout>
  )
);

app.get('/contact', (c) =>
  c.html(
    <Layout
      title="Contact Oncebin"
      description="Get in touch with the Oncebin team. Questions, feedback, or bug reports welcome."
    >
      <Contact />
    </Layout>
  )
);

// --- HTMX Fragment: Status Badge ---

app.get('/fragments/status/:id', async (c) => {
  const id = c.req.param('id');
  const paste = await c.env.DB.prepare(
    "SELECT burned, (burned = 0 AND created_at < datetime('now', '-30 days')) AS is_expired FROM pastes WHERE id = ?"
  )
    .bind(id)
    .first<{ burned: number; is_expired: number }>();

  if (!paste) {
    return c.html(
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Expired
      </span>
    );
  }

  if (paste.burned) {
    return c.html(
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        Read
      </span>
    );
  }

  if (paste.is_expired) {
    return c.html(
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Expired
      </span>
    );
  }

  return c.html(
    <span
      hx-get={`/fragments/status/${id}`}
      hx-trigger="every 60s"
      hx-swap="outerHTML"
      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    >
      Pending
    </span>
  );
});

// --- API Routes (unchanged logic) ---

app.post('/api/paste', async (c) => {
  let body: { encrypted?: string; iv?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  if (!body.encrypted || !body.iv) {
    return c.json({ error: 'missing_fields' }, 400);
  }

  if (body.encrypted.length > MAX_ENCRYPTED_SIZE) {
    return c.json({ error: 'too_large' }, 413);
  }

  const id = generateId();

  await c.env.DB.prepare(
    'INSERT INTO pastes (id, encrypted_content, iv) VALUES (?, ?, ?)'
  )
    .bind(id, body.encrypted, body.iv)
    .run();

  return c.json({ id });
});

app.post('/api/paste/:id/burn', async (c) => {
  const id = c.req.param('id');

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE pastes SET burned = 1, read_at = datetime('now') WHERE id = ? AND burned = 0 AND created_at > datetime('now', '-30 days')"
    ).bind(id),
    c.env.DB.prepare(
      'SELECT encrypted_content, iv, burned, created_at, read_at FROM pastes WHERE id = ?'
    ).bind(id),
  ]);

  const updated = batchResults[0].meta.changes > 0;
  const rows = batchResults[1].results as Array<{
    encrypted_content: string;
    iv: string;
    burned: number;
    created_at: string;
    read_at: string | null;
  }>;
  const paste = rows[0];

  if (!paste) {
    return c.json({ error: 'not_found' }, 404);
  }

  if (updated) {
    const encrypted = paste.encrypted_content;
    const iv = paste.iv;

    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE pastes SET encrypted_content = "", iv = "" WHERE id = ?'
      ).bind(id),
      c.env.DB.prepare(
        "INSERT INTO stats (key, value) VALUES ('total_revealed', 1) ON CONFLICT(key) DO UPDATE SET value = value + 1"
      ),
    ]);

    return c.json({
      encrypted,
      iv,
    });
  }

  if (paste.burned) {
    return c.json({ error: 'already_read', read_at: paste.read_at }, 410);
  }

  return c.json({ error: 'expired' }, 410);
});

app.get('/api/paste/:id/status', async (c) => {
  const id = c.req.param('id');

  const paste = await c.env.DB.prepare(
    "SELECT burned, created_at, read_at, (burned = 0 AND created_at < datetime('now', '-30 days')) AS is_expired FROM pastes WHERE id = ?"
  )
    .bind(id)
    .first<{
      burned: number;
      created_at: string;
      read_at: string | null;
      is_expired: number;
    }>();

  if (!paste) {
    return c.json({ status: 'not_found' });
  }

  if (paste.burned) {
    return c.json({
      status: 'read',
      created_at: paste.created_at,
      read_at: paste.read_at,
    });
  }

  if (paste.is_expired) {
    return c.json({ status: 'expired', created_at: paste.created_at });
  }

  return c.json({ status: 'pending', created_at: paste.created_at });
});

export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledEvent,
    env: { DB: D1Database },
    _ctx: ExecutionContext
  ) {
    await env.DB.prepare(
      "DELETE FROM pastes WHERE created_at < datetime('now', '-30 days')"
    ).run();
  },
};
