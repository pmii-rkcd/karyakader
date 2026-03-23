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
import { User, Eye, MessageSquare, ArrowRight, Loader2, Clock } from 'lucide-react';

interface Article {
  id: string; title: string; slug: string; content: string; category: string; imageUrl: string;
  authorEmail: string; createdAt: any; views?: number; commentCount?: number;
  kredit?: { penulis: string; editor: string; fotografer: string; sumber: string; };
  tags?: string[];
}

const stripHtmlAndTruncate = (htmlString: string, maxLength: number = 130) => {
  if (!htmlString) return '';
  let text = htmlString.replace(/<\/?[^>]+(>|$)/g, " ");
  text = text.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  if (text.length > maxLength) return text.substring(0, maxLength) + '...';
  return text;
};

// Fungsi helper untuk memformat waktu/tanggal
const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};

const CATEGORIES = [
  { name: 'Bararasa', path: '/bararasa' },
  { name: 'Kabar Dari Kawah', path: '/kabar' },
  { name: 'Mutiara Chondro', path: '/mutiara' },
  { name: 'Nalar Tempaan', path: '/nalar' }
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
           <p className="text-[#0f2136] dark:text-gray-300 font-serif font-bold tracking-widest uppercase text-sm">Memuat Berita...</p>
        </motion.div>
      </div>
    );
  }

  const headline = articles.length > 0 ? articles[0] : null;
  const restArticles = articles.length > 1 ? articles.slice(1) : [];

  // ==========================================
  // DESAIN 1: KARTU STANDAR (Gambar Atas, Teks Bawah)
  // ==========================================
  const renderStandardCard = (article: Article, isLarge = false) => (
    <div key={article.id} className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col h-full min-w-0 max-w-full">
      <div className={`relative w-full overflow-hidden shrink-0 ${isLarge ? 'h-56 sm:h-72 lg:h-[350px]' : 'h-48 sm:h-52'}`}>
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
        <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-wider shadow-sm rounded-sm">
          {article.category}
        </span>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
        <Link href={`/berita/${article.slug}`}>
          <h4 className={`font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-2 sm:mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug ${isLarge ? 'text-xl sm:text-2xl lg:text-[26px]' : 'text-[17px] sm:text-[19px]'}`}>
            {article.title}
          </h4>
        </Link>
        <p className={`text-gray-500 dark:text-gray-400 mb-4 sm:mb-5 leading-relaxed break-words ${isLarge ? 'text-sm sm:text-[15px] line-clamp-3' : 'text-xs sm:text-[13px] line-clamp-2'}`}>
          {stripHtmlAndTruncate(article.content, isLarge ? 200 : 120)}
        </p>
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
          <span className="truncate flex items-center gap-1.5"><Clock className="w-3 h-3 text-red-600" /> {formatDate(article.createdAt)}</span>
          {/* 🔥 DITAMBAHKAN VIEWS & COMMENTS 🔥 */}
          <div className="shrink-0 flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.views || 0}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {article.commentCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // DESAIN 2: KARTU LIST PANJANG (Gambar Kiri Besar, Teks Kanan)
  // ==========================================
  const renderListCard = (article: Article) => (
    <div key={article.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-transparent py-4 sm:py-5 border-b border-gray-100 dark:border-gray-800/60 last:border-0 group min-w-0 max-w-full">
      <div className="relative w-full sm:w-[240px] md:w-[280px] shrink-0 h-48 sm:h-auto sm:aspect-[4/3] rounded-xl overflow-hidden shadow-sm">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 640px) 100vw, 280px" />
        <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider rounded-sm shadow">
          {article.category}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center py-1 sm:py-2 min-w-0">
        <Link href={`/berita/${article.slug}`}>
          <h4 className="text-[18px] sm:text-[22px] font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-2 sm:mb-3 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h4>
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2 sm:mb-3">
          <span className="text-red-600 shrink-0">BY <span className="font-bold">{article.kredit?.penulis || 'REDAKSI'}</span></span>
          <span className="flex items-center gap-1.5 shrink-0"><Clock className="w-3 h-3" /> {formatDate(article.createdAt)}</span>
          {/* 🔥 DITAMBAHKAN VIEWS & COMMENTS 🔥 */}
          <span className="flex items-center gap-1.5 shrink-0"><Eye className="w-3 h-3" /> {article.views || 0}</span>
          <span className="flex items-center gap-1.5 shrink-0"><MessageSquare className="w-3 h-3" /> {article.commentCount || 0}</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed line-clamp-2 sm:line-clamp-3 break-words">
          {stripHtmlAndTruncate(article.content, 180)}
        </p>
        <div className="mt-auto">
          <Link href={`/berita/${article.slug}`} className="inline-block border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-4 py-1.5 uppercase hover:bg-[#0f2136] hover:text-white dark:hover:bg-yellow-500 dark:hover:border-yellow-500 dark:hover:text-[#0f2136] transition-colors rounded">
            Read More
          </Link>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // DESAIN 3: KARTU LIST MINI (Gambar Kiri Kecil, Teks Kanan)
  // ==========================================
  const renderHorizontalMiniCard = (article: Article) => (
    <Link href={`/berita/${article.slug}`} key={article.id} className="group flex items-start gap-3 sm:gap-4 bg-transparent hover:bg-white dark:hover:bg-[#0d1520] p-2 sm:p-3 rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800/60 overflow-hidden w-full max-w-full">
      <div className="relative w-24 sm:w-28 md:w-[120px] aspect-[4/3] rounded-lg overflow-hidden shrink-0 shadow-sm">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100px, 120px" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <h4 className="text-[13px] sm:text-[15px] font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-1.5 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-tight">
          {article.title}
        </h4>
        <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] mb-2 line-clamp-2 leading-relaxed break-words">
          {stripHtmlAndTruncate(article.content, 60)}
        </div>
        <div className="flex items-center gap-2 text-[9px] text-gray-400 uppercase tracking-widest mt-auto font-bold">
          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {formatDate(article.createdAt)}</span>
          {/* 🔥 DITAMBAHKAN VIEWS 🔥 */}
          <span className="flex items-center gap-1 ml-auto"><Eye className="w-2.5 h-2.5" /> {article.views || 0}</span>
        </div>
      </div>
    </Link>
  );

  // ==========================================
  // DESAIN 4: KARTU GRID MINI 3 KOLOM (Nalar Tempaan)
  // ==========================================
  const renderGridMiniCard = (article: Article) => (
    <Link href={`/berita/${article.slug}`} key={article.id} className="group flex flex-col gap-2.5 w-full min-w-0 max-w-full">
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-sm">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
        <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-wider rounded-sm">
          {article.category}
        </span>
      </div>
      <h4 className="text-[15px] sm:text-[17px] font-bold font-serif text-[#0f2136] dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug px-1">
        {article.title}
      </h4>
      <div className="flex items-center justify-between text-[9px] text-gray-500 px-1 font-medium tracking-wider">
        <span className="flex items-center gap-1.5"><Clock className="w-2.5 h-2.5 text-gray-400" /> {formatDate(article.createdAt)}</span>
        {/* 🔥 DITAMBAHKAN VIEWS & COMMENTS 🔥 */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {article.views || 0}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> {article.commentCount || 0}</span>
        </div>
      </div>
    </Link>
  );


  return (
    <main className="max-w-[1300px] w-full mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col xl:flex-row gap-8 md:gap-10 overflow-x-hidden min-w-0 max-w-[100vw] box-border">
      
      <div className="w-full xl:w-[70%] space-y-12 md:space-y-16 min-w-0 max-w-full overflow-hidden">
        
        {/* HEADLINE UTAMA (HERO) */}
        {headline && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="group w-full max-w-full mb-4">
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl md:shadow-2xl border border-gray-100 dark:border-gray-800">
              <Image src={headline.imageUrl} alt={headline.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 70vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-5 sm:p-8 md:p-10 w-full min-w-0 flex flex-col justify-end">
                <span className="bg-yellow-500 text-[#0f2136] text-[10px] font-black px-3 py-1 uppercase tracking-widest shadow-sm rounded-sm w-max mb-3">
                  SOROTAN UTAMA
                </span>
                <Link href={`/berita/${headline.slug}`} className="w-full block">
                  <h2 className="text-xl sm:text-3xl md:text-[40px] leading-tight md:leading-[1.2] font-serif font-black text-white group-hover:text-yellow-400 transition-colors line-clamp-2 sm:line-clamp-3 break-words w-full">
                    {headline.title}
                  </h2>
                </Link>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base mt-2 sm:mt-4 font-normal leading-relaxed w-full break-words hidden sm:block">
                  {stripHtmlAndTruncate(headline.content, 200)}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-xs text-gray-300 mt-4 sm:mt-6 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 truncate"><User className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> <span className="truncate">{headline.kredit?.penulis || 'Redaksi'}</span></span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-yellow-500" /> {formatDate(headline.createdAt)}</span>
                  {/* 🔥 DITAMBAHKAN VIEWS & COMMENTS DI HERO 🔥 */}
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-yellow-500" /> {headline.views || 0}</span>
                  <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-yellow-500" /> {headline.commentCount || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* LOGIKA PENYUSUNAN DESAIN KANAL BERBEDA-BEDA */}
        {CATEGORIES.map((cat, index) => {
          const categoryArticles = restArticles.filter(a => a.category === cat.name);
          if (categoryArticles.length === 0) return null;

          return (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="w-full max-w-full min-w-0">
              
              {/* JUDUL KANAL */}
              <div className="border-b-[3px] border-gray-200 dark:border-gray-800 pb-2 mb-6 md:mb-8 flex items-center relative">
                <div className="absolute -bottom-[3px] left-0 w-24 md:w-32 h-[3px] bg-red-600"></div>
                <h3 className="font-sans text-[#0f2136] dark:text-white font-black text-[18px] md:text-[22px] tracking-wide uppercase truncate">{cat.name}</h3>
              </div>
              
              {/* DESAIN 1: Kanal Ke-1 (Bararasa) - 1 Kiri Besar + 3 Kanan Mini */}
              {index === 0 && (
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full">
                  <div className="w-full md:w-[60%] min-w-0">
                    {renderStandardCard(categoryArticles[0], true)}
                  </div>
                  <div className="w-full md:w-[40%] flex flex-col gap-1 sm:gap-2 min-w-0 bg-gray-50/50 dark:bg-[#15202b]/30 p-2 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <h4 className="text-[12px] text-gray-500 font-bold uppercase tracking-widest px-2 mb-2">Terpopuler di {cat.name}</h4>
                    {categoryArticles.slice(1, 4).map(article => renderHorizontalMiniCard(article))}
                  </div>
                </div>
              )}

              {/* DESAIN 2: Kanal Ke-2 (Kabar Dari Kawah) - List Horizontal ala Olahraga */}
              {index === 1 && (
                <div className="flex flex-col w-full">
                  {categoryArticles.slice(0, 4).map(article => renderListCard(article))}
                </div>
              )}

              {/* DESAIN 3: Kanal Ke-3 (Mutiara Chondro) - Grid 2 Kolom ala Pariwisata */}
              {index === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10 w-full">
                  {categoryArticles.slice(0, 4).map(article => renderStandardCard(article))}
                </div>
              )}

              {/* DESAIN 4: Kanal Ke-4 (Nalar Tempaan) - Grid Mini 3 Kolom ala Asli Malang */}
              {index === 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 w-full">
                  {categoryArticles.slice(0, 6).map(article => renderGridMiniCard(article))}
                </div>
              )}

              {/* TOMBOL LIHAT LAINNYA */}
              <div className="mt-8 md:mt-10 border-t border-gray-100 dark:border-gray-800/80 pt-6">
                <Link href={cat.path} className="flex justify-center items-center w-full py-3 sm:py-3.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:bg-[#0f2136] hover:text-white dark:hover:bg-yellow-500 dark:hover:border-yellow-500 dark:hover:text-[#0f2136] transition-colors rounded-sm text-center">
                  LOAD MORE {cat.name}
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SIDEBAR */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full xl:w-[30%] xl:sticky top-28 self-start min-w-0 max-w-full overflow-hidden">
        <Sidebar menuName="Terkini & Populer" />
      </motion.div>
    </main>
  );
}