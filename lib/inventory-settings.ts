export const defaultInventoryWhatsapp = '6285124161927';

export interface InventorySettings {
  whatsappNumber: string;
  qrisImageUrl?: string;
  qrisPayload?: string;
  inventoryOfficerName?: string;
  stampImageUrl?: string;
  signatureImageUrl?: string;
}

export function normalizeWhatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

export function validateWhatsappNumber(value: string): string | null {
  const normalized = normalizeWhatsappNumber(value);
  if (!/^62\d{8,15}$/.test(normalized)) return 'Nomor WhatsApp wajib berformat Indonesia. Contoh: 085124161927 atau +62 851-2416-1927.';
  return null;
}

export function inventoryWhatsappFallback(): string {
  return normalizeWhatsappNumber(process.env.NEXT_PUBLIC_INVENTORY_ADMIN_WHATSAPP || process.env.NEXT_PUBLIC_SITE_PHONE || defaultInventoryWhatsapp) || defaultInventoryWhatsapp;
}

export function validateCloudinaryImageUrl(value: string, label = 'Gambar'): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.username || url.password) return `${label} harus berasal dari Cloudinary.`;
    return null;
  } catch {
    return `URL ${label.toLowerCase()} tidak valid.`;
  }
}

export function validateQrisImageUrl(value: string): string | null {
  return validateCloudinaryImageUrl(value, 'Gambar QRIS');
}

export function validateInventoryOfficerName(value: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Nama pengurus inventaris wajib diisi.';
  if (value.length > 120) return 'Nama pengurus inventaris maksimal 120 karakter.';
  return null;
}
