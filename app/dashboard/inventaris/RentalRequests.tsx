'use client';
import { useCallback, useEffect, useState } from 'react';
import { formatRentalPrice } from '@/lib/inventory';
import { auth } from '@/lib/firebase';

interface RentalRequest {
  id: string;
  borrowerName: string;
  phone?: string;
  institution: string;
  itemName: string;
  createdAt: string | null;
  status: string;
  startDate?: string;
  endDate?: string;
  quantity?: number;
  days?: number;
  billedUnits?: number;
  totalCost?: number;
  price?: number;
  unit?: string;
}

const REQUEST_TIMEOUT_MS = 15000;
const TOKEN_TIMEOUT_MS = 1500;

async function authHeaders(): Promise<Record<string, string>> {
  if (!auth.currentUser) return {};
  try {
    const token = await Promise.race([
      auth.currentUser.getIdToken(),
      new Promise<string>(resolve => setTimeout(() => resolve(''), TOKEN_TIMEOUT_MS)),
    ]);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { credentials: 'same-origin', ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Server terlalu lama merespons. Coba klik Muat ulang atau restart npm run dev.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function RentalRequests() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [actingId, setActingId] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchWithTimeout('/api/inventory/requests', { headers: await authHeaders(), cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Pengajuan gagal dimuat.');
      setRequests(data.requests);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Pengajuan gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function download(id: string, kind: string) {
    setDownloading(true);
    setError('');
    try {
      const response = await fetchWithTimeout(`/api/inventory/requests/${id}/files/${kind}`, { headers: await authHeaders() });
      if (!response.ok) throw new Error('Berkas gagal diunduh. Periksa sesi admin Anda.');
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || kind;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Berkas gagal diunduh.');
    } finally {
      setDownloading(false);
    }
  }

  async function openReceipt(id: string) {
    setError('');
    try {
      const headers = await authHeaders();
      const response = await fetchWithTimeout(`/api/inventory/requests/${id}/receipt`, { headers });
      if (!response.ok) throw new Error('Kuitansi gagal dibuat. Pastikan pengajuan sudah disetujui.');
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Kuitansi gagal dibuat.');
    }
  }

  async function decide(id: string, action: 'approve' | 'reject' | 'cancel') {
    if (action === 'cancel' && !window.confirm('Batalkan pinjaman ini agar barang kembali tersedia?')) return;
    setActingId(id);
    setError('');
    try {
      const response = await fetchWithTimeout('/api/inventory/requests', {
        method: 'PATCH',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Status pengajuan gagal diperbarui.');
      const nextStatus = action === 'approve' ? 'Disetujui' : action === 'reject' ? 'Ditolak' : 'Dibatalkan';
      setRequests(previous => previous.map(item => item.id === id ? { ...item, status: nextStatus } : item));
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Status pengajuan gagal diperbarui.');
    } finally {
      setActingId('');
    }
  }

  async function removeRequest(id: string) {
    if (!window.confirm('Hapus pengajuan ini dari daftar? Dokumen dan riwayat pengajuan akan ikut terhapus.')) return;
    setActingId(id);
    setError('');
    try {
      const response = await fetchWithTimeout('/api/inventory/requests', {
        method: 'DELETE',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Pengajuan gagal dihapus.');
      setRequests(previous => previous.filter(item => item.id !== id));
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Pengajuan gagal dihapus.');
    } finally {
      setActingId('');
    }
  }

  return <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" aria-labelledby="rental-requests">
    <div className="flex flex-wrap justify-between gap-3"><h2 id="rental-requests" className="text-lg font-bold">Pengajuan Peminjaman</h2><button type="button" disabled={loading} onClick={refresh} className="rounded border p-2 text-sm">Muat ulang</button></div>
    <p className="mt-2 text-xs text-gray-500">100 pengajuan terbaru. Periksa dokumen, jadwal, jumlah barang, dan bukti pembayaran sebelum memberi persetujuan.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {loading ? <p role="status" className="py-5 text-sm">Memuat pengajuan...</p> : !requests.length && !error ? <p className="py-5 text-sm text-gray-500">Belum ada pengajuan peminjaman.</p> : <ul className="mt-4 divide-y">{requests.map(item => {
      const hasSchedule = Boolean(item.startDate && item.endDate && item.quantity && item.totalCost !== undefined);
      const pending = item.status === 'Menunggu verifikasi';
      const approved = item.status === 'Disetujui' && actingId !== item.id;
      const receiptAvailable = (item.status === 'Disetujui' || item.status === 'Dibatalkan') && hasSchedule;
      return <li key={item.id} className="space-y-2 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{item.itemName} - {item.borrowerName}</h3>
            <p className="text-sm text-gray-600">{item.institution}</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{item.status}</span>
        </div>
        <p className="text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : ''}</p>
        <p className="text-sm text-gray-600">Nomor HP: {item.phone ? <a href={`tel:${item.phone}`} className="text-blue-700 underline">{item.phone}</a> : 'Belum dicantumkan'}</p>
        {hasSchedule ? <div className="grid gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 sm:grid-cols-2">
          <p>Tanggal: {item.startDate} sampai {item.endDate}</p>
          <p>Jumlah: {item.quantity} barang</p>
          <p>Durasi: {item.unit === 'hari' ? `${item.days} hari` : item.unit === 'minggu' ? `${item.billedUnits} minggu` : '1 acara'}</p>
          <p className="font-semibold">Total: {formatRentalPrice(item.totalCost || 0)}</p>
        </div> : <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">Pengajuan lama ini belum memiliki tanggal sewa dan jumlah barang, jadi hanya bisa ditolak atau diminta mengajukan ulang.</p>}
        <p className="break-all text-xs text-gray-500">Nomor: {item.id}</p>
        <div className="flex flex-wrap gap-2"><button disabled={downloading} type="button" onClick={() => download(item.id, 'letter')} className="rounded bg-blue-50 p-2 text-sm text-blue-700">Unduh surat peminjaman</button><button disabled={downloading} type="button" onClick={() => download(item.id, 'payment')} className="rounded bg-green-50 p-2 text-sm text-green-700">Unduh bukti pembayaran</button>{receiptAvailable && <button type="button" onClick={() => openReceipt(item.id)} className="rounded bg-yellow-50 p-2 text-sm font-semibold text-yellow-800">Cetak kuitansi</button>}<button disabled={actingId === item.id} type="button" onClick={() => removeRequest(item.id)} className="rounded bg-red-50 p-2 text-sm font-semibold text-red-700 disabled:opacity-50">{actingId === item.id ? 'Memproses...' : 'Hapus pengajuan'}</button></div>
        {pending && <div className="flex flex-wrap gap-2 pt-1"><button disabled={actingId === item.id || !hasSchedule} type="button" onClick={() => decide(item.id, 'approve')} className="rounded bg-green-600 p-2 text-sm font-semibold text-white disabled:opacity-50">{actingId === item.id ? 'Memproses...' : 'Setujui'}</button><button disabled={actingId === item.id} type="button" onClick={() => decide(item.id, 'reject')} className="rounded bg-red-50 p-2 text-sm font-semibold text-red-700 disabled:opacity-50">Tolak</button></div>}
        {approved && <div className="flex flex-wrap gap-2 pt-1"><button disabled={actingId === item.id} type="button" onClick={() => decide(item.id, 'cancel')} className="rounded bg-red-600 p-2 text-sm font-semibold text-white disabled:opacity-50">{actingId === item.id ? 'Memproses...' : 'Batalkan pinjaman'}</button></div>}
      </li>;
    })}</ul>}
  </section>;
}
