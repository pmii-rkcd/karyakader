'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { calculateRentalCost, formatRentalPrice, type InventoryItem } from '@/lib/inventory';
import { inventoryWhatsappFallback, normalizeWhatsappNumber } from '@/lib/inventory-settings';
import { MAX_RENTAL_FILE_SIZE } from '@/lib/rental-files';
import { createDynamicQrisPayload } from '@/lib/qris';

function RentalForm({ item, close }: { item: InventoryItem; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const requestId = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adminWhatsapp, setAdminWhatsapp] = useState(inventoryWhatsappFallback());
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [qrisPayload, setQrisPayload] = useState('');
  const [dynamicQrisImage, setDynamicQrisImage] = useState('');
  const availableQuantity = typeof item.availableQuantity === 'number' ? item.availableQuantity : item.quantity;
  const cost = calculateRentalCost({ startDate, endDate, quantity, price: item.price, unit: item.unit });

  useEffect(() => {
    const element = dialog.current;
    const controller = new AbortController();
    requestId.current = crypto.randomUUID();
    element?.showModal();
    fetch('/api/inventory/settings', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (response.ok && typeof result.settings?.whatsappNumber === 'string') setAdminWhatsapp(normalizeWhatsappNumber(result.settings.whatsappNumber));
        if (response.ok && typeof result.settings?.qrisImageUrl === 'string') setQrisImageUrl(result.settings.qrisImageUrl);
        if (response.ok && typeof result.settings?.qrisPayload === 'string') setQrisPayload(result.settings.qrisPayload);
      })
      .catch(() => undefined);
    return () => {
      controller.abort();
      element?.close();
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    if (!qrisPayload || !cost?.total) {
      setDynamicQrisImage('');
      return;
    }
    try {
      const dynamicPayload = createDynamicQrisPayload(qrisPayload, cost.total);
      QRCode.toDataURL(dynamicPayload, { errorCorrectionLevel: 'M', margin: 2, width: 360, color: { dark: '#000000', light: '#ffffff' } })
        .then(image => { if (!canceled) setDynamicQrisImage(image); })
        .catch(() => { if (!canceled) setDynamicQrisImage(''); });
    } catch {
      setDynamicQrisImage('');
    }
    return () => { canceled = true; };
  }, [cost?.total, qrisPayload]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || success) return;
    const data = new FormData(event.currentTarget);
    setError('');
    if (!cost || quantity > availableQuantity) {
      setError('Tanggal sewa dan jumlah barang wajib diisi dengan benar.');
      return;
    }
    for (const key of ['letter', 'payment']) {
      const file = data.get(key);
      if (!(file instanceof File) || !file.size || file.size > MAX_RENTAL_FILE_SIZE) {
        setError('Unggah kedua berkas, maksimal 400 KB per berkas.');
        return;
      }
    }
    data.set('itemId', item.id);
    data.set('requestId', requestId.current);
    pending.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/inventory/requests', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Pengajuan gagal dikirim.');
      setSuccess(result.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Pengajuan belum terkirim. Silakan coba lagi.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const input = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';
  const durationLabel = cost ? item.unit === 'hari' ? `${cost.days} hari` : item.unit === 'minggu' ? `${cost.billedUnits} minggu` : '1 acara' : '';
  const whatsappMessage = success ? [
    'Assalamualaikum admin, saya sudah mengirim pengajuan peminjaman inventaris.',
    '',
    `Barang: ${item.name}`,
    `Tanggal: ${startDate} sampai ${endDate}`,
    `Jumlah: ${quantity} barang`,
    `Total biaya: ${cost ? formatRentalPrice(cost.total) : '-'}`,
    `Nomor pengajuan: ${success}`,
    '',
    'Mohon dicek dan dikonfirmasi. Terima kasih.',
  ].join('\n') : '';

  return <dialog ref={dialog} aria-label={`Peminjaman ${item.name}`} onCancel={event => { if (pending.current) event.preventDefault(); else close(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 backdrop:bg-black/60 dark:bg-gray-900 dark:text-gray-100">
    <div className="flex justify-between gap-3"><h2 className="text-xl font-bold">Peminjaman {item.name}</h2><button type="button" disabled={busy} onClick={close} aria-label="Tutup formulir" className="p-2 text-xl leading-none">x</button></div>
    {success ? <div role="status" className="mt-5 space-y-3"><p className="font-semibold text-green-600">Pengajuan berhasil dikirim.</p><p className="text-sm">Menunggu verifikasi surat, bukti pembayaran, dan persetujuan pengurus. Pengajuan belum merupakan persetujuan peminjaman.</p><p className="break-all text-xs">Nomor pengajuan: {success}</p><a href={`https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer" className="block rounded-lg bg-green-600 p-3 text-center font-bold text-white">Hubungi Admin via WhatsApp</a><button onClick={close} type="button" className="rounded-lg bg-yellow-500 p-3 font-bold text-gray-900">Selesai</button></div> : <form onSubmit={submit} className="mt-4">
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Konfirmasikan nominal dan tujuan pembayaran dengan pengurus terlebih dahulu. Dokumen hanya dapat diakses admin.</p>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm">Nama peminjam<input name="borrowerName" autoComplete="name" required maxLength={150} className={input} /></label>
        <label className="block text-sm">Nomor HP<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={8} maxLength={30} placeholder="Contoh: 081234567890" className={input} /></label>
        <label className="block text-sm">Asal instansi<input name="institution" autoComplete="organization" required maxLength={200} className={input} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Tanggal mulai<input name="startDate" type="date" required value={startDate} onChange={event => setStartDate(event.target.value)} className={input} /></label>
          <label className="block text-sm">Tanggal selesai<input name="endDate" type="date" required value={endDate} onChange={event => setEndDate(event.target.value)} className={input} /></label>
        </div>
        <label className="block text-sm">Jumlah barang<input name="quantity" type="number" required min={1} max={availableQuantity} value={quantity} onChange={event => setQuantity(Number(event.target.value))} className={input} /></label>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-gray-900">
          <p className="font-semibold">Total biaya: {cost ? formatRentalPrice(cost.total) : '-'}</p>
          <p className="mt-1 text-xs text-gray-600">{formatRentalPrice(item.price)} / {item.unit} x {quantity || 0} barang{durationLabel ? ` x ${durationLabel}` : ''}</p>
        </div>
        <label className="block text-sm">Surat peminjaman<input name="letter" type="file" accept="application/pdf,image/jpeg,image/png" required className={input} /></label>
        <label className="block text-sm">Bukti pembayaran<input name="payment" type="file" accept="application/pdf,image/jpeg,image/png" required className={input} /></label>
        {(dynamicQrisImage || qrisImageUrl) && <div className="rounded-xl border border-yellow-300 bg-white p-3 text-gray-900">
          <p className="mb-2 text-sm font-semibold">QRIS pembayaran</p>
          <img src={dynamicQrisImage || qrisImageUrl} alt="QRIS pembayaran inventaris" className="mx-auto max-h-72 w-full max-w-xs rounded-lg object-contain" />
          {dynamicQrisImage ? <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-sm font-semibold text-gray-900">QRIS otomatis sesuai nominal: {cost ? formatRentalPrice(cost.total) : '-'}</p> : null}
          <p className="mt-2 text-xs text-gray-600">{dynamicQrisImage ? 'Silakan scan QRIS ini sesuai nominal otomatis, lalu unggah bukti pembayaran pada kolom di atas.' : 'Silakan scan QRIS ini, lalu unggah bukti pembayaran pada kolom di atas.'}</p>
        </div>}
        <p className="text-xs text-gray-500 dark:text-gray-400">Format PDF, JPG, atau PNG. Maksimal 400 KB per berkas.</p>
        <button type="submit" className="w-full rounded-lg bg-yellow-500 p-3 font-bold text-gray-900">{busy ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
      </fieldset>
    </form>}
  </dialog>;
}

export default function RentalRequestButton({ item }: { item: InventoryItem }) {
  const [open, setOpen] = useState(false);
  const availableQuantity = typeof item.availableQuantity === 'number' ? item.availableQuantity : item.quantity;
  const available = item.status === 'Tersedia' && availableQuantity > 0;
  return <><button type="button" disabled={!available} onClick={() => setOpen(true)} aria-haspopup="dialog" className="mt-4 w-full rounded-lg bg-yellow-500 p-3 text-sm font-bold text-gray-900 hover:bg-yellow-400 disabled:opacity-50">{available ? 'Ajukan Peminjaman' : 'Belum tersedia'}</button>{open && <RentalForm item={item} close={() => setOpen(false)} />}</>;
}
