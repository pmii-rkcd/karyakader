'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/upload-image';
import { inventoryWhatsappFallback, normalizeWhatsappNumber, validateCloudinaryImageUrl, validateInventoryOfficerName, validateQrisImageUrl, validateWhatsappNumber } from '@/lib/inventory-settings';
import { validateQrisPayload } from '@/lib/qris';

const inputClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500';

async function readQrisPayloadFromImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Gambar QRIS tidak dapat dibaca.'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Browser tidak dapat membaca gambar QRIS.');
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(data.data, data.width, data.height);
    if (!result?.data) throw new Error('Payload QRIS tidak terbaca dari gambar. Gunakan gambar QRIS yang jelas dan tidak terpotong.');
    const validation = validateQrisPayload(result.data);
    if (validation) throw new Error(validation);
    return result.data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function InventoryContactSettings() {
  const [whatsappNumber, setWhatsappNumber] = useState(inventoryWhatsappFallback());
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [qrisPayload, setQrisPayload] = useState('');
  const [qrisImage, setQrisImage] = useState<File | null>(null);
  const [qrisObjectUrl, setQrisObjectUrl] = useState('');
  const [inventoryOfficerName, setInventoryOfficerName] = useState('Moh. Alfiyan Efendi');
  const [stampImageUrl, setStampImageUrl] = useState('');
  const [stampImage, setStampImage] = useState<File | null>(null);
  const [stampObjectUrl, setStampObjectUrl] = useState('');
  const [signatureImageUrl, setSignatureImageUrl] = useState('');
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signatureObjectUrl, setSignatureObjectUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const qrisInput = useRef<HTMLInputElement>(null);
  const stampInput = useRef<HTMLInputElement>(null);
  const signatureInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/inventory/settings', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Pengaturan gagal dimuat.');
        if (typeof result.settings?.whatsappNumber === 'string') setWhatsappNumber(result.settings.whatsappNumber);
        if (typeof result.settings?.qrisImageUrl === 'string') setQrisImageUrl(result.settings.qrisImageUrl);
        if (typeof result.settings?.qrisPayload === 'string') setQrisPayload(result.settings.qrisPayload);
        if (typeof result.settings?.inventoryOfficerName === 'string') setInventoryOfficerName(result.settings.inventoryOfficerName);
        if (typeof result.settings?.stampImageUrl === 'string') setStampImageUrl(result.settings.stampImageUrl);
        if (typeof result.settings?.signatureImageUrl === 'string') setSignatureImageUrl(result.settings.signatureImageUrl);
        setError('');
      })
      .catch(error => {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Pengaturan gagal dimuat.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!qrisImage) {
      setQrisObjectUrl('');
      return;
    }
    const url = URL.createObjectURL(qrisImage);
    setQrisObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [qrisImage]);

  useEffect(() => {
    if (!stampImage) {
      setStampObjectUrl('');
      return;
    }
    const url = URL.createObjectURL(stampImage);
    setStampObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [stampImage]);

  useEffect(() => {
    if (!signatureImage) {
      setSignatureObjectUrl('');
      return;
    }
    const url = URL.createObjectURL(signatureImage);
    setSignatureObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [signatureImage]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    setError('');
    setMessage('');
    const validation = validateWhatsappNumber(whatsappNumber);
    if (validation) {
      setError(validation);
      return;
    }
    const qrisValidation = validateQrisImageUrl(qrisImageUrl);
    if (qrisValidation) {
      setError(qrisValidation);
      return;
    }
    const payloadValidation = validateQrisPayload(qrisPayload);
    if (payloadValidation) {
      setError(payloadValidation);
      return;
    }
    const officerValidation = validateInventoryOfficerName(inventoryOfficerName);
    if (officerValidation) {
      setError(officerValidation);
      return;
    }
    const stampValidation = validateCloudinaryImageUrl(stampImageUrl, 'Gambar stempel');
    if (stampValidation) {
      setError(stampValidation);
      return;
    }
    const signatureValidation = validateCloudinaryImageUrl(signatureImageUrl, 'Gambar tanda tangan');
    if (signatureValidation) {
      setError(signatureValidation);
      return;
    }
    pending.current = true;
    setSaving(true);
    try {
      const nextQrisImageUrl = qrisImage ? await uploadImageToCloudinary(qrisImage) : qrisImageUrl;
      const nextStampImageUrl = stampImage ? await uploadImageToCloudinary(stampImage) : stampImageUrl;
      const nextSignatureImageUrl = signatureImage ? await uploadImageToCloudinary(signatureImage) : signatureImageUrl;
      const response = await fetch('/api/inventory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber, qrisImageUrl: nextQrisImageUrl, qrisPayload, inventoryOfficerName, stampImageUrl: nextStampImageUrl, signatureImageUrl: nextSignatureImageUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Pengaturan belum tersimpan.');
      setWhatsappNumber(result.settings.whatsappNumber);
      setQrisImageUrl(result.settings.qrisImageUrl || '');
      setQrisPayload(result.settings.qrisPayload || '');
      setInventoryOfficerName(result.settings.inventoryOfficerName || 'Moh. Alfiyan Efendi');
      setStampImageUrl(result.settings.stampImageUrl || '');
      setSignatureImageUrl(result.settings.signatureImageUrl || '');
      setQrisImage(null);
      setStampImage(null);
      setSignatureImage(null);
      if (qrisInput.current) qrisInput.current.value = '';
      if (stampInput.current) stampInput.current.value = '';
      if (signatureInput.current) signatureInput.current.value = '';
      setMessage('Kontak admin, QRIS, dan kuitansi berhasil disimpan.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Pengaturan belum tersimpan.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  async function chooseQrisImage(file: File | null) {
    setQrisImage(file);
    setMessage('');
    setError('');
    if (!file) return;
    try {
      const payload = await readQrisPayloadFromImage(file);
      setQrisPayload(payload);
      setMessage('Payload QRIS berhasil dibaca dari gambar. Klik Simpan Nomor untuk menyimpan.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payload QRIS tidak terbaca dari gambar.');
    }
  }

  const normalized = normalizeWhatsappNumber(whatsappNumber);
  const qrisPreview = qrisObjectUrl || qrisImageUrl;
  const stampPreview = stampObjectUrl || stampImageUrl;
  const signaturePreview = signatureObjectUrl || signatureImageUrl;

  return <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-xl font-bold text-[#0f2136]">Kontak Admin & QRIS</h2>
    <p className="mt-2 text-sm text-gray-500">Nomor WhatsApp dipakai setelah peminjam mengirim pengajuan. Payload QRIS membuat QR pembayaran berubah otomatis mengikuti nominal sewa.</p>
    {loading && <p role="status" className="mt-4 text-sm text-gray-500">Memuat pengaturan...</p>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">{message}</p>}
    <form onSubmit={save} className="mt-5 max-w-xl">
      <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-medium">Nomor WhatsApp tujuan
          <input required value={whatsappNumber} onChange={event => setWhatsappNumber(event.target.value)} placeholder="Contoh: 085124161927" className={inputClass} />
        </label>
        <p className="text-xs text-gray-500">Nomor yang akan dipakai: <span className="font-semibold text-gray-700">{normalized || '-'}</span></p>
        <label className="block text-sm font-medium">Payload QRIS statis
          <textarea rows={5} value={qrisPayload} onChange={event => setQrisPayload(event.target.value)} placeholder="Tempel teks hasil scan QRIS statis di sini" className={inputClass} />
        </label>
        <p className="text-xs leading-5 text-gray-500">Payload bisa terisi otomatis saat upload gambar QRIS. Jika gambar tidak terbaca, tempel teks hasil scan QRIS statis di kolom ini.</p>
        <label className="block text-sm font-medium">Upload QRIS
          <input ref={qrisInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void chooseQrisImage(event.target.files?.[0] || null)} className={inputClass} />
        </label>
        <p className="text-xs text-gray-500">Setelah payload terbaca, sistem akan membuat QRIS baru yang berubah sesuai nominal sewa.</p>
        {qrisPreview && <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">Preview QRIS</p>
          <img src={qrisPreview} alt="QRIS pembayaran inventaris" className="max-h-72 rounded-lg border border-gray-200 bg-white object-contain p-2" />
          <button type="button" onClick={() => { setQrisImage(null); setQrisImageUrl(''); if (qrisInput.current) qrisInput.current.value = ''; }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 className="h-4 w-4" />Hapus QRIS</button>
        </div>}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-bold text-gray-800">Kuitansi</h3>
          <label className="mt-3 block text-sm font-medium">Nama pengurus inventaris
            <input required maxLength={120} value={inventoryOfficerName} onChange={event => setInventoryOfficerName(event.target.value)} className={inputClass} />
          </label>
          <label className="mt-4 block text-sm font-medium">Upload stempel kuitansi
            <input ref={stampInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setStampImage(event.target.files?.[0] || null)} className={inputClass} />
          </label>
          {stampPreview && <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Preview stempel</p>
            <img src={stampPreview} alt="Stempel kuitansi inventaris" className="max-h-40 rounded border border-gray-200 bg-white object-contain p-2" />
            <button type="button" onClick={() => { setStampImage(null); setStampImageUrl(''); if (stampInput.current) stampInput.current.value = ''; }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 className="h-4 w-4" />Hapus stempel</button>
          </div>}
          <label className="mt-4 block text-sm font-medium">Upload tanda tangan
            <input ref={signatureInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setSignatureImage(event.target.files?.[0] || null)} className={inputClass} />
          </label>
          {signaturePreview && <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Preview tanda tangan</p>
            <img src={signaturePreview} alt="Tanda tangan pengurus inventaris" className="max-h-32 rounded border border-gray-200 bg-white object-contain p-2" />
            <button type="button" onClick={() => { setSignatureImage(null); setSignatureImageUrl(''); if (signatureInput.current) signatureInput.current.value = ''; }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 className="h-4 w-4" />Hapus tanda tangan</button>
          </div>}
        </div>
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 text-sm font-bold text-[#0f2136] hover:bg-yellow-400">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Nomor'}
        </button>
      </fieldset>
    </form>
  </section>;
}
