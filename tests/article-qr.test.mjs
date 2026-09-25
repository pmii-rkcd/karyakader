import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { createArticleQr, getPublicArticleUrl } from '../lib/article-qr.ts';

test('QR uses the public article URL, including encoded special characters', () => {
  assert.equal(getPublicArticleUrl('kegiatan-kader'), 'https://karyakader.id/berita/kegiatan-kader');
  assert.equal(getPublicArticleUrl('judul #1/baru'), 'https://karyakader.id/berita/judul%20%231%2Fbaru');
});

for (const slug of ['kegiatan-kader', 'artikel-lain-123', 'kegiatan-pengurus-rayon-'.repeat(12)]) {
  test(`generated PNG decodes to the exact article URL (${slug.length} characters)`, async () => {
    const dataUrl = await createArticleQr(slug);
    assert.ok(dataUrl.startsWith('data:image/png;base64,'));
    const png = PNG.sync.read(Buffer.from(dataUrl.split(',')[1], 'base64'));
    const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    assert.ok(result, 'QR must be readable by an independent decoder');
    assert.equal(result.data, getPublicArticleUrl(slug));
    assert.equal(png.width, 768);
    assert.equal(png.height, 768);
  });
}
