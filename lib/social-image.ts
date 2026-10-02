const siteOrigin = 'https://karyakader.id';
const fallbackShareImage = `${siteOrigin}/icon.png`;
const cloudinaryUploadMarker = '/image/upload/';
const shareImageTransform = 'c_fill,w_1200,h_630,g_auto,f_jpg,q_auto';

export function getShareImageUrl(imageUrl: unknown) {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return fallbackShareImage;

  try {
    const url = new URL(imageUrl, siteOrigin);
    if (!['http:', 'https:'].includes(url.protocol)) return fallbackShareImage;

    if (url.hostname === 'res.cloudinary.com' && url.pathname.includes(cloudinaryUploadMarker)) {
      const [prefix, suffix] = url.pathname.split(cloudinaryUploadMarker);
      const pathWithoutLeadingSlash = suffix.replace(/^\/+/, '');
      const alreadyHasTransform = !pathWithoutLeadingSlash.startsWith('v') && !pathWithoutLeadingSlash.startsWith('upload/');
      if (!alreadyHasTransform) {
        url.pathname = `${prefix}${cloudinaryUploadMarker}${shareImageTransform}/${pathWithoutLeadingSlash}`;
      }
    }

    return url.toString();
  } catch {
    return fallbackShareImage;
  }
}
