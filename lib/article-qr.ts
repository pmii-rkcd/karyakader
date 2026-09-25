import QRCode from 'qrcode';

export function getPublicArticleUrl(slug: string): string {
  return `https://karyakader.id/berita/${encodeURIComponent(slug)}`;
}

export function createArticleQr(slug: string): Promise<string> {
  return QRCode.toDataURL(getPublicArticleUrl(slug), {
    type: 'image/png',
    width: 768,
    margin: 4,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export const QR_LOGO_FRACTION = 0.2;

// Clip the existing circular logo instead of drawing its white square corners.
// Keep the QR's outer quiet zone unchanged and do not add a white logo backing.
export function drawArticleQrLogo(context: CanvasRenderingContext2D, logo: CanvasImageSource, size: number): void {
  const logoSize = size * QR_LOGO_FRACTION;
  const offset = (size - logoSize) / 2;
  context.save();
  context.beginPath();
  context.arc(size / 2, size / 2, logoSize / 2 - 0.5, 0, Math.PI * 2);
  context.clip();
  context.drawImage(logo, offset, offset, logoSize, logoSize);
  context.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gagal memuat gambar QR atau logo PMII.'));
    image.src = src;
  });
}

export async function createBrandedArticleQr(slug: string): Promise<string> {
  const [qr, logo] = await Promise.all([
    createArticleQr(slug).then(loadImage),
    // Use the image optimizer so phones do not decode the full-resolution icon.
    loadImage('/_next/image?url=%2Ficon.png&w=256&q=75'),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser tidak dapat membuat QR.');
  context.drawImage(qr, 0, 0, canvas.width, canvas.height);
  drawArticleQrLogo(context, logo, canvas.width);
  return canvas.toDataURL('image/png');
}
