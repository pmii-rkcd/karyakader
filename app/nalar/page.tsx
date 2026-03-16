'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
}

const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  return htmlString.replace(/<[^>]*>?/gm, '');
};

export default function NalarPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [general, setGeneral] = useState({ agenda: '', posterUrl: '' });
  const [isLoading, setIsLoading] = useState(true);

  // GANTI NAMA KATEGORI DI BAWAH INI UNTUK HALAMAN LAIN
  const KATEGORI_HALAMAN = "Nalar Tempaan"; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Query khusus: Ambil artikel HANYA yang kategorinya sesuai KATEGORI_HALAMAN
        const articlesQuery = query(
          collection(db, 'articles'), 
          where('category', '==', KATEGORI_HALAMAN), 
          orderBy('createdAt', 'desc')
        );

        const [articlesSnap, generalSnap] = await Promise.all([
          getDocs(articlesQuery),
          getDoc(doc(db, 'settings', 'general'))
        ]);

        setArticles(articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
        if (generalSnap.exists()) setGeneral(generalSnap.data() as any);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 bg-gray-50/50">
      
      {/* HEADER HALAMAN */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#0f2136] mb-2 uppercase tracking-wider">
          {KATEGORI_HALAMAN}
        </h1>
        <div className="w-16 h-1 bg-yellow-500 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* KOLOM KIRI (Daftar Berita) */}
        <div className="w-full lg:w-2/3">
          {articles.length === 0 ? (
            <div className="w-full p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xl font-serif text-gray-400">Belum ada tulisan di kanal ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group flex flex-col h-full">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <Link href={`/berita/${article.slug}`}>
                      <h3 className="text-lg font-bold font-serif text-[#0f2136] mb-2 group-hover:text-blue-700 line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {stripHtml(article.content)}
                    </p>
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <Link href={`/berita/${article.slug}`} className="text-[#0f2136] text-xs font-bold hover:text-yellow-600 uppercase tracking-widest transition-colors">
                        Baca Selengkapnya &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KOLOM KANAN (Sidebar Persis Beranda) */}
        <aside className="w-full lg:w-1/3 space-y-8">
          <div className="bg-white border-t-4 border-[#0f2136] rounded-b-lg p-6 shadow-sm border-x border-b border-gray-100">
            <h3 className="font-serif text-[#0f2136] font-extrabold text-sm mb-4 uppercase border-b border-yellow-500 pb-2">
              Agenda Rayon
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">{general.agenda || "Belum ada agenda."}</div>
          </div>

          <div className="bg-white border-t-4 border-yellow-500 rounded-b-lg p-6 shadow-sm border-x border-b border-gray-100">
            <h3 className="font-serif text-[#0f2136] font-extrabold text-sm mb-4 uppercase border-b border-[#0f2136] pb-2">
              Info / Poster
            </h3>
            <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-md overflow-hidden">
              {general.posterUrl ? (
                <Image src={general.posterUrl} alt="Poster" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              ) : (
                <p className="text-xs text-gray-400 absolute inset-0 flex items-center justify-center">Belum ada poster.</p>
              )}
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}