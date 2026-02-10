import { Hono } from 'hono';

import { homePage, viewPage } from './pages';
import { clientJS } from './client';

type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const MAX_ENCRYPTED_SIZE = 100 * 1024;

const app = new Hono<Env>();

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

app.get('/', (c) => {
  return c.html(homePage());
});

app.get('/p/:id', (c) => {
  return c.html(viewPage());
});

app.get('/app.js', (c) => {
  return new Response(clientJS, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

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
      "UPDATE pastes SET burned = 1, read_at = datetime('now') WHERE id = ? AND burned = 0 AND created_at > datetime('now', '-7 days')"
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
    return c.json({
      encrypted: paste.encrypted_content,
      iv: paste.iv,
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
    "SELECT burned, created_at, read_at, (burned = 0 AND created_at < datetime('now', '-7 days')) AS is_expired FROM pastes WHERE id = ?"
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

type WorkerEnv = {
  DB: D1Database;
};

export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledEvent,
    env: WorkerEnv,
    _ctx: ExecutionContext
  ) {
    await env.DB.prepare(
      "DELETE FROM pastes WHERE burned = 1 AND read_at < datetime('now', '-30 days')"
    ).run();

    await env.DB.prepare(
      "DELETE FROM pastes WHERE burned = 0 AND created_at < datetime('now', '-7 days')"
    ).run();
  },
};
