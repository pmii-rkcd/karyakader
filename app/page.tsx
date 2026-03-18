// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';

// Tambahkan tipe kredit, views, dan commentCount di Interface
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imageUrl: string;
  authorEmail: string;
  createdAt: any;
  views?: number; 
  commentCount?: number;
  kredit?: {
    penulis: string;
    editor: string;
    fotografer: string;
    sumber: string;
  };
}

const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  let text = htmlString.replace(/<[^>]*>?/gm, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
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

  const headline = articles.length > 0 ? articles[0] : null;
  const restArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col lg:flex-row gap-10">
      
      {/* KOLOM KIRI */}
      <div className="w-full lg:w-2/3 space-y-12">
        
        {/* HEADLINE UTAMA */}
        {headline ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="group cursor-pointer">
            <div className="relative w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-lg mb-2">
              <Image src={headline.imageUrl} alt={headline.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1727] via-[#0a1727]/70 to-transparent"></div>
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
                
                {/* INFO METADATA HEADLINE (Penulis, Views, Komentar) */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-4 font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    {headline.kredit?.penulis || 'Redaksi'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    {headline.views || 0} Kali
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                    {headline.commentCount || 0} Komentar
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white shadow-sm">
            <p className="text-2xl font-serif text-gray-400 font-medium">Belum ada berita dipublikasikan.</p>
          </div>
        )}

        {/* KATEGORI BAWAH */}
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
                      
                      {/* INFO METADATA BAWAH (Penulis, Views, Komentar) */}
                      <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                          <span className="flex items-center gap-1 truncate w-1/2">
                            <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            <span className="truncate">{article.kredit?.penulis || 'Redaksi'}</span>
                          </span>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="flex items-center gap-1" title={`${article.views || 0} kali dibaca`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                              {article.views || 0}
                            </span>
                            <span className="flex items-center gap-1" title={`${article.commentCount || 0} komentar`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                              {article.commentCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right mt-4">
                <Link href={cat.path} className="inline-block text-sm font-bold text-gray-500 hover:text-yellow-600 transition uppercase tracking-widest bg-gray-50 px-4 py-2 rounded">
                  Lihat Berita {cat.name} Lainnya &raquo;
                </Link>
              </div>
            </motion.div>
          );
        })}

      </div>

      {/* KOLOM KANAN */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full lg:w-1/3">
        <Sidebar menuName="Terkini & Populer" />
      </motion.div>
      
    </main>
  );
}