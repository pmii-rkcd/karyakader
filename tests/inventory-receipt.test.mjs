import test from 'node:test';
import assert from 'node:assert/strict';
import { renderInventoryReceiptHtml } from '../lib/inventory-receipt.ts';
import { borrowerWhatsappNumber, createInventoryReceiptPdf } from '../lib/inventory-receipt-pdf.ts';

test('inventory receipt renders approved rental details without embedded files', () => {
  const html = renderInventoryReceiptHtml('request-1', {
    status: 'Disetujui',
    itemName: 'Sound',
    borrowerName: 'Alpin',
    phone: '081234567890',
    institution: 'PGMI',
    startDate: '2026-09-26',
    endDate: '2026-09-27',
    quantity: 1,
    price: 45,
    unit: 'hari',
    days: 2,
    totalCost: 90,
    inventoryOfficerName: 'Moh. Alfiyan Efendi',
    stampImageUrl: 'https://res.cloudinary.com/demo/image/upload/stempel.png',
    files: { payment: { bytes: Buffer.from('secret') } },
  });

  assert.match(html, /Kuitansi/);
  assert.match(html, /Sound/);
  assert.match(html, /Alpin/);
  assert.match(html, /1 hari/);
  assert.match(html, /Rp\s?45/);
  assert.match(html, /Moh\. Alfiyan Efendi/);
  assert.match(html, /stempel\.png/);
  assert.doesNotMatch(html, /wa\.me/);
  assert.match(html, /Kirim PDF ke WhatsApp/);
  assert.match(html, /receipt\/whatsapp/);
  assert.equal(html.includes('secret'), false);
});

test('inventory receipt can render canceled approved rental history', () => {
  const html = renderInventoryReceiptHtml('request-2', {
    status: 'Dibatalkan',
    itemName: 'Sound',
    borrowerName: 'Faza',
    phone: '081234567890',
    institution: 'PGMI',
    startDate: '2026-09-26',
    endDate: '2026-09-27',
    quantity: 1,
    price: 45000,
    unit: 'hari',
    days: 2,
    totalCost: 90000,
  });

  assert.match(html, /Kuitansi/);
  assert.match(html, /Faza/);
  assert.match(html, /1 hari/);
  assert.match(html, /Rp\s?45.000/);
  assert.match(html, /stempel-chondro\.png/);
  assert.match(html, /Moh\. Alfiyan Efendi/);
});

test('inventory receipt PDF can be generated for WhatsApp document sending', () => {
  const data = {
    status: 'Disetujui',
    itemName: 'Sound',
    borrowerName: 'Alpin',
    phone: '081234567890',
    institution: 'PGMI',
    startDate: '2026-09-26',
    endDate: '2026-09-27',
    quantity: 1,
    price: 45000,
    unit: 'hari',
    days: 1,
    totalCost: 45000,
  };
  const pdf = createInventoryReceiptPdf('request-3', data);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.equal(borrowerWhatsappNumber(data), '6281234567890');
});
