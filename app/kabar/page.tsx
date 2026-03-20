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

const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  let text = htmlString.replace(/<[^>]*>?/gm, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' '); 
  text = text.replace(/&amp;/g, '&');
  return text;
};

export default function KabarPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const BATCH_SIZE = 4;

  // 🔥 GANTI NAMA KATEGORI DI BAWAH INI UNTUK HALAMAN LAIN (Contoh: "Bararasa")
  const KATEGORI_HALAMAN = "Kabar Dari Kawah"; 

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
      <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] transition-colors duration-500">
         <div className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-sm font-serif font-bold tracking-widest uppercase text-[#0f2136] dark:text-gray-300">Memuat Kanal...</p>
         </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 bg-gray-50/50 dark:bg-[#0a0f18] transition-colors duration-500 font-sans">
      
      {/* HEADER HALAMAN */}
      <div className="text-center mb-14">
        <h1 className="text-3xl md:text-5xl font-serif font-black text-[#0f2136] dark:text-white mb-3 uppercase tracking-wider drop-shadow-sm transition-colors">
          {KATEGORI_HALAMAN}
        </h1>
        <div className="w-20 h-1.5 bg-yellow-500 mx-auto mt-4 rounded-full shadow-sm"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* KOLOM KIRI (Daftar Berita) */}
        <div className="w-full lg:w-2/3">
          {articles.length === 0 ? (
            <div className="w-full p-16 text-center bg-white dark:bg-[#0d1520] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <p className="text-xl md:text-2xl font-serif text-gray-400 dark:text-gray-500 font-medium">Belum ada tulisan di kanal ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {articles.map((article) => (
                <div key={article.id} className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-500 group flex flex-col h-full">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                    <span className="absolute top-4 left-4 backdrop-blur-md bg-white/90 dark:bg-black/80 text-[#0f2136] dark:text-yellow-500 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-md">
                      {article.category}
                    </span>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <Link href={`/berita/${article.slug}`}>
                      <h3 className="text-[19px] font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 line-clamp-3 leading-relaxed">
                      {stripHtml(article.content)}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                        <span className="flex items-center gap-1.5 truncate w-1/2">
                          <User className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                          <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span>
                        </span>
                        
                        <div className="flex items-center gap-3 shrink-0">
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

          {/* TOMBOL LOAD MORE PAGINASI */}
          {hasMore && articles.length > 0 && (
            <div className="mt-14 text-center">
              <button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#15202b] border-2 border-[#0f2136] dark:border-gray-700 text-[#0f2136] dark:text-gray-200 px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#0f2136] dark:hover:bg-yellow-500 hover:text-white dark:hover:text-[#0f2136] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-lg"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" />
                    Memuat...
                  </>
                ) : (
                  <>
                    Tampilkan Lebih Banyak 
                    <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* PESAN JIKA SEMUA BERITA SUDAH HABIS DILOAD */}
          {!hasMore && articles.length > 0 && (
             <div className="mt-14 text-center text-gray-400 dark:text-gray-500 text-sm font-medium italic border-t border-gray-100 dark:border-gray-800 pt-8">
               ~ Semua berita di kanal ini telah ditampilkan ~
             </div>
          )}

        </div>

        {/* KOLOM KANAN (Sidebar Pintar) */}
        <div className="w-full lg:w-1/3">
          <Sidebar menuName={KATEGORI_HALAMAN} />
        </div>

      </div>
    </main>
  );
}