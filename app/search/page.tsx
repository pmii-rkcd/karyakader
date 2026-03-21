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
// 🚀 IMPORT LUCIDE ICONS
import { User, Eye, Loader2 } from 'lucide-react';

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
  views?: number; commentCount?: number;
  kredit?: { penulis: string; };
}

// 🔥 PERBAIKAN SAKTI & GUNTING PAKSA 🔥
// Fungsi membersihkan HTML, kode aneh, dan memotong teks agar tidak tembus
const stripHtmlAndTruncate = (htmlString: string, maxLength: number = 130) => {
  if (!htmlString) return '';
  let text = htmlString.replace(/<\/?[^>]+(>|$)/g, " ");
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&quot;/g, '"')
             .replace(/&ldquo;/g, '"')
             .replace(/&rdquo;/g, '"')
             .replace(/&amp;/g, '&')
             .replace(/&#39;/g, "'")
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/\s+/g, ' ')
             .trim();
             
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keyword = searchParams.get('q') || ''; 

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndFilterArticles = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const allArticles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));

        const filtered = allArticles.filter(article => 
          article.title.toLowerCase().includes(keyword.toLowerCase()) || 
          stripHtmlAndTruncate(article.content, 9999).toLowerCase().includes(keyword.toLowerCase())
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
      <div className="flex py-20 items-center justify-center bg-gray-50 dark:bg-[#0a0f18] transition-colors duration-500 w-full min-w-0">
         <div className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-xs font-bold tracking-widest uppercase text-[#0f2136] dark:text-gray-300">Mencari Arsip...</p>
         </div>
      </div>
    );
  }

  return (
    // PERBAIKAN MOBILE: min-w-0 mengunci kontainer agar tidak jebol
    <div className="flex flex-col lg:flex-row gap-10 w-full min-w-0">
      
      {/* KOLOM KIRI (Hasil Pencarian) */}
      <div className="w-full lg:w-2/3 min-w-0 max-w-full">
        <div className="bg-white dark:bg-[#0d1520] border-b-[3px] border-yellow-500 p-5 sm:p-6 rounded-xl shadow-sm mb-6 sm:mb-8 transition-colors duration-500">
          <h2 className="text-lg sm:text-xl md:text-2xl font-serif text-[#0f2136] dark:text-white break-words">
            Hasil pencarian untuk: <span className="font-bold font-sans italic text-yellow-600 dark:text-yellow-500">"{keyword}"</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Ditemukan {articles.length} berita terkait.</p>
        </div>

        {articles.length === 0 ? (
          <div className="w-full p-10 sm:p-12 text-center bg-white dark:bg-[#0d1520] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-500">
            <span className="text-4xl block mb-4">🕵️‍♂️</span>
            <p className="text-lg sm:text-xl font-serif text-gray-400 dark:text-gray-500 font-medium">Waduh, beritanya tidak ditemukan.</p>
            <button onClick={() => router.push('/')} className="mt-6 px-6 py-2.5 bg-[#0f2136] dark:bg-yellow-500 text-white dark:text-[#0f2136] rounded-lg font-bold text-sm hover:bg-yellow-500 dark:hover:bg-yellow-400 hover:text-[#0f2136] transition-colors shadow-sm">
              Kembali ke Beranda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
            {articles.map((article) => (
              // PERBAIKAN MOBILE: min-w-0 di kartu berita
              <div key={article.id} className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col h-full min-w-0 max-w-full">
                <div className="relative h-48 sm:h-56 w-full overflow-hidden shrink-0">
                  <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                  <span className="absolute top-4 left-4 backdrop-blur-md bg-white/90 dark:bg-black/80 text-[#0f2136] dark:text-yellow-500 text-[9px] sm:text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-md">
                    {article.category}
                  </span>
                </div>
                
                <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
                  <Link href={`/berita/${article.slug}`}>
                    <h3 className="text-base sm:text-lg font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-2 sm:mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug break-words">
                      {article.title}
                    </h3>
                  </Link>
                  {/* MENGGUNAKAN GUNTING PAKSA */}
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed break-words">
                    {stripHtmlAndTruncate(article.content, 110)}
                  </p>
                  
                  <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                    <span className="flex items-center gap-1.5 truncate w-1/2">
                      <User className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KOLOM KANAN (Sidebar) */}
      <div className="w-full lg:w-1/3 min-w-0 max-w-full overflow-hidden">
        <Sidebar menuName="Pencarian" />
      </div>
      
    </div>
  );
}

// WAJIB: Membungkus penggunaan useSearchParams dengan Suspense
export default function SearchPage() {
  return (
    // PERBAIKAN MOBILE PADA CONTAINER UTAMA
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 sm:py-10 bg-gray-50/50 dark:bg-[#0a0f18] transition-colors duration-500 min-h-screen font-sans min-w-0 max-w-[100vw] overflow-x-hidden box-border">
      <Suspense fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
           <div className="text-center flex flex-col items-center">
             <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
             <p className="text-xs font-bold tracking-widest uppercase text-[#0f2136] dark:text-gray-400">MEMUAT MESIN PENCARI...</p>
           </div>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </main>
  );
}