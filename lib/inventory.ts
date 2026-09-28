export const rentalUnits = ['hari', 'acara', 'minggu'] as const;
export const inventoryStatuses = ['Tersedia', 'Sedang disewa', 'Perawatan'] as const;
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: typeof rentalUnits[number];
  quantity: number;
  status: typeof inventoryStatuses[number];
  imageUrl: string;
  rentedQuantity?: number;
  availableQuantity?: number;
}

export interface RentalCostInput {
  startDate: string;
  endDate: string;
  quantity: number;
  price: number;
  unit: typeof rentalUnits[number];
}

export interface RentalCost {
  days: number;
  billedUnits: number;
  total: number;
}

export function validateInventory(item: Omit<InventoryItem, 'id'>): string | null {
  if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 150) return 'Nama barang wajib diisi, maksimal 150 karakter.';
  if (typeof item.description !== 'string' || item.description.length > 3000) return 'Deskripsi maksimal 3000 karakter.';
  if (typeof item.imageUrl !== 'string') return 'URL foto tidak valid.';
  if (item.imageUrl) {
    try {
      const url = new URL(item.imageUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.username || url.password) return 'Foto harus berasal dari Cloudinary.';
    } catch { return 'URL foto tidak valid.'; }
  }
  if (!Number.isSafeInteger(item.price) || item.price < 0) return 'Tarif sewa harus berupa rupiah bulat, minimal 0.';
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) return 'Jumlah barang harus berupa angka bulat, minimal 1.';
  if (!rentalUnits.includes(item.unit)) return 'Satuan sewa tidak valid.';
  if (!inventoryStatuses.includes(item.status)) return 'Status barang tidak valid.';
  return null;
}

export function formatRentalPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
}

export function parseRentalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function calculateRentalCost(input: RentalCostInput): RentalCost | null {
  const start = parseRentalDate(input.startDate);
  const end = parseRentalDate(input.endDate);
  if (!start || !end || !Number.isSafeInteger(input.quantity) || input.quantity < 1 || !Number.isSafeInteger(input.price) || input.price < 0 || !rentalUnits.includes(input.unit)) return null;
  const differenceDays = Math.floor((end.getTime() - start.getTime()) / 86400000);
  const days = differenceDays === 0 ? 1 : differenceDays;
  if (days < 1 || days > 366) return null;
  const billedUnits = input.unit === 'minggu' ? Math.ceil(days / 7) : 1;
  const total = input.price * input.quantity * (input.unit === 'hari' ? days : billedUnits);
  if (!Number.isSafeInteger(total)) return null;
  return { days, billedUnits: input.unit === 'hari' ? days : billedUnits, total };
}

export function rentalDatesOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string): boolean {
  return Boolean(parseRentalDate(firstStart) && parseRentalDate(firstEnd) && parseRentalDate(secondStart) && parseRentalDate(secondEnd) && firstStart <= secondEnd && secondStart <= firstEnd);
}

export function maxReservedQuantityForRange(bookings: Array<{ startDate: string; endDate: string; quantity: number }>, startDate: string, endDate: string): number {
  if (!parseRentalDate(startDate) || !parseRentalDate(endDate)) return Number.POSITIVE_INFINITY;

  let current = 0;
  const events: Array<{ date: string; delta: number }> = [];
  for (const booking of bookings) {
    if (!Number.isSafeInteger(booking.quantity) || booking.quantity < 1 || !rentalDatesOverlap(booking.startDate, booking.endDate, startDate, endDate)) continue;

    if (booking.startDate <= startDate && startDate <= booking.endDate) {
      current += booking.quantity;
    } else if (booking.startDate > startDate) {
      events.push({ date: booking.startDate, delta: booking.quantity });
    }

    const end = parseRentalDate(booking.endDate);
    if (!end) continue;
    const release = new Date(end.getTime() + 86400000).toISOString().slice(0, 10);
    if (release > startDate) events.push({ date: release, delta: -booking.quantity });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.delta - b.delta);
  let maximum = current;
  for (const event of events) {
    if (event.date > endDate) break;
    current += event.delta;
    if (current > maximum) maximum = current;
  }
  return maximum;
}
