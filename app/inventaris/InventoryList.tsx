'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PackageOpen } from 'lucide-react';
import { loadInventory } from '@/lib/inventory-client';
import { formatRentalPrice, type InventoryItem } from '@/lib/inventory';
import RentalRequestButton from './RentalRequestButton';

export default function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadInventory(controller.signal).then(data => { setItems(data); setLoading(false); setError(false); })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false); } });
    return () => controller.abort();
  }, []);

  if (loading) return <p role="status" className="py-10 text-center text-sm text-gray-500">Memuat daftar barang sewa...</p>;
  if (error) return <p role="alert" className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Daftar barang belum dapat dimuat. Silakan coba lagi nanti.</p>;
  if (!items.length) return (
    <div className="flex flex-col items-center px-2 py-8 text-center">
      <div className="mb-4 rounded-2xl bg-yellow-50 p-4 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"><PackageOpen className="h-10 w-10" aria-hidden="true" /></div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Daftar barang sewa sedang disiapkan</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">Informasi barang, tarif sewa, ketersediaan, dan tata cara penyewaan akan ditampilkan di halaman ini.</p>
    </div>
  );
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-50 dark:bg-gray-800">
          {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /> : <PackageOpen className="h-12 w-12 text-gray-400" aria-hidden="true" />}
        </div>
        <div className="p-4">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Tersedia' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-900'}`}>{item.status}</span>
          <h3 className="mt-3 break-words text-lg font-bold text-gray-900 dark:text-gray-100">{item.name}</h3>
          <p className="mt-1 font-semibold text-blue-700 dark:text-yellow-400">{formatRentalPrice(item.price)} <span className="text-sm font-normal">/ {item.unit}</span></p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Jumlah inventaris: {item.quantity} unit{typeof item.availableQuantity === 'number' ? ` - tersedia ${item.availableQuantity} unit` : ''}</p>
          {item.rentedQuantity ? <p className="mt-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400">Sedang dipinjam: {item.rentedQuantity} unit</p> : null}
          {item.description && <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.description}</p>}
          <RentalRequestButton item={item} />
        </div>
      </article>)}
    </div>
  );
}
