import { createHash, timingSafeEqual } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';

const MAX_BYTES = 64 * 1024;

export class NalarRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

type Source = { title: string; url: string };
export type NalarDraft = ReturnType<typeof prepareNalarDraft>;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

function text(value: unknown, name: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new NalarRequestError(`${name} wajib diisi dan maksimal ${max} karakter.`);
  }
  return value.trim();
}

function httpsUrl(value: unknown, name: string): string {
  const raw = text(value, name, 2048);
  let url: URL;
  try { url = new URL(raw); } catch { throw new NalarRequestError(`${name} harus berupa URL HTTPS.`); }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new NalarRequestError(`${name} harus berupa URL HTTPS tanpa kredensial.`);
  }
  return url.href;
}

export function isNalarAuthorized(request: Request, token: string | undefined): boolean {
  if (!token || token.length < 32) return false;
  const supplied = request.headers.get('authorization') || '';
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(supplied), digest(`Bearer ${token}`));
}

export function prepareNalarDraft(input: unknown, mode: 'draft' | 'publish' = 'draft') {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new NalarRequestError('Data artikel harus berupa objek JSON.');
  const body = input as Record<string, unknown>;
  const allowed = ['editionId', 'title', 'content', 'sources', 'imageUrl', 'tags'];
  if (Object.keys(body).some(key => !allowed.includes(key))) throw new NalarRequestError('Ada field yang tidak didukung. Status terbit diatur oleh server.');

  const editionId = text(body.editionId, 'editionId', 80);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(editionId)) throw new NalarRequestError('editionId hanya boleh memuat huruf, angka, titik, garis bawah, dan tanda hubung.');
  const title = text(body.title, 'Judul', 200);
  const content = text(body.content, 'Isi artikel', 12000).replace(/\r\n?/g, '\n');
  const wordCount = content.split(/\s+/u).length;
  if (wordCount < 300 || wordCount > 500) throw new NalarRequestError(`Isi artikel harus 300–500 kata; diterima ${wordCount} kata.`);

  if (!Array.isArray(body.sources) || body.sources.length < 1 || body.sources.length > 3) throw new NalarRequestError('Sertakan 1–3 rujukan.');
  const sources: Source[] = body.sources.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new NalarRequestError('Format rujukan tidak valid.');
    const source = item as Record<string, unknown>;
    return { title: text(source.title, 'Judul rujukan', 300), url: httpsUrl(source.url, 'Tautan rujukan') };
  });
  const imageUrl = body.imageUrl === undefined || body.imageUrl === '' ? '' : httpsUrl(body.imageUrl, 'URL sampul');
  if (mode === 'publish' && !imageUrl) throw new NalarRequestError('Sampul wajib tersedia sebelum artikel diterbitkan otomatis.');
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.length > 10)) throw new NalarRequestError('Tag harus berupa daftar dengan maksimal 10 item.');
  const tags = [...new Set(((body.tags || []) as unknown[]).map(value => text(value, 'Tag', 60)))];
  const id = `nalar-${createHash('sha256').update(editionId).digest('hex').slice(0, 32)}`;
  const slugTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'nalar-tempaan';
  const html = content.split(/\n\s*\n/u).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('')
    + '<h3>Rujukan</h3><ol>' + sources.map(source => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`).join('') + '</ol>';
  const payloadHash = createHash('sha256').update(JSON.stringify({ title, content, sources, imageUrl, tags })).digest('hex');

  return {
    id, editionId, payloadHash,
    article: {
      title, slug: `${slugTitle}-${id}`, dateline: '', content: html,
      category: 'Nalar Tempaan', status: mode === 'publish' ? 'Langsung Terbit' : 'Draft', published: mode === 'publish', publishAt: null,
      imageUrl, tags, authorId: 'automation:nalar-tempaan', authorEmail: '',
      kredit: { penulis: 'Redaksi', penulisSlug: '', fotoPenulis: '', editor: 'Redaksi', fotoEditor: '', fotografer: '-', fotoFotografer: '', sumber: 'Nalar Tempaan', fotoSumber: '' },
      automation: { source: 'nalar-tempaan', editionId, payloadHash, wordCount, aiAssisted: true, editorialReviewRequired: mode !== 'publish' },
    },
  };
}

async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new NalarRequestError('Gunakan Content-Type application/json.', 415);
  const length = request.headers.get('content-length');
  if (length && Number(length) > MAX_BYTES) throw new NalarRequestError('Data artikel terlalu besar.', 413);
  if (!request.body) throw new NalarRequestError('Data artikel kosong.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new NalarRequestError('Data artikel terlalu besar.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new NalarRequestError('JSON tidak valid.'); }
}

type Dependencies = {
  token: () => string | undefined;
  publicationMode?: 'draft' | 'publish';
  checkConnection: () => Promise<void>;
  save: (draft: NalarDraft) => Promise<{ duplicate: boolean }>;
};

export async function persistNalarDraft(db: Firestore, draft: NalarDraft, serverTimestamp: () => unknown): Promise<{ duplicate: boolean }> {
  const articleRef = db.collection('articles').doc(draft.id);
  const receiptRef = db.collection('nalar_tempaan_deliveries').doc(draft.id);
  return db.runTransaction(async transaction => {
    const [receipt, article] = await Promise.all([transaction.get(receiptRef), transaction.get(articleRef)]);
    if (receipt.exists) {
      if (receipt.data()?.payloadHash !== draft.payloadHash) throw new NalarRequestError('editionId sudah digunakan untuk isi berbeda. Gunakan ID edisi baru.', 409);
      if (!article.exists) throw new NalarRequestError('Draf edisi ini sudah dihapus oleh redaksi dan tidak dibuat ulang otomatis.', 409);
      return { duplicate: true };
    }
    if (article.exists) throw new NalarRequestError('ID artikel sudah digunakan. Tidak ada artikel yang ditimpa.', 409);
    transaction.create(articleRef, { ...draft.article, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.create(receiptRef, { editionId: draft.editionId, articleId: draft.id, payloadHash: draft.payloadHash, receivedAt: serverTimestamp() });
    return { duplicate: false };
  });
}

export function createNalarHandlers(deps: Dependencies) {
  const respond = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const denied = (request: Request) => {
    const token = deps.token();
    if (!token || token.length < 32) return respond({ ok: false, message: 'Koneksi Nalar Tempaan belum dikonfigurasi.' }, 503);
    if (!isNalarAuthorized(request, token)) return respond({ ok: false, message: 'Autentikasi tidak valid.' }, 401);
    return null;
  };
  const failed = (error: unknown) => error instanceof NalarRequestError
    ? respond({ ok: false, message: error.message }, error.status)
    : respond({ ok: false, message: 'Koneksi penyimpanan belum tersedia. Periksa konfigurasi server dan coba lagi.' }, 503);

  return {
    GET: async (request: Request) => {
      const rejection = denied(request);
      if (rejection) return rejection;
      try {
        await deps.checkConnection();
        return respond({ ok: true, category: 'Nalar Tempaan', mode: deps.publicationMode || 'draft' });
      } catch (error) { return failed(error); }
    },
    POST: async (request: Request) => {
      const rejection = denied(request);
      if (rejection) return rejection;
      try {
        const draft = prepareNalarDraft(await readJson(request), deps.publicationMode || 'draft');
        const { duplicate } = await deps.save(draft);
        return respond({ ok: true, id: draft.id, duplicate, mode: deps.publicationMode || 'draft', dashboardPath: '/dashboard', articlePath: `/berita/${draft.article.slug}` }, duplicate ? 200 : 201);
      } catch (error) { return failed(error); }
    },
  };
}
