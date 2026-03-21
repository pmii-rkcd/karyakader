// app/bararasa/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import Sidebar from '../components/Sidebar'; 

// 🚀 IMPORT LUCIDE ICONS
import { Loader2, User, Eye, MessageSquare, ChevronDown } from 'lucide-react';

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
  views?: number; commentCount?: number;
  kredit?: { penulis: string; editor: string; fotografer: string; sumber: string; };
}

// 🔥 PERBAIKAN SAKTI & GUNTING PAKSA 🔥
// Fungsi ini membersihkan HTML, menerjemahkan simbol, DAN membatasi jumlah karakter
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

export default function KabarPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const BATCH_SIZE = 6; 

  const KATEGORI_HALAMAN = "Bararasa"; 

  useEffect(() => {
    const fetchInitialArticles = async () => {
      try {
        const articlesQuery = query(
          collection(db, 'articles'), 
          where('category', '==', KATEGORI_HALAMAN), 
          orderBy('createdAt', 'desc'),
          limit(BATCH_SIZE)
        );

        const articlesSnap = await getDocs(articlesQuery);
        
        if (!articlesSnap.empty) {
          setArticles(articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
          setLastVisibleDoc(articlesSnap.docs[articlesSnap.docs.length - 1]);
          if (articlesSnap.docs.length < BATCH_SIZE) setHasMore(false);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialArticles();
  }, [KATEGORI_HALAMAN]);

  const handleLoadMore = async () => {
    if (!lastVisibleDoc || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextQuery = query(
        collection(db, 'articles'),
        where('category', '==', KATEGORI_HALAMAN),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleDoc),
        limit(BATCH_SIZE)
      );

      const nextSnap = await getDocs(nextQuery);

      if (!nextSnap.empty) {
        const newArticles = nextSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        setArticles(prev => [...prev, ...newArticles]);
        setLastVisibleDoc(nextSnap.docs[nextSnap.docs.length - 1]);
        if (nextSnap.docs.length < BATCH_SIZE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Gagal load more:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] transition-colors duration-500 w-full overflow-hidden">
         <div className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-sm font-serif font-bold tracking-widest uppercase text-[#0f2136] dark:text-gray-300">Memuat Kanal...</p>
         </div>
      </div>
    );
  }

  return (
    // PERBAIKAN MOBILE: min-w-0 max-w-[100vw] overflow-x-hidden
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 bg-gray-50/50 dark:bg-[#0a0f18] transition-colors duration-500 font-sans min-w-0 max-w-[100vw] overflow-x-hidden box-border">
      
      {/* HEADER HALAMAN */}
      <div className="text-center mb-14 w-full">
        <h1 className="text-3xl md:text-5xl font-serif font-black text-[#0f2136] dark:text-white mb-3 uppercase tracking-wider drop-shadow-sm transition-colors break-words">
          {KATEGORI_HALAMAN}
        </h1>
        <div className="w-20 h-1.5 bg-yellow-500 mx-auto mt-4 rounded-full shadow-sm"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 w-full min-w-0">
        
        {/* KOLOM KIRI (Daftar Berita) */}
        <div className="w-full lg:w-2/3 min-w-0 max-w-full overflow-hidden">
          {articles.length === 0 ? (
            <div className="w-full p-10 sm:p-16 text-center bg-white dark:bg-[#0d1520] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <p className="text-xl md:text-2xl font-serif text-gray-400 dark:text-gray-500 font-medium">Belum ada tulisan di kanal ini.</p>
            </div>
          ) : (
            // PERBAIKAN MOBILE: Gap dikurangi sedikit di layar kecil
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
              {articles.map((article) => (
                // PERBAIKAN MOBILE: min-w-0 max-w-full agar kartu patuh ukuran layar
                <div key={article.id} className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-2xl transition-all duration-500 group flex flex-col h-full min-w-0 max-w-full">
                  {/* PERBAIKAN MOBILE: h-48 di layar kecil */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden shrink-0">
                    <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                    <span className="absolute top-4 left-4 backdrop-blur-md bg-white/90 dark:bg-black/80 text-[#0f2136] dark:text-yellow-500 text-[9px] sm:text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-md">
                      {article.category}
                    </span>
                  </div>
                  
                  <div className="p-5 sm:p-6 flex flex-col flex-1 min-w-0">
                    <Link href={`/berita/${article.slug}`}>
                      {/* PERBAIKAN MOBILE: break-words, line-clamp-2 */}
                      <h3 className="text-lg sm:text-[19px] font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-2 sm:mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug break-words">
                        {article.title}
                      </h3>
                    </Link>
                    
                    {/* PERBAIKAN SAKTI: Gunting paksa max 110 karakter */}
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed break-words">
                      {stripHtmlAndTruncate(article.content, 110)}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                        <span className="flex items-center gap-1.5 truncate w-1/2">
                          <User className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                          <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span>
                        </span>
                        
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <span className="flex items-center gap-1" title={`${article.views || 0} kali dibaca`}>
                            <Eye className="w-3.5 h-3.5" />
                            {article.views || 0}
                          </span>
                          <span className="flex items-center gap-1" title={`${article.commentCount || 0} komentar`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            {article.commentCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TOMBOL LOAD MORE */}
          {hasMore && articles.length > 0 && (
            <div className="mt-10 sm:mt-14 text-center">
              <button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#15202b] border-2 border-[#0f2136] dark:border-gray-700 text-[#0f2136] dark:text-gray-200 px-6 py-3 sm:px-8 sm:py-3.5 rounded-full font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-[#0f2136] dark:hover:bg-yellow-500 hover:text-white dark:hover:text-[#0f2136] transition-all duration-300 disabled:opacity-50 group shadow-sm hover:shadow-lg"
              >
                {isLoadingMore ? "Memuat..." : "Tampilkan Lebih Banyak"}
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isLoadingMore ? 'animate-bounce' : 'group-hover:translate-y-1'}`} />
              </button>
            </div>
          )}
        </div>

        {/* KOLOM KANAN (Sidebar Pintar) */}
        <div className="w-full lg:w-1/3 min-w-0 max-w-full overflow-hidden">
          <Sidebar menuName={KATEGORI_HALAMAN} />
        </div>

      </div>
    </main>
  );
}