function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function number(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, ' ');
}

function escapePdf(value: string) {
  return value.replace(/[\\()]/g, character => `\\${character}`).replace(/[^\x20-\x7E]/g, ' ');
}

function normalizeWhatsappNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

function receiptLines(id: string, data: Record<string, unknown>) {
  const unit = text(data.unit);
  const days = number(data.days);
  const billedUnits = number(data.billedUnits);
  const duration = unit === 'hari' ? `${days} hari` : unit === 'minggu' ? `${billedUnits} minggu` : '1 acara';
  return [
    ['Nomor', id],
    ['Nama Peminjam', text(data.borrowerName)],
    ['Asal Instansi', text(data.institution)],
    ['Nomor HP', text(data.phone) || '-'],
    ['Barang', text(data.itemName)],
    ['Tanggal Sewa', `${text(data.startDate)} sampai ${text(data.endDate)}`],
    ['Durasi', duration],
    ['Jumlah Barang', `${number(data.quantity)} barang`],
    ['Tarif', `${rupiah(number(data.price))} / ${unit}`],
    ['Status', text(data.status)],
    ['Total Pembayaran', rupiah(number(data.totalCost))],
  ];
}

export function createInventoryReceiptPdf(id: string, data: Record<string, unknown>) {
  const officerName = text(data.inventoryOfficerName) || 'Moh. Alfiyan Efendi';
  const lines = receiptLines(id, data);
  const commands = [
    'BT',
    '/F1 22 Tf',
    '72 760 Td',
    '(KARYA KADER) Tj',
    '/F1 11 Tf',
    '0 -20 Td',
    '(PR. PMII "KAWAH" Chondrodimuko) Tj',
    '0 -15 Td',
    '(Inventaris dan Penyewaan Perlengkapan) Tj',
    '/F1 28 Tf',
    '335 35 Td',
    '(KUITANSI) Tj',
    '/F1 12 Tf',
    '-335 -70 Td',
  ];
  for (const [label, value] of lines) {
    commands.push(`(${escapePdf(label.padEnd(18))}: ${escapePdf(value)}) Tj`, '0 -20 Td');
  }
  commands.push(
    '0 -25 Td',
    '(Pengurus Inventaris) Tj',
    '0 -72 Td',
    `(${escapePdf(officerName)}) Tj`,
    '300 72 Td',
    '(Peminjam) Tj',
    '0 -72 Td',
    `(${escapePdf(text(data.borrowerName) || '________________')}) Tj`,
    'ET',
  );
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

export function borrowerWhatsappNumber(data: Record<string, unknown>) {
  return normalizeWhatsappNumber(text(data.phone));
}
