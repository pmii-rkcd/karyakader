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
  tags?: string[];
}

// PERBAIKAN SAKTI: Membersihkan HTML dan menerjemahkan simbol
const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  let text = htmlString.replace(/<\/?[^>]+(>|$)/g, " ");
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&quot;/g, '"')
             .replace(/&amp;/g, '&')
             .replace(/&#39;/g, "'")
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/\s+/g, ' '); 
  return text.trim();
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
      <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] transition-colors duration-500 w-full overflow-hidden">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-[#0f2136] dark:text-gray-300 font-serif font-bold tracking-widest uppercase text-sm">Memuat Arsip...</p>
        </motion.div>
      </div>
    );
  }

  const headline = articles.length > 0 ? articles[0] : null;
  const restArticles = articles.length > 1 ? articles.slice(1) : [];

  // 1. Kartu Standar
  const renderStandardCard = (article: Article, isLarge = false) => (
    <div key={article.id} className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col h-full min-w-0 max-w-full">
      <div className={`relative w-full overflow-hidden shrink-0 ${isLarge ? 'h-56 sm:h-72 lg:h-[350px]' : 'h-48 sm:h-56'}`}>
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
        <span className="absolute top-3 left-3 backdrop-blur-md bg-white/90 dark:bg-black/80 text-[#0f2136] dark:text-yellow-500 text-[9px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-md">
          {article.category}
        </span>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
        <Link href={`/berita/${article.slug}`}>
          <h4 className={`font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-2 sm:mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug ${isLarge ? 'text-xl sm:text-2xl lg:text-[28px]' : 'text-base sm:text-[17px]'}`}>
            {article.title}
          </h4>
        </Link>
        <p className={`text-gray-500 dark:text-gray-400 mb-4 sm:mb-5 leading-relaxed line-clamp-2 break-words ${isLarge ? 'text-sm sm:text-[15px]' : 'text-xs sm:text-[13px]'}`}>
          {stripHtml(article.content)}
        </p>
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
          <span className="flex items-center gap-1.5 truncate w-1/2">
            <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500 shrink-0" />
            <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span>
          </span>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="flex items-center gap-1"><Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5" />{article.views || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 2. Kartu Horizontal
  const renderHorizontalCard = (article: Article) => (
    <Link href={`/berita/${article.slug}`} key={article.id} className="group flex items-start gap-3 sm:gap-4 md:gap-5 bg-transparent hover:bg-white dark:hover:bg-[#0d1520] p-2 sm:p-3 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800/60 overflow-hidden w-full max-w-full">
      <div className="relative w-24 sm:w-28 md:w-[130px] lg:w-[150px] aspect-[4/3] rounded-xl overflow-hidden shrink-0 shadow-sm">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100px, 150px" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
        <h4 className="text-[14px] sm:text-[15px] md:text-[17px] font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-1 sm:mb-2 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug break-words">
          {article.title}
        </h4>
        <div className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3 leading-relaxed break-words">
          {stripHtml(article.content)}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-auto">
          <span className="flex items-center gap-1 uppercase truncate"><User className="w-3 h-3 text-yellow-500 shrink-0" /> <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span></span>
          <span className="flex items-center gap-1 shrink-0"><Eye className="w-3 h-3" /> {article.views || 0}</span>
        </div>
      </div>
    </Link>
  );

  return (
    // PERBAIKAN MOBILE: min-w-0 max-w-full overflow-x-hidden pada kontainer paling atas Halaman Beranda
    <main className="max-w-7xl w-full mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10 flex flex-col xl:flex-row gap-8 md:gap-10 overflow-x-hidden min-w-0 max-w-[100vw] box-border">
      
      <div className="w-full xl:w-[68%] space-y-12 md:space-y-16 min-w-0 max-w-full overflow-hidden">
        
        {/* HEADLINE */}
        {headline && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="group w-full max-w-full">
            <div className="relative w-full h-[300px] sm:h-[380px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl md:shadow-2xl mb-2 border border-gray-100 dark:border-gray-800">
              <Image src={headline.imageUrl} alt={headline.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 70vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-10 w-full min-w-0 flex flex-col justify-end">
                <Link href={`/berita/${headline.slug}`} className="w-full block">
                  {/* PERBAIKAN MOBILE: text-lg di HP agar tidak terlalu raksasa, leading-snug, dan break-words */}
                  <h2 className="text-lg sm:text-2xl md:text-4xl leading-snug md:leading-[1.3] font-serif font-black text-white group-hover:text-yellow-400 transition-colors line-clamp-2 sm:line-clamp-3 break-words w-full">
                    {headline.title}
                  </h2>
                </Link>
                <p className="text-gray-200 text-xs sm:text-sm md:text-base mt-2 sm:mt-4 line-clamp-2 font-medium leading-relaxed w-full break-words hidden sm:block">
                  {stripHtml(headline.content)}
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[10px] sm:text-[11px] md:text-xs text-gray-300 mt-3 sm:mt-6 font-semibold">
                  <span className="flex items-center gap-1.5 truncate"><User className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-500 shrink-0" /> <span className="truncate">{headline.kredit?.penulis || 'Redaksi'}</span></span>
                  <span className="flex items-center gap-1.5 shrink-0"><Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-500" />{headline.views || 0} Dibaca</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CATEGORY LOOP */}
        {CATEGORIES.map((cat, index) => {
          const layoutType = index % 4;
          const limitNeeded = layoutType === 0 ? 4 : layoutType === 3 ? 3 : 4; 
          const categoryArticles = restArticles.filter(a => a.category === cat.name).slice(0, limitNeeded);
          if (categoryArticles.length === 0) return null;

          return (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="w-full max-w-full min-w-0">
              <div className="flex items-center gap-3 border-b-2 border-gray-200 dark:border-gray-800 pb-2 mb-6 md:mb-8">
                <div className="w-1.5 md:w-2 h-5 md:h-6 bg-yellow-500 rounded-full shrink-0"></div>
                <h3 className="font-serif text-[#0f2136] dark:text-white font-black text-xl md:text-[22px] tracking-wide uppercase truncate">{cat.name}</h3>
              </div>
              
              {layoutType === 0 ? (
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full">
                  <div className="w-full md:w-[55%] min-w-0">{renderStandardCard(categoryArticles[0], true)}</div>
                  <div className="w-full md:w-[45%] flex flex-col gap-2 sm:gap-4 min-w-0">
                    {categoryArticles.slice(1, 4).map(article => renderHorizontalCard(article))}
                  </div>
                </div>
              ) : layoutType === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 md:gap-8 w-full">
                  {categoryArticles.slice(0, 4).map(article => renderStandardCard(article))}
                </div>
              ) : layoutType === 2 ? (
                <div className="flex flex-col gap-2 sm:gap-4 w-full">
                  {categoryArticles.map(article => renderHorizontalCard(article))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 w-full">
                  {categoryArticles.slice(0, 3).map(article => renderStandardCard(article))}
                </div>
              )}

              <div className="text-right mt-6 md:mt-8">
                <Link href={cat.path} className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all uppercase tracking-widest bg-gray-50 dark:bg-[#15202b] px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg group">
                  Lihat {cat.name} Lainnya <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SIDEBAR */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full xl:w-[32%] xl:sticky top-24 self-start min-w-0 max-w-full overflow-hidden">
        <Sidebar menuName="Terkini & Populer" />
      </motion.div>
    </main>
  );
}