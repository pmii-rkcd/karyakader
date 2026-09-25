import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { createArticleQr, getPublicArticleUrl, drawArticleQrLogo, QR_LOGO_FRACTION } from '../lib/article-qr.ts';

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

test('centered PMII logo has no white square and branded QR remains readable', async () => {
  const originalLogo = await loadImage(fileURLToPath(new URL('../app/icon.png', import.meta.url)));
  const logo = createCanvas(256, 256);
  logo.getContext('2d').drawImage(originalLogo, 0, 0, 256, 256);

  for (const slug of ['kegiatan-kader', 'artikel-lain-123', 'kegiatan-pengurus-rayon-'.repeat(12)]) {
    const source = await loadImage(await createArticleQr(slug));
    const canvas = createCanvas(768, 768);
    const context = canvas.getContext('2d');
    context.drawImage(source, 0, 0);
    const before = context.getImageData(0, 0, 768, 768).data;
    drawArticleQrLogo(context, logo, 768);
    const after = context.getImageData(0, 0, 768, 768).data;
    let changedPixels = 0;
    for (let y = 0; y < 768; y++) {
      for (let x = 0; x < 768; x++) {
        const index = (y * 768 + x) * 4;
        const changed = before[index] !== after[index] || before[index + 1] !== after[index + 1] || before[index + 2] !== after[index + 2];
        if (changed) {
          changedPixels++;
          assert.ok(Math.hypot(x + 0.5 - 384, y + 0.5 - 384) <= 768 * QR_LOGO_FRACTION / 2 + 1, 'Pixels outside the circular logo must remain unchanged');
        }
      }
    }
    assert.ok(changedPixels > 1000, 'Logo must be present in the downloadable image');
    for (const size of [768, 300]) {
      const preview = createCanvas(size, size);
      preview.getContext('2d').drawImage(canvas, 0, 0, size, size);
      const pixels = preview.getContext('2d').getImageData(0, 0, size, size);
      const decoded = jsQR(pixels.data, size, size);
      assert.equal(decoded?.data, getPublicArticleUrl(slug), `Branded QR must scan at ${size}px`);
    }
  }
});
