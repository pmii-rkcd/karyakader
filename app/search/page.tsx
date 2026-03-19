// app/search/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
// Panggil Sidebar (sesuaikan jalurnya jika error, biasanya '../components/Sidebar')
import Sidebar from '../components/Sidebar'; 

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
  views?: number; commentCount?: number;
  kredit?: { penulis: string; };
}

const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  return htmlString.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keyword = searchParams.get('q') || ''; // Menangkap kata kunci dari URL

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndFilterArticles = async () => {
      setIsLoading(true);
      try {
        // Tarik semua berita dari database
        const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const allArticles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));

        // Filter berita yang judul atau isinya mengandung kata kunci pencarian (mengabaikan huruf besar/kecil)
        const filtered = allArticles.filter(article => 
          article.title.toLowerCase().includes(keyword.toLowerCase()) || 
          stripHtml(article.content).toLowerCase().includes(keyword.toLowerCase())
        );

        setArticles(filtered);
      } catch (error) {
        console.error("Gagal melakukan pencarian:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (keyword) {
      fetchAndFilterArticles();
    } else {
      setIsLoading(false);
    }
  }, [keyword]);

  if (isLoading) {
    return (
      <div className="flex py-20 items-center justify-center bg-gray-50 w-full lg:w-2/3">
         <div className="text-center">
           <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0f2136] rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-xs font-bold tracking-widest uppercase text-gray-500">Mencari Arsip...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* KOLOM KIRI (Hasil Pencarian) */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white border-b-4 border-yellow-500 p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl md:text-2xl font-serif text-[#0f2136]">
            Hasil pencarian untuk: <span className="font-bold font-sans italic">"{keyword}"</span>
          </h2>
          <p className="text-sm text-gray-500 mt-2">Ditemukan {articles.length} berita terkait.</p>
        </div>

        {articles.length === 0 ? (
          <div className="w-full p-12 text-center bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
            <span className="text-4xl block mb-4">🕵️‍♂️</span>
            <p className="text-xl font-serif text-gray-400">Waduh, beritanya tidak ditemukan.</p>
            <button onClick={() => router.push('/')} className="mt-6 px-6 py-2 bg-[#0f2136] text-white rounded font-bold text-sm hover:bg-yellow-500 hover:text-[#0f2136] transition">
              Kembali ke Beranda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                  <span className="absolute top-4 left-4 bg-yellow-500 text-[#0f2136] text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow">
                    {article.category}
                  </span>
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
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                    <span className="truncate w-1/2 text-yellow-600">Oleh: {article.kredit?.penulis || 'Redaksi'}</span>
                    <span className="flex items-center gap-1">{article.views || 0} tayangan</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KOLOM KANAN (Sidebar) */}
      <div className="w-full lg:w-1/3">
        <Sidebar menuName="Pencarian" />
      </div>
    </div>
  );
}

// WAJIB: Membungkus penggunaan useSearchParams dengan Suspense (Aturan Next.js terbaru)
export default function SearchPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 bg-gray-50/50 min-h-screen">
      <Suspense fallback={<div className="text-center py-20 text-gray-500 font-bold tracking-widest animate-pulse">MEMUAT MESIN PENCARI...</div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}