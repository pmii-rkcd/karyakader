import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRentalCost, maxReservedQuantityForRange, rentalDatesOverlap, validateInventory } from '../lib/inventory.ts';
import { normalizeWhatsappNumber, validateQrisImageUrl, validateWhatsappNumber } from '../lib/inventory-settings.ts';
import { createDynamicQrisPayload, validateQrisPayload } from '../lib/qris.ts';

const valid = { name: 'Proyektor', description: '', price: 50000, unit: 'hari', quantity: 2, status: 'Tersedia', imageUrl: '' };

test('inventory accepts valid items and rejects invalid prices, quantities and selections', () => {
  assert.equal(validateInventory(valid), null);
  assert.equal(validateInventory({ ...valid, price: 0 }), null);
  for (const patch of [{ name: '  ' }, { price: -1 }, { price: NaN }, { price: 0.5 }, { quantity: 0 }, { quantity: 1.5 }, { quantity: Infinity }, { unit: 'invalid' }, { status: 'invalid' }]) {
    assert.equal(typeof validateInventory({ ...valid, ...patch }), 'string');
  }
});

test('server validation rejects missing fields and unsafe photo URLs', () => {
  for (const patch of [{ name: null }, { name: 42 }, { description: null }, { description: 'x'.repeat(3001) }, { imageUrl: null }, { imageUrl: 'javascript:alert(1)' }, { imageUrl: 'https://example.com/photo.png' }, { imageUrl: 'https://res.cloudinary.com.evil.example/photo.png' }]) {
    assert.equal(typeof validateInventory({ ...valid, ...patch }), 'string');
  }
  assert.equal(validateInventory({ ...valid, imageUrl: 'https://res.cloudinary.com/demo/image/upload/photo.png' }), null);
});

test('rental cost counts return-next-day as one day and keeps a one-day minimum', () => {
  assert.deepEqual(calculateRentalCost({ startDate: '2026-09-26', endDate: '2026-09-26', quantity: 1, price: 50000, unit: 'hari' }), { days: 1, billedUnits: 1, total: 50000 });
  assert.deepEqual(calculateRentalCost({ startDate: '2026-09-26', endDate: '2026-09-27', quantity: 1, price: 50000, unit: 'hari' }), { days: 1, billedUnits: 1, total: 50000 });
  assert.deepEqual(calculateRentalCost({ startDate: '2026-09-26', endDate: '2026-09-28', quantity: 2, price: 50000, unit: 'hari' }), { days: 2, billedUnits: 2, total: 200000 });
  assert.deepEqual(calculateRentalCost({ startDate: '2026-09-26', endDate: '2026-10-03', quantity: 1, price: 120000, unit: 'minggu' }), { days: 7, billedUnits: 1, total: 120000 });
  assert.deepEqual(calculateRentalCost({ startDate: '2026-09-26', endDate: '2026-10-03', quantity: 3, price: 75000, unit: 'acara' }), { days: 7, billedUnits: 1, total: 225000 });
  for (const patch of [{ startDate: '2026-09-29' }, { endDate: '2026-02-30' }, { quantity: 0 }, { price: -1 }, { unit: 'jam' }]) {
    assert.equal(calculateRentalCost({ startDate: '2026-09-26', endDate: '2026-09-28', quantity: 1, price: 50000, unit: 'hari', ...patch }), null);
  }
});

test('overlap capacity counts only bookings active on the same date', () => {
  assert.equal(rentalDatesOverlap('2026-09-26', '2026-09-27', '2026-09-27', '2026-09-28'), true);
  assert.equal(rentalDatesOverlap('2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29'), false);
  const bookings = [
    { startDate: '2026-09-26', endDate: '2026-09-27', quantity: 1 },
    { startDate: '2026-09-28', endDate: '2026-09-29', quantity: 1 },
    { startDate: '2026-09-27', endDate: '2026-09-28', quantity: 2 },
  ];
  assert.equal(maxReservedQuantityForRange(bookings, '2026-09-26', '2026-09-29'), 3);
  assert.equal(maxReservedQuantityForRange(bookings.slice(0, 2), '2026-09-26', '2026-09-29'), 1);
  assert.equal(maxReservedQuantityForRange([{ startDate: '2026-09-27', endDate: '2026-11-07', quantity: 1 }], '2026-09-29', '2026-09-29'), 1);
});

test('inventory WhatsApp settings accept Indonesian phone number formats', () => {
  assert.equal(normalizeWhatsappNumber('+62 851-2416-1927'), '6285124161927');
  assert.equal(normalizeWhatsappNumber('085124161927'), '6285124161927');
  assert.equal(validateWhatsappNumber('6285124161927'), null);
  assert.equal(typeof validateWhatsappNumber('12345'), 'string');
  assert.equal(validateQrisImageUrl(''), null);
  assert.equal(validateQrisImageUrl('https://res.cloudinary.com/demo/image/upload/qris.png'), null);
  assert.equal(typeof validateQrisImageUrl('https://example.com/qris.png'), 'string');
});

test('dynamic QRIS keeps merchant payload and injects requested amount', () => {
  const tlv = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`;
  const merchantAccount = `${tlv('00', 'COM.GO-JEK.WWW')}${tlv('01', '936009143123456789')}${tlv('02', 'G123456789')}${tlv('03', 'UMI')}`;
  const staticPayload = [
    tlv('00', '01'),
    tlv('01', '11'),
    tlv('26', merchantAccount),
    tlv('52', '5812'),
    tlv('53', '360'),
    tlv('58', 'ID'),
    tlv('59', 'KARYA KADER'),
    tlv('60', 'MALANG'),
    tlv('61', '65149'),
    tlv('63', 'B6F4'),
  ].join('');
  assert.equal(validateQrisPayload(staticPayload), null);
  const dynamicPayload = createDynamicQrisPayload(staticPayload, 45000);
  assert.match(dynamicPayload, /010212/);
  assert.match(dynamicPayload, /540545000/);
  assert.match(dynamicPayload, /6304[0-9A-F]{4}$/);
  assert.equal(dynamicPayload.includes('KARYAKADER') || dynamicPayload.includes('KARYA KADER'), true);
});
