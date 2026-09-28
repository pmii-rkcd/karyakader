'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import RentalRequests from '@/app/dashboard/inventaris/RentalRequests';
import InventoryContactSettings from './InventoryContactSettings';
import { Archive, ClipboardList, Loader2, PackageOpen, Pencil, PhoneCall, Trash2 } from 'lucide-react';
import { changeInventory, loadInventory } from '@/lib/inventory-client';
import { uploadImageToCloudinary } from '@/lib/upload-image';
import { formatRentalPrice, inventoryStatuses, rentalUnits, validateInventory, type InventoryItem } from '@/lib/inventory';

type ItemForm = Omit<InventoryItem, 'id'>;
const emptyForm: ItemForm = { name: '', description: '', price: 0, unit: 'hari', quantity: 1, status: 'Tersedia', imageUrl: '' };
const inputClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500';
const priceMultiplier = 1000;

export default function InventoryAdminPage() {
  const [activeMenu, setActiveMenu] = useState<'requests' | 'items' | 'contact'>('requests');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<ItemForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadInventory(controller.signal).then(data => {
      setItems(data); setLoadError(''); setLoading(false);
    }).catch(error => {
      if (!controller.signal.aborted) { setLoadError(error instanceof Error ? error.message : 'Daftar barang gagal dimuat.'); setLoading(false); }
    });
    return () => controller.abort();
  }, []);

  function reset() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setImage(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    setError(''); setMessage('');
    const data = { ...form, price: form.price * priceMultiplier, name: form.name.trim(), description: form.description.trim() };
    const validation = validateInventory(data);
    if (validation) { setError(validation); return; }
    pending.current = true; setBusy(true);
    try {
      const imageUrl = image ? await uploadImageToCloudinary(image) : form.imageUrl;
      if (image) { setForm(previous => ({ ...previous, imageUrl })); setImage(null); }
      const result = await changeInventory(editingId ? 'PATCH' : 'POST', { ...data, imageUrl, ...(editingId ? { id: editingId } : {}) });
      setItems(previous => [...previous.filter(item => item.id !== result.item.id), result.item].sort((a, b) => a.name.localeCompare(b.name, 'id')));
      setLoadError('');
      setMessage(editingId ? 'Perubahan barang berhasil disimpan.' : 'Barang sewa berhasil ditambahkan.');
      reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Barang belum tersimpan. Silakan coba lagi.');
    } finally { pending.current = false; setBusy(false); }
  }

  function edit(item: InventoryItem) {
    if (pending.current) return;
    setActiveMenu('items');
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description || '', price: Math.floor(item.price / priceMultiplier), quantity: item.quantity, unit: item.unit, status: item.status, imageUrl: item.imageUrl || '' });
    setImage(null); setError(''); setMessage('');
    if (fileInput.current) fileInput.current.value = '';
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function remove(item: InventoryItem) {
    if (pending.current || !window.confirm(`Hapus "${item.name}" dari daftar barang sewa?`)) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      await changeInventory('DELETE', { id: item.id });
      setItems(previous => previous.filter(entry => entry.id !== item.id));
      if (editingId === item.id) reset();
      setMessage('Barang berhasil dihapus.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Barang gagal dihapus.'); }
    finally { pending.current = false; setBusy(false); }
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-yellow-600">Ruang Khusus Liputan</p><h2 className="mt-1 flex items-center gap-3 font-serif text-3xl font-bold text-[#0f2136]"><Archive className="h-7 w-7" />Inventaris</h2><p className="mt-2 text-sm text-gray-500">Kelola barang sewa, pengajuan peminjaman, persetujuan admin, dan dokumen peminjam.</p></div>
      <Link href="/inventaris" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">Lihat halaman publik</Link>
    </header>
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="h-max rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-500">Menu Inventaris</p>
        <nav className="space-y-2">
          <button type="button" onClick={() => setActiveMenu('requests')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${activeMenu === 'requests' ? 'bg-yellow-500 text-[#0f2136]' : 'text-gray-600 hover:bg-gray-50'}`}><ClipboardList className="h-5 w-5" />Peminjaman Masuk</button>
          <button type="button" onClick={() => setActiveMenu('items')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${activeMenu === 'items' ? 'bg-yellow-500 text-[#0f2136]' : 'text-gray-600 hover:bg-gray-50'}`}><PackageOpen className="h-5 w-5" />Barang Inventaris</button>
          <button type="button" onClick={() => setActiveMenu('contact')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${activeMenu === 'contact' ? 'bg-yellow-500 text-[#0f2136]' : 'text-gray-600 hover:bg-gray-50'}`}><PhoneCall className="h-5 w-5" />Kontak Admin</button>
        </nav>
      </aside>
      <div className="space-y-6">
        {activeMenu === 'requests' ? <RentalRequests /> : activeMenu === 'contact' ? <InventoryContactSettings /> : <>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{message}</p>}
          <form ref={formRef} onSubmit={save} className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-bold">{editingId ? 'Edit Barang Sewa' : 'Tambah Barang Sewa'}</h2>
            <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
              <label className="text-sm font-medium">Nama barang<input required maxLength={150} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} /></label>
              <label className="text-sm font-medium">Jumlah barang<input required type="number" min="1" step="1" value={Number.isNaN(form.quantity) ? '' : form.quantity} onChange={e => setForm({ ...form, quantity: e.target.valueAsNumber })} className={inputClass} /></label>
              <label className="text-sm font-medium">Tarif sewa (x Rp 1.000)<input required type="number" min="0" step="1" value={Number.isNaN(form.price) ? '' : form.price} onChange={e => setForm({ ...form, price: e.target.valueAsNumber })} className={inputClass} /><span className="mt-1 block text-xs text-gray-500">Contoh: isi 20 untuk menyimpan Rp 20.000.</span></label>
              <label className="text-sm font-medium">Satuan tarif<select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as ItemForm['unit'] })} className={inputClass}>{rentalUnits.map(unit => <option key={unit} value={unit}>Per {unit}</option>)}</select></label>
              <label className="text-sm font-medium">Ketersediaan<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ItemForm['status'] })} className={inputClass}>{inventoryStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
              <label className="text-sm font-medium">Foto barang (opsional)<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => setImage(e.target.files?.[0] || null)} className={inputClass} />{form.imageUrl && <span className="mt-1 block text-xs text-gray-500">Foto sebelumnya tetap digunakan jika tidak memilih foto baru.</span>}</label>
              <label className="text-sm font-medium sm:col-span-2">Deskripsi dan ketentuan sewa<textarea rows={3} maxLength={3000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} /></label>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 text-sm font-bold hover:bg-yellow-400">{busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Barang'}</button>
                {editingId && <button type="button" onClick={reset} className="rounded-lg border px-5 py-3 text-sm font-semibold">Batal Edit</button>}
              </div>
            </fieldset>
          </form>
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" aria-labelledby="daftar-barang-admin">
            <h2 id="daftar-barang-admin" className="mb-4 text-lg font-bold">Daftar Barang Sewa</h2>
            {loading ? <p role="status" className="text-sm text-gray-500">Memuat barang...</p> : loadError ? <p role="alert" className="text-sm text-red-700">{loadError}</p> : items.length === 0 ? <p className="text-sm text-gray-500">Belum ada barang. Tambahkan barang melalui formulir di atas.</p> : (
              <ul className="divide-y divide-gray-100">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0"><h3 className="break-words font-semibold">{item.name}</h3><p className="mt-1 text-sm text-gray-500">{formatRentalPrice(item.price)} / {item.unit} - {item.quantity} unit - {item.status}</p></div>
                <div className="flex gap-2"><button disabled={busy} type="button" onClick={() => edit(item)} aria-label={`Edit ${item.name}`} className="rounded-lg bg-blue-50 p-3 text-blue-700 disabled:opacity-50"><Pencil className="h-4 w-4" /></button><button disabled={busy} type="button" onClick={() => remove(item)} aria-label={`Hapus ${item.name}`} className="rounded-lg bg-red-50 p-3 text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div>
              </li>)}</ul>
            )}
          </section>
        </>}
      </div>
    </div>
  </div>;
}
