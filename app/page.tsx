// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
// 🚀 IMPORT LUCIDE ICONS
import { User, Eye, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
  authorEmail: string; createdAt: any; views?: number; commentCount?: number;
  kredit?: { penulis: string; editor: string; fotografer: string; sumber: string; };
}

const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  let text = htmlString.replace(/<[^>]*>?/gm, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ').replace(/&amp;/g, '&');
  return text;
};

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
        const articlesQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(20));
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
      <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] transition-colors duration-500">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-center flex flex-col items-center"
        >
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-[#0f2136] dark:text-gray-300 font-serif font-bold tracking-widest uppercase text-sm">Memuat Arsip...</p>
        </motion.div>
      </div>
    );
  }

  const headline = articles.length > 0 ? articles[0] : null;
  const restArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col lg:flex-row gap-10">
      
      {/* === KOLOM KIRI (Konten Utama) === */}
      <div className="w-full lg:w-2/3 space-y-14">
        
        {/* === HEADLINE UTAMA === */}
        {headline ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="group cursor-pointer">
            <div className="relative w-full h-[380px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl mb-2 border border-gray-100 dark:border-gray-800">
              <Image src={headline.imageUrl} alt={headline.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
              
              {/* Gradient Gelap Elegan */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90"></div>
              
              <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                {/* Badge Glassmorphism */}
                <span className="backdrop-blur-md bg-white/20 border border-white/30 text-white text-[10px] md:text-xs font-bold px-4 py-1.5 uppercase tracking-widest rounded-full mb-4 inline-block shadow-sm">
                  {headline.category}
                </span>
                
                <Link href={`/berita/${headline.slug}`}>
                  <h2 className="text-2xl md:text-4xl md:leading-[1.3] font-serif font-black text-white group-hover:text-yellow-400 transition-colors drop-shadow-md line-clamp-3">
                    {headline.title}
                  </h2>
                </Link>
                <p className="text-gray-300 text-sm md:text-base mt-4 line-clamp-2 md:line-clamp-3 font-medium leading-relaxed">
                  {stripHtml(headline.content)}
                </p>
                
                {/* INFO METADATA HEADLINE (Lucide Icons) */}
                <div className="flex flex-wrap items-center gap-5 text-[11px] md:text-xs text-gray-300 mt-6 font-semibold tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-yellow-500" />
                    {headline.kredit?.penulis || 'Redaksi'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-yellow-500" />
                    {headline.views || 0} Kali Dibaca
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-yellow-500" />
                    {headline.commentCount || 0} Komentar
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0d1520] shadow-sm">
            <p className="text-xl md:text-2xl font-serif text-gray-400 font-medium">Belum ada tulisan dipublikasikan.</p>
          </div>
        )}

        {/* === DAFTAR KATEGORI BAWAH === */}
        {CATEGORIES.map((cat, index) => {
          const categoryArticles = restArticles.filter(a => a.category === cat.name).slice(0, 3);
          if (categoryArticles.length === 0) return null;

          return (
            <motion.div 
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="pt-8"
            >
              {/* Header Kategori Modern */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-serif text-[#0f2136] dark:text-white font-black text-2xl tracking-wide">
                    {cat.name}
                  </h3>
                </div>
              </div>
              
              {/* GRID KARTU BERITA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {categoryArticles.map((article) => (
                  <div key={article.id} className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-500 group flex flex-col h-full">
                    
                    {/* Thumbnail */}
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                      {/* Badge Glassmorphism kecil */}
                      <span className="absolute top-3 left-3 backdrop-blur-md bg-white/90 dark:bg-black/80 text-[#0f2136] dark:text-yellow-500 text-[9px] font-bold px-2.5 py-1 uppercase tracking-wider shadow-sm rounded">
                        Terbaru
                      </span>
                    </div>
                    
                    {/* Konten Kartu */}
                    <div className="p-5 flex flex-col flex-1">
                      <Link href={`/berita/${article.slug}`}>
                        <h4 className="text-[17px] font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                      </Link>
                      <p className="text-gray-500 dark:text-gray-400 text-[13px] mb-5 line-clamp-3 leading-relaxed">
                        {stripHtml(article.content)}
                      </p>
                      
                      {/* INFO METADATA BAWAH (Penulis & Views) */}
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-col gap-2">
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

              {/* Tombol Call-to-Action (Lihat Lainnya) Modern */}
              <div className="text-right mt-6">
                <Link href={cat.path} className="inline-flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all uppercase tracking-widest bg-gray-50 dark:bg-[#15202b] hover:bg-yellow-50 dark:hover:bg-yellow-500/10 px-5 py-2.5 rounded-lg group">
                  Lebih Banyak di {cat.name} 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          );
        })}

      </div>

      {/* === KOLOM KANAN (Sidebar) === */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full lg:w-1/3">
        <Sidebar menuName="Terkini & Populer" />
      </motion.div>
      
    </main>
  );
}