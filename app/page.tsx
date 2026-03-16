// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

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

// Fungsi pembantu untuk membuang tag HTML pada preview card (cuplikan berita)
const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  return htmlString.replace(/<[^>]*>?/gm, '');
};

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [agenda, setAgenda] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const articlesQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
        const [articlesSnapshot, settingsSnapshot] = await Promise.all([
          getDocs(articlesQuery),
          getDoc(doc(db, 'settings', 'general'))
        ]);

        const fetchedArticles = articlesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        setArticles(fetchedArticles);

        if (settingsSnapshot.exists()) {
          const settingsData = settingsSnapshot.data();
          setAgenda(settingsData.agenda || '');
          setPosterUrl(settingsData.posterUrl || '');
        }
      } catch (error) {
        console.error("Gagal mengambil data beranda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tampilan Loading yang lebih elegan
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <motion.div 
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-center"
        >
           <div className="w-16 h-16 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin mx-auto mb-4 shadow-lg"></div>
           <p className="text-[#0f2136] font-serif font-bold tracking-widest uppercase text-sm">Memuat Karya Kader...</p>
        </motion.div>
      </div>
    );
  }

  // Memisahkan Berita Utama (Headline) dan Berita Lainnya
  const headline = articles.length > 0 ? articles[0] : null;
  const otherArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col lg:flex-row gap-10">
      
      {/* KOLOM KIRI (Konten Utama) */}
      <div className="w-full lg:w-2/3 space-y-10">
        
        {/* BERITA UTAMA (Headline) */}
        {headline ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="group cursor-pointer"
          >
            <div className="relative w-full h-[300px] md:h-[450px] rounded-xl overflow-hidden shadow-lg mb-6">
              <Image 
                src={headline.imageUrl} 
                alt={headline.title}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f2136]/90 via-[#0f2136]/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <span className="bg-yellow-500 text-[#0f2136] text-xs font-bold px-3 py-1 uppercase tracking-widest shadow-md mb-3 inline-block">
                  {headline.category}
                </span>
                <Link href={`/berita/${headline.slug}`}>
                  <h2 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight group-hover:text-yellow-400 transition-colors drop-shadow-md">
                    {headline.title}
                  </h2>
                </Link>
                {/* Penerapan stripHtml pada Headline */}
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

        {/* GRID BERITA LAINNYA */}
        {otherArticles.length > 0 && (
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#0f2136] pb-2 mb-6">
              <h3 className="font-serif text-[#0f2136] font-bold text-xl uppercase tracking-wider">Berita Terbaru</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {otherArticles.map((article, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  key={article.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image 
                      src={article.imageUrl} 
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
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
                    {/* Penerapan stripHtml pada Grid Berita */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {stripHtml(article.content)}
                    </p>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium tracking-wide">Redaksi Kawah</span>
                      <Link href={`/berita/${article.slug}`} className="text-[#0f2136] text-xs font-bold hover:text-yellow-600 uppercase tracking-widest transition-colors">
                        Baca &rarr;
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KOLOM KANAN (Sidebar dengan Animasi) */}
      <motion.aside 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full lg:w-1/3 space-y-8"
      >
        
        {/* WIDGET 1: Agenda Rayon */}
        <div className="bg-white border-t-4 border-[#0f2136] rounded-b-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-serif text-[#0f2136] font-extrabold text-lg mb-4 uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Agenda Rayon
          </h3>
          {agenda ? (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {agenda}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Belum ada agenda terdekat.</p>
          )}
        </div>

        {/* WIDGET 2: Info / Poster */}
        <div className="bg-white border-t-4 border-yellow-500 rounded-b-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-serif text-[#0f2136] font-extrabold text-lg mb-4 uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-[#0f2136] rounded-full"></span> Info / Poster
          </h3>
          <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-md overflow-hidden group">
            {posterUrl ? (
              <Image 
                src={posterUrl} 
                alt="Poster Kegiatan"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-gray-400 font-medium italic">Belum ada poster.</p>
              </div>
            )}
          </div>
        </div>

        {/* WIDGET 3: Paling Dibaca */}
        <div className="bg-white border-t-4 border-[#0f2136] rounded-b-lg p-6 shadow-md">
          <h3 className="font-serif text-[#0f2136] font-extrabold text-lg mb-5 uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Terkini
          </h3>
          <div className="space-y-5">
            {articles.slice(0, 4).map((article, index) => (
               <Link href={`/berita/${article.slug}`} key={`pop-${article.id}`} className="flex gap-4 group items-start">
                 <span className="text-3xl font-serif font-black text-gray-200 group-hover:text-yellow-500 transition-colors leading-none">
                   {index + 1}
                 </span>
                 <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-700 line-clamp-2 leading-snug">
                   {article.title}
                 </h4>
               </Link>
            ))}
          </div>
        </div>

      </motion.aside>
    </main>
  );
}