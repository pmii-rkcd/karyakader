import QRCode from 'qrcode';

export function getPublicArticleUrl(slug: string): string {
  return `https://karyakader.id/berita/${encodeURIComponent(slug)}`;
}

export function createArticleQr(slug: string): Promise<string> {
  return QRCode.toDataURL(getPublicArticleUrl(slug), {
    type: 'image/png',
    width: 768,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
}
