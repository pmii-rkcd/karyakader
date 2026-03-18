// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imageUrl: string;
  authorEmail: string;
  createdAt: any;
}

// Fungsi pembantu untuk membuang tag HTML
const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  return htmlString.replace(/<[^>]*>?/gm, '');
};

// Daftar Kategori Utama
const CATEGORIES = [
  { name: 'Kabar Dari Kawah', path: '/kabar' },
  { name: 'Bararasa', path: '/bararasa' },
  { name: 'Nalar Tempaan', path: '/nalar' },
  { name: 'Mutiara Chondro', path: '/mutiara' }
];

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
        const articlesSnapshot = await getDocs(articlesQuery);
        const fetchedArticles = articlesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Gagal mengambil data beranda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <motion.div 
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-center"
        >
           <div className="w-16 h-16 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin mx-auto mb-4 shadow-lg"></div>
           <p className="text-[#0f2136] font-serif font-bold tracking-widest uppercase text-sm">Memuat Berita...</p>
        </motion.div>
      </div>
    );
  }

  // Ambil 1 Berita Paling Baru sebagai HEADLINE UTAMA
  const headline = articles.length > 0 ? articles[0] : null;
  // Sisanya buang 1 yang sudah jadi headline
  const restArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col lg:flex-row gap-10">
      
      {/* KOLOM KIRI (Konten Utama) */}
      <div className="w-full lg:w-2/3 space-y-12">
        
        {/* BERITA UTAMA (Headline Besar) */}
        {headline ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="group cursor-pointer">
            <div className="relative w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-lg mb-2">
              <Image src={headline.imageUrl} alt={headline.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1727] via-[#0a1727]/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <span className="bg-yellow-500 text-[#0f2136] text-xs font-bold px-3 py-1 uppercase tracking-widest shadow-md mb-3 inline-block">
                  {headline.category}
                </span>
                <Link href={`/berita/${headline.slug}`}>
                  <h2 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight group-hover:text-yellow-400 transition-colors drop-shadow-md">
                    {headline.title}
                  </h2>
                </Link>
                <p className="text-gray-300 text-sm mt-3 line-clamp-2 md:line-clamp-3">
                  {stripHtml(headline.content)}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white shadow-sm">
            <p className="text-2xl font-serif text-gray-400 font-medium">Belum ada berita dipublikasikan.</p>
          </div>
        )}

        {/* PEMBAGIAN BERITA BERDASARKAN KATEGORI */}
        {CATEGORIES.map((cat, index) => {
          // Ambil maksimal 3 berita terbaru untuk kategori ini (selain headline)
          const categoryArticles = restArticles.filter(a => a.category === cat.name).slice(0, 3);
          
          if (categoryArticles.length === 0) return null; // Jika kategori ini kosong, jangan tampilkan judulnya

          return (
            <motion.div 
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="pt-6 border-t-2 border-gray-100"
            >
              <div className="flex items-center justify-between border-b-2 border-[#0f2136] pb-2 mb-6">
                <h3 className="font-serif text-[#0f2136] font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 block"></span> {cat.name}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categoryArticles.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <Link href={`/berita/${article.slug}`}>
                        <h4 className="text-md font-bold font-serif text-[#0f2136] mb-2 group-hover:text-blue-700 line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                      </Link>
                      <p className="text-gray-500 text-xs mb-4 line-clamp-3 leading-relaxed">
                        {stripHtml(article.content)}
                      </p>
                      <div className="mt-auto pt-3 border-t border-gray-100 flex justify-end">
                        <Link href={`/berita/${article.slug}`} className="text-[#0f2136] text-[10px] font-bold hover:text-yellow-600 uppercase tracking-widest transition-colors">
                          Baca &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol Lihat Selengkapnya (Hanya muncul jika berita di kategori tsb > 3, opsional tapi bagus untuk UI) */}
              <div className="text-right mt-4">
                <Link href={cat.path} className="inline-block text-sm font-bold text-gray-500 hover:text-yellow-600 transition uppercase tracking-widest bg-gray-50 px-4 py-2 rounded">
                  Lihat Berita {cat.name} Lainnya &raquo;
                </Link>
              </div>
            </motion.div>
          );
        })}

      </div>

      {/* KOLOM KANAN (Sidebar Pintar) */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full lg:w-1/3">
        {/* Kita panggil Sidebar komponen yang sudah canggih! */}
        <Sidebar menuName="Terkini & Populer" />
      </motion.div>
      
    </main>
  );
}