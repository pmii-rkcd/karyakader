import test from 'node:test';
import assert from 'node:assert/strict';
import { createNalarHandlers, prepareNalarDraft, persistNalarDraft } from '../lib/nalar-tempaan.ts';
import { isPublicArticle } from '../lib/article-visibility.ts';

const TOKEN = 'test-only-nalar-token-with-at-least-32-characters';
const payload = (extra = {}) => ({ editionId: '2026-10-30', title: 'Contoh Edisi Nalar Tempaan', content: Array(320).fill('gagasan').join(' '), sources: [{ title: 'Contoh rujukan', url: 'https://example.org/rujukan' }], ...extra });
const request = (body, authorization = `Bearer ${TOKEN}`) => new Request('http://localhost/api/nalar-tempaan', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authorization }, body: JSON.stringify(body) });

function memoryDb() {
  const rows = new Map();
  return {
    rows,
    collection: name => ({ doc: id => `${name}/${id}` }),
    runTransaction: async callback => {
      const writes = [];
      const result = await callback({
        get: async ref => ({ exists: rows.has(ref), data: () => rows.get(ref) }),
        create: (ref, data) => writes.push([ref, data]),
      });
      for (const [ref] of writes) assert.equal(rows.has(ref), false);
      for (const [ref, data] of writes) rows.set(ref, data);
      return result;
    },
  };
}

function handlers(db = memoryDb(), token = TOKEN) {
  return createNalarHandlers({ token: () => token, checkConnection: async () => {}, save: draft => persistNalarDraft(db, draft, () => new Date()) });
}

test('unauthenticated requests cannot reach storage', async () => {
  let called = false;
  const api = createNalarHandlers({ token: () => TOKEN, checkConnection: async () => { called = true; }, save: async () => { called = true; return { duplicate: false }; } });
  assert.equal((await api.POST(request(payload(), 'Bearer wrong'))).status, 401);
  assert.equal((await api.GET(new Request('http://localhost'))).status, 401);
  assert.equal(called, false);
});

test('missing or short server token fails closed', async () => {
  for (const token of [undefined, 'short']) {
    const api = createNalarHandlers({ token: () => token, checkConnection: async () => {}, save: async () => { throw new Error('Must not save'); } });
    assert.equal((await api.POST(request(payload()))).status, 503);
  }
});

test('valid submission appears in existing dashboard as a non-public unscheduled draft', async () => {
  const db = memoryDb();
  const response = await handlers(db).POST(request(payload()));
  assert.equal(response.status, 201);
  const result = await response.json();
  const article = db.rows.get(`articles/${result.id}`);
  assert.equal(article.category, 'Nalar Tempaan');
  assert.equal(article.status, 'Draft');
  assert.equal(article.publishAt, null);
  assert.equal(article.published, false);
  assert.equal(isPublicArticle(article, new Date('2099-01-01')), false);
  assert.equal(article.kredit.penulis, 'Redaksi');
});

test('publish mode creates a public Nalar Tempaan article with its cover', async () => {
  const db = memoryDb();
  const api = createNalarHandlers({ token: () => TOKEN, publicationMode: 'publish', checkConnection: async () => {}, save: draft => persistNalarDraft(db, draft, () => new Date()) });
  const response = await api.POST(request(payload({ imageUrl: 'https://example.org/cover.jpg' })));
  assert.equal(response.status, 201);
  const result = await response.json();
  const article = db.rows.get(`articles/${result.id}`);
  assert.equal(result.mode, 'publish');
  assert.equal(result.articlePath, `/berita/${article.slug}`);
  assert.equal(article.category, 'Nalar Tempaan');
  assert.equal(article.status, 'Langsung Terbit');
  assert.equal(article.published, true);
  assert.equal(isPublicArticle(article), true);
  assert.equal(article.automation.editorialReviewRequired, false);
});

test('publish mode refuses missing covers without creating an article', async () => {
  const db = memoryDb();
  const api = createNalarHandlers({ token: () => TOKEN, publicationMode: 'publish', checkConnection: async () => {}, save: draft => persistNalarDraft(db, draft, () => new Date()) });
  assert.equal((await api.POST(request(payload()))).status, 400);
  assert.equal(db.rows.size, 0);
});

test('retrying the same edition preserves human edits and publication status', async () => {
  const db = memoryDb();
  const api = handlers(db);
  const first = await (await api.POST(request(payload()))).json();
  const article = db.rows.get(`articles/${first.id}`);
  article.title = 'Judul hasil kurasi'; article.published = true; article.status = 'Langsung Terbit';
  const response = await api.POST(request(payload()));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).duplicate, true);
  assert.equal(article.title, 'Judul hasil kurasi');
  assert.equal(article.published, true);
  assert.equal(db.rows.size, 2);
});

test('same edition with a changed payload is rejected without overwriting', async () => {
  const db = memoryDb();
  const api = handlers(db);
  await api.POST(request(payload()));
  assert.equal((await api.POST(request(payload({ title: 'Judul berbeda' })))).status, 409);
  assert.equal(db.rows.size, 2);
});

test('a deleted draft is not recreated by a delayed retry', async () => {
  const db = memoryDb();
  const api = handlers(db);
  const result = await (await api.POST(request(payload()))).json();
  db.rows.delete(`articles/${result.id}`);
  assert.equal((await api.POST(request(payload()))).status, 409);
  assert.equal(db.rows.size, 1);
});

test('sender cannot inject publishing flags or schedules', async () => {
  for (const extra of [{ published: true }, { status: 'Langsung Terbit' }, { publishAt: '2020-01-01' }, { category: 'Kabar Dari Kawah' }]) {
    assert.equal((await handlers().POST(request(payload(extra)))).status, 400);
  }
});

test('untrusted article text and source titles are escaped; executable URLs rejected', () => {
  const draft = prepareNalarDraft(payload({ content: `<script>alert(1)</script> ${Array(319).fill('kata').join(' ')}`, sources: [{ title: '<img onerror=alert(1)>', url: 'https://example.org/?q="' }] }));
  assert.ok(draft.article.content.includes('&lt;script&gt;'));
  assert.ok(!draft.article.content.includes('<script>'));
  assert.ok(!draft.article.content.includes('<img'));
  for (const url of ['javascript:alert(1)', 'http://example.org', 'https://user:password@example.org']) {
    assert.throws(() => prepareNalarDraft(payload({ sources: [{ title: 'Rujukan', url }] })));
    assert.throws(() => prepareNalarDraft(payload({ imageUrl: url })));
  }
});

test('article limits and source counts are enforced', () => {
  for (const count of [299, 501]) assert.throws(() => prepareNalarDraft(payload({ content: Array(count).fill('kata').join(' ') })));
  for (const count of [300, 500]) assert.doesNotThrow(() => prepareNalarDraft(payload({ content: Array(count).fill('kata').join(' ') })));
  for (const sources of [[], Array(4).fill({ title: 'Judul', url: 'https://example.org' })]) assert.throws(() => prepareNalarDraft(payload({ sources })));
});

test('malformed input is rejected before storage', async () => {
  for (const body of [null, [], 'text', payload({ editionId: '../articles' }), payload({ tags: 'x' })]) assert.equal((await handlers().POST(request(body))).status, 400);
  const malformed = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await handlers().POST(malformed)).status, 400);
});

test('oversized body is rejected even without Content-Length', async () => {
  const big = request({ content: 'x'.repeat(65537) });
  assert.equal(big.headers.has('content-length'), false);
  assert.equal((await handlers().POST(big)).status, 413);
});

test('storage errors return failure rather than a successful receipt', async () => {
  const api = createNalarHandlers({ token: () => TOKEN, checkConnection: async () => { throw new Error('private database info'); }, save: async () => { throw new Error('private database info'); } });
  const response = await api.POST(request(payload()));
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes('private database info'));
  assert.equal((await api.GET(new Request('http://localhost', { headers: { Authorization: `Bearer ${TOKEN}` } }))).status, 503);
});

test('publish retries preserve editorial unpublishing and content edits', async () => {
  const db = memoryDb();
  const api = createNalarHandlers({ token: () => TOKEN, publicationMode: 'publish', checkConnection: async () => {}, save: draft => persistNalarDraft(db, draft, () => new Date()) });
  const body = payload({ imageUrl: 'https://example.org/cover.jpg' });
  const first = await (await api.POST(request(body))).json();
  const article = db.rows.get(`articles/${first.id}`);
  Object.assign(article, { title: 'Suntingan redaksi', content: '<p>Isi hasil suntingan</p>', published: false, status: 'Draft' });
  const snapshot = structuredClone(article);
  const retry = await api.POST(request(body));
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).duplicate, true);
  assert.deepEqual(article, snapshot);
  assert.equal((await api.POST(request({ ...body, title: 'Kiriman berbeda' }))).status, 409);
  assert.deepEqual(article, snapshot);
});

test('an existing article without a receipt cannot be overwritten', async () => {
  const db = memoryDb();
  const draft = prepareNalarDraft(payload());
  db.rows.set(`articles/${draft.id}`, { title: 'Artikel yang sudah ada' });
  assert.equal((await handlers(db).POST(request(payload()))).status, 409);
  assert.equal(db.rows.size, 1);
  assert.equal(db.rows.get(`articles/${draft.id}`).title, 'Artikel yang sudah ada');
});

test('connection check is authenticated and never writes; non-JSON is rejected', async () => {
  let checks = 0;
  const api = createNalarHandlers({ token: () => TOKEN, publicationMode: 'publish', checkConnection: async () => { checks++; }, save: async () => { assert.fail('Must not write'); } });
  const response = await api.GET(new Request('http://localhost', { headers: { Authorization: `Bearer ${TOKEN}` } }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).mode, 'publish');
  assert.equal(checks, 1);
  const invalid = new Request('http://localhost', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'text/plain' }, body: '{}' });
  assert.equal((await api.POST(invalid)).status, 415);
});
