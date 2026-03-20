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
import { User, Eye, MessageSquare, ArrowRight, Loader2, Tag } from 'lucide-react';

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
  authorEmail: string; createdAt: any; views?: number; commentCount?: number;
  kredit?: { penulis: string; editor: string; fotografer: string; sumber: string; };
  tags?: string[];
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
        // Limit diperbesar agar cukup mengisi 4 variasi model (sekitar 1+4+4+4+3)
        const articlesQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(30));
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
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-[#0f2136] dark:text-gray-300 font-serif font-bold tracking-widest uppercase text-sm">Memuat Arsip...</p>
        </motion.div>
      </div>
    );
  }

  const headline = articles.length > 0 ? articles[0] : null;
  const restArticles = articles.length > 1 ? articles.slice(1) : [];

  // ==========================================
  // KOMPONEN KARTU BERITA INTERNAL
  // ==========================================
  
  // 1. Kartu Standar (Gambar di atas, Teks di bawah)
  const renderStandardCard = (article: Article, isLarge = false) => (
    <div key={article.id} className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-500 group flex flex-col h-full">
      <div className={`relative w-full overflow-hidden ${isLarge ? 'h-64 sm:h-72 lg:h-[350px]' : 'h-48'}`}>
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
        <span className="absolute top-3 left-3 backdrop-blur-md bg-white/90 dark:bg-black/80 text-[#0f2136] dark:text-yellow-500 text-[9px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-md">
          {article.category}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <Link href={`/berita/${article.slug}`}>
          <h4 className={`font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug ${isLarge ? 'text-2xl lg:text-[28px]' : 'text-[17px]'}`}>
            {article.title}
          </h4>
        </Link>
        <p className={`text-gray-500 dark:text-gray-400 mb-5 leading-relaxed ${isLarge ? 'text-[15px] line-clamp-4' : 'text-[13px] line-clamp-3'}`}>
          {stripHtml(article.content)}
        </p>
        
        {/* INFO METADATA BAWAH */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
          <span className="flex items-center gap-1.5 truncate w-1/2">
            <User className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1" title={`${article.views || 0} kali dibaca`}><Eye className="w-3.5 h-3.5" />{article.views || 0}</span>
            <span className="flex items-center gap-1" title={`${article.commentCount || 0} komentar`}><MessageSquare className="w-3.5 h-3.5" />{article.commentCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 2. Kartu Horizontal Minimalis (Daftar List - Gambar Kiri, Teks Kanan)
  const renderHorizontalCard = (article: Article) => (
    <Link href={`/berita/${article.slug}`} key={article.id} className="group flex items-start gap-4 md:gap-5 bg-transparent hover:bg-white dark:hover:bg-[#0d1520] p-3 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800/60 hover:shadow-lg">
      <div className="relative w-28 md:w-[130px] lg:w-[150px] aspect-[4/3] rounded-xl overflow-hidden shrink-0 shadow-sm">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="150px" />
      </div>
      <div className="flex-1 flex flex-col justify-center py-1">
        <h4 className="text-[15px] md:text-[17px] font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-2 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h4>
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed hidden sm:block">
          {stripHtml(article.content)}
        </p>
        <div className="flex items-center gap-3 text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-auto">
          <span className="flex items-center gap-1 uppercase tracking-wide"><User className="w-3 h-3 text-yellow-500" /> {article.kredit?.penulis || 'Redaksi'}</span>
          <span className="flex items-center gap-1 hidden md:flex"><Eye className="w-3 h-3" /> {article.views || 0}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col xl:flex-row gap-10">
      
      {/* === KOLOM KIRI (Area Utama Berita) === */}
      <div className="w-full xl:w-[68%] space-y-16">
        
        {/* === HEADLINE UTAMA === */}
        {headline ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="group cursor-pointer">
            <div className="relative w-full h-[380px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl mb-2 border border-gray-100 dark:border-gray-800">
              <Image src={headline.imageUrl} alt={headline.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90"></div>
              
              <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                <span className="backdrop-blur-md bg-white/20 border border-white/30 text-white text-[10px] md:text-xs font-bold px-4 py-1.5 uppercase tracking-widest rounded-full mb-4 inline-block shadow-sm">
                  Sorotan Utama
                </span>
                
                <Link href={`/berita/${headline.slug}`}>
                  <h2 className="text-2xl md:text-4xl md:leading-[1.3] font-serif font-black text-white group-hover:text-yellow-400 transition-colors drop-shadow-md line-clamp-3">
                    {headline.title}
                  </h2>
                </Link>
                <p className="text-gray-300 text-sm md:text-base mt-4 line-clamp-2 md:line-clamp-3 font-medium leading-relaxed">
                  {stripHtml(headline.content)}
                </p>
                
                <div className="flex flex-wrap items-center gap-5 text-[11px] md:text-xs text-gray-300 mt-6 font-semibold tracking-wide">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-yellow-500" />{headline.kredit?.penulis || 'Redaksi'}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-yellow-500" />{headline.views || 0} Dibaca</span>
                  <span className="flex items-center gap-1.5 hidden sm:flex"><MessageSquare className="w-4 h-4 text-yellow-500" />{headline.commentCount || 0} Komentar</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0d1520] shadow-sm">
            <p className="text-xl md:text-2xl font-serif text-gray-400 font-medium">Belum ada tulisan dipublikasikan.</p>
          </div>
        )}

        {/* === DAFTAR KATEGORI (DENGAN LAYOUT BERVARIASI) === */}
        {CATEGORIES.map((cat, index) => {
          // Rotasi Layout: 0 (Feature+List), 1 (Grid 2), 2 (Horizontal List), 3 (Grid 3)
          const layoutType = index % 4;
          
          // Sesuaikan jumlah artikel yang ditarik berdasarkan Layout
          const limitNeeded = layoutType === 0 ? 4 : layoutType === 3 ? 3 : 4; 
          const categoryArticles = restArticles.filter(a => a.category === cat.name).slice(0, limitNeeded);
          
          if (categoryArticles.length === 0) return null;

          return (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }}>
              
              {/* Header Kategori */}
              <div className="flex items-center justify-between border-b-2 border-gray-200 dark:border-gray-800 pb-2 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-serif text-[#0f2136] dark:text-white font-black text-[22px] tracking-wide uppercase">
                    {cat.name}
                  </h3>
                </div>
              </div>
              
              {/* RENDER LAYOUT BERDASARKAN INDEX */}
              
              {/* MODEL A: Feature + List (1 Besar Kiri, 3 List Kanan) */}
              {layoutType === 0 && (
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-[55%]">
                    {renderStandardCard(categoryArticles[0], true)}
                  </div>
                  <div className="w-full md:w-[45%] flex flex-col gap-4">
                    {categoryArticles.slice(1, 4).map(article => renderHorizontalCard(article))}
                  </div>
                </div>
              )}

              {/* MODEL B: Grid 2 Kolom Sejajar */}
              {layoutType === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {categoryArticles.slice(0, 4).map(article => renderStandardCard(article))}
                </div>
              )}

              {/* MODEL C: List Horizontal Berjejer ke Bawah */}
              {layoutType === 2 && (
                <div className="flex flex-col gap-4">
                  {categoryArticles.map(article => renderHorizontalCard(article))}
                </div>
              )}

              {/* MODEL D: Grid 3 Kolom */}
              {layoutType === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {categoryArticles.slice(0, 3).map(article => renderStandardCard(article))}
                </div>
              )}

              {/* Tombol Lihat Lainnya */}
              <div className="text-right mt-8">
                <Link href={cat.path} className="inline-flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all uppercase tracking-widest bg-gray-50 dark:bg-[#15202b] hover:bg-yellow-50 dark:hover:bg-yellow-500/10 px-5 py-2.5 rounded-lg group">
                  Lihat Berita {cat.name} Lainnya <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </motion.div>
          );
        })}

      </div>

      {/* === KOLOM KANAN (Sidebar Tetap Dipertahankan) === */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full xl:w-[32%] sticky top-24 self-start">
        <Sidebar menuName="Terkini & Populer" />
      </motion.div>
      
    </main>
  );
}