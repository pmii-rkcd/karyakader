import type { Metadata } from 'next';
import Link from 'next/link';
import { Archive, ChevronRight } from 'lucide-react';
import InventoryList from './InventoryList';

export const metadata: Metadata = {
  title: 'Inventaris - Karya Kader',
  description: 'Informasi penyewaan perlengkapan, tarif sewa, dan ketersediaan barang inventaris PR. PMII Kawah Chondrodimuko.',
};

export default function InventarisPage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <nav aria-label="Jejak halaman" className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-yellow-600">Beranda</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span aria-current="page" className="text-blue-700 dark:text-yellow-400">Inventaris</span>
      </nav>

      <header className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-yellow-700 dark:text-yellow-400">
          <Archive className="h-5 w-5" aria-hidden="true" />Penyewaan Perlengkapan
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#0f2136] sm:text-4xl dark:text-white">Inventaris</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
          Temukan perlengkapan untuk kebutuhan acara dan kegiatan Anda.
          Lihat pilihan barang, tarif sewa, dan ketersediaannya di sini.
        </p>
      </header>

      <section aria-labelledby="daftar-inventaris" className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#0d1520] sm:p-8">
        <h2 id="daftar-inventaris" className="text-lg font-bold text-[#0f2136] dark:text-gray-100">Daftar Barang Sewa</h2>
        <InventoryList />
      </section>
    </main>
  );
}
