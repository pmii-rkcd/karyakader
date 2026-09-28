function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function number(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}

function parseRentalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function calculateReceiptCost(startDate: string, endDate: string, quantity: number, price: number, unit: string) {
  const start = parseRentalDate(startDate);
  const end = parseRentalDate(endDate);
  if (!start || !end || !Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(price) || price < 0 || !['hari', 'minggu', 'acara'].includes(unit)) return null;
  const differenceDays = Math.floor((end.getTime() - start.getTime()) / 86400000);
  const days = differenceDays === 0 ? 1 : differenceDays;
  if (days < 1 || days > 366) return null;
  const billedUnits = unit === 'minggu' ? Math.ceil(days / 7) : 1;
  const total = price * quantity * (unit === 'hari' ? days : billedUnits);
  return Number.isSafeInteger(total) ? { days, billedUnits: unit === 'hari' ? days : billedUnits, total } : null;
}

function row(label: string, value: string) {
  return `<tr><td>${escapeHtml(label)}</td><td>:</td><td>${escapeHtml(value)}</td></tr>`;
}

function defaultSignatureSvgDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="170" viewBox="0 0 520 170">
  <path d="M18 104 C70 99 124 94 180 101 C214 104 224 68 229 32 C232 11 247 48 267 78 C282 101 301 123 326 126 C347 128 349 67 354 75 C363 90 361 139 370 139 C383 139 381 65 389 76 C402 96 397 152 407 151 C421 150 421 84 430 91 C451 108 469 125 502 143" fill="none" stroke="#151129" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 108 C102 118 175 113 238 104 C285 97 337 96 424 104" fill="none" stroke="#151129" stroke-width="4" stroke-linecap="round"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function renderInventoryReceiptHtml(id: string, data: Record<string, unknown>) {
  const itemName = text(data.itemName);
  const borrowerName = text(data.borrowerName);
  const institution = text(data.institution);
  const phone = text(data.phone);
  const startDate = text(data.startDate);
  const endDate = text(data.endDate);
  const quantity = number(data.quantity);
  const unit = text(data.unit);
  const price = number(data.price);
  const recalculated = calculateReceiptCost(startDate, endDate, quantity, price, unit);
  const days = recalculated?.days || number(data.days);
  const billedUnits = recalculated?.billedUnits || number(data.billedUnits);
  const totalCost = recalculated?.total || number(data.totalCost);
  const duration = unit === 'hari' ? `${days} hari` : unit === 'minggu' ? `${billedUnits} minggu` : '1 acara';
  const inventoryOfficerName = text(data.inventoryOfficerName) || 'Moh. Alfiyan Efendi';
  const stampImageUrl = text(data.stampImageUrl);
  const signatureImageUrl = text(data.signatureImageUrl);
  const stamp = `<img src="${escapeHtml(stampImageUrl || '/stempel-chondro.png')}" alt="Stempel Pengurus Rayon" class="stamp">`;
  const signature = `<img src="${escapeHtml(signatureImageUrl || defaultSignatureSvgDataUri())}" alt="Tanda tangan pengurus inventaris" class="signature">`;

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kuitansi ${escapeHtml(id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 16px auto; background: white; padding: 24mm 20mm; box-shadow: 0 10px 25px rgba(15, 23, 42, .12); }
    .top { display: flex; justify-content: space-between; gap: 16px; border-bottom: 3px solid #111827; padding-bottom: 16px; }
    h1 { margin: 0; font-size: 28px; letter-spacing: .08em; text-transform: uppercase; }
    .brand { font-weight: 700; font-size: 18px; }
    .muted { color: #4b5563; font-size: 13px; line-height: 1.5; }
    .box { margin-top: 22px; border: 1px solid #d1d5db; border-radius: 12px; padding: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 15px; }
    td { padding: 7px 0; vertical-align: top; }
    td:first-child { width: 160px; font-weight: 700; }
    td:nth-child(2) { width: 18px; }
    .total { margin-top: 18px; padding: 16px; border-radius: 10px; background: #fef3c7; font-weight: 800; font-size: 22px; display: flex; justify-content: space-between; gap: 16px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 54px; text-align: center; }
    .signature-box { min-height: 165px; position: relative; overflow: visible; }
    .stamp { position: absolute; left: 50%; top: 16px; width: 235px; max-height: 118px; object-fit: contain; opacity: .62; transform: translateX(-50%) rotate(-4deg); z-index: 1; }
    .signature { position: absolute; left: 50%; top: 48px; width: 220px; max-height: 78px; object-fit: contain; transform: translateX(-50%) rotate(-2deg); z-index: 2; }
    .line { margin-top: 122px; border-top: 1px solid #111827; padding-top: 8px; font-weight: 700; position: relative; z-index: 3; }
    .actions { margin: 16px auto; width: 210mm; display: flex; justify-content: flex-end; gap: 8px; }
    .action-link, button { border: 0; border-radius: 8px; background: #f6b800; color: #111827; padding: 12px 18px; font-weight: 700; cursor: pointer; text-decoration: none; font-size: 14px; }
    .whatsapp { background: #16a34a; color: white; }
    @media print {
      body { background: white; }
      .page { margin: 0; box-shadow: none; width: auto; min-height: auto; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions"><button class="whatsapp" onclick="sendReceiptPdf(this)">Kirim PDF ke WhatsApp</button><button onclick="window.print()">Cetak / Simpan PDF</button></div>
  <main class="page">
    <section class="top">
      <div>
        <div class="brand">KARYA KADER</div>
        <div class="muted">PR. PMII "KAWAH" Chondrodimuko<br>Inventaris dan Penyewaan Perlengkapan</div>
      </div>
      <div style="text-align:right">
        <h1>Kuitansi</h1>
        <div class="muted">Nomor: ${escapeHtml(id)}<br>Tanggal cetak: ${escapeHtml(new Date().toLocaleDateString('id-ID'))}</div>
      </div>
    </section>
    <section class="box">
      <table>
        ${row('Nama Peminjam', borrowerName)}
        ${row('Asal Instansi', institution)}
        ${row('Nomor HP', phone || '-')}
        ${row('Barang', itemName)}
        ${row('Tanggal Sewa', `${startDate} sampai ${endDate}`)}
        ${row('Durasi', duration)}
        ${row('Jumlah Barang', `${quantity} barang`)}
        ${row('Tarif', `${rupiah(price)} / ${unit}`)}
        ${row('Status', text(data.status))}
      </table>
      <div class="total"><span>Total Pembayaran</span><span>${escapeHtml(rupiah(totalCost))}</span></div>
    </section>
    <section class="signatures">
      <div class="signature-box"><div>Pengurus Inventaris</div>${stamp}${signature}<div class="line">${escapeHtml(inventoryOfficerName)}</div></div>
      <div class="signature-box"><div>Peminjam</div><div class="line">${escapeHtml(borrowerName || '________________________')}</div></div>
    </section>
  </main>
  <script>
    async function sendReceiptPdf(button) {
      if (!confirm('Kirim PDF kuitansi langsung ke WhatsApp peminjam?')) return;
      const previous = button.textContent;
      button.disabled = true;
      button.textContent = 'Mengirim PDF...';
      try {
        const response = await fetch('/api/inventory/requests/${escapeHtml(id)}/receipt/whatsapp', { method: 'POST', credentials: 'same-origin' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'PDF kuitansi gagal dikirim ke WhatsApp.');
        alert('PDF kuitansi berhasil dikirim ke WhatsApp ' + data.to + '.');
      } catch (error) {
        alert(error && error.message ? error.message : 'PDF kuitansi gagal dikirim ke WhatsApp.');
      } finally {
        button.disabled = false;
        button.textContent = previous;
      }
    }
  </script>
</body>
</html>`;
}
