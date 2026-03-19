'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
// Tambahkan limit, startAfter untuk Paginasi
import { collection, getDocs, query, orderBy, where, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import Sidebar from '../components/Sidebar'; 

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
  views?: number; commentCount?: number;
  kredit?: { penulis: string; editor: string; fotografer: string; sumber: string; };
}

// PERBAIKAN: Fungsi pembersih HTML + Spasi Gaib
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
  
  // STATE PAGINASI (Load More)
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const BATCH_SIZE = 4; // Jumlah berita yang diload setiap kali tombol diklik

  // 🔥 GANTI NAMA KATEGORI DI BAWAH INI UNTUK HALAMAN LAIN (Contoh: "Bararasa")
  const KATEGORI_HALAMAN = "Mutiara Chondrodimuko"; 

  // Load Awal
  useEffect(() => {
    const fetchInitialArticles = async () => {
      try {
        const articlesQuery = query(
          collection(db, 'articles'), 
          where('category', '==', KATEGORI_HALAMAN), 
          orderBy('createdAt', 'desc'),
          limit(BATCH_SIZE) // Batasi hanya 4 berita awal
        );

        const articlesSnap = await getDocs(articlesQuery);
        
        if (!articlesSnap.empty) {
          setArticles(articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
          // Simpan dokumen terakhir untuk jadi titik mulai Load More selanjutnya
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

  // Fungsi Load More (Muat Lebih Banyak)
  const handleLoadMore = async () => {
    if (!lastVisibleDoc || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextQuery = query(
        collection(db, 'articles'),
        where('category', '==', KATEGORI_HALAMAN),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleDoc), // Mulai setelah berita terakhir yang tampil
        limit(BATCH_SIZE)
      );

      const nextSnap = await getDocs(nextQuery);

      if (!nextSnap.empty) {
        const newArticles = nextSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        setArticles(prev => [...prev, ...newArticles]); // Gabungkan berita lama + baru
        setLastVisibleDoc(nextSnap.docs[nextSnap.docs.length - 1]);
        
        // Kalau yang ditarik kurang dari limit, berarti beritanya sudah habis
        if (nextSnap.docs.length < BATCH_SIZE) {
          setHasMore(false);
        }
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
         <div className="text-center">
           <div className="w-12 h-12 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-sm font-serif font-bold tracking-widest uppercase text-[#0f2136]">Memuat Kanal...</p>
         </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 bg-gray-50/50">
      
      {/* HEADER HALAMAN */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#0f2136] mb-2 uppercase tracking-wider">
          {KATEGORI_HALAMAN}
        </h1>
        <div className="w-16 h-1 bg-yellow-500 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* KOLOM KIRI (Daftar Berita) */}
        <div className="w-full lg:w-2/3">
          {articles.length === 0 ? (
            <div className="w-full p-12 text-center bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
              <p className="text-xl font-serif text-gray-400">Belum ada tulisan di kanal ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {articles.map((article) => (
                <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                    <span className="absolute top-4 left-4 bg-yellow-500 text-[#0f2136] text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow">
                      {article.category}
                    </span>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <Link href={`/berita/${article.slug}`}>
                      <h3 className="text-lg font-bold font-serif text-[#0f2136] mb-3 group-hover:text-blue-700 line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {stripHtml(article.content)}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                        <span className="flex items-center gap-1.5 truncate w-1/2">
                          <svg className="w-3.5 h-3.5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                          <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span>
                        </span>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1" title={`${article.views || 0} kali dibaca`}>
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                            {article.views || 0}
                          </span>
                          <span className="flex items-center gap-1" title={`${article.commentCount || 0} komentar`}>
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
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
            <div className="mt-12 text-center">
              <button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-[#0f2136] text-[#0f2136] px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#0f2136] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoadingMore ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memuat...
                  </>
                ) : (
                  <>
                    Tampilkan Lebih Banyak 
                    <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* PESAN JIKA SEMUA BERITA SUDAH HABIS DILOAD */}
          {!hasMore && articles.length > 0 && (
             <div className="mt-12 text-center text-gray-400 text-sm font-medium italic border-t border-gray-100 pt-6">
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