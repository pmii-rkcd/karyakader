// app/penulis/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
// 🚀 PERBAIKAN: PenTool sudah ditambahkan ke dalam daftar import di bawah ini
import { Loader2, Instagram, Linkedin, ArrowLeft, Clock, Eye, User, FileText, PenTool } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  instagram: string;
  linkedin: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imageUrl: string;
  createdAt: any;
  views?: number;
  kredit?: { penulis: string };
}

const stripHtmlAndTruncate = (htmlString: string, maxLength: number = 130) => {
  if (!htmlString) return '';
  let text = htmlString.replace(/<\/?[^>]+(>|$)/g, " ").replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  if (text.length > maxLength) return text.substring(0, maxLength) + '...';
  return text;
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DetailPenulisPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Ambil Data Profil Penulis
        const authorRef = doc(db, 'authors', id);
        const authorSnap = await getDoc(authorRef);
        
        if (authorSnap.exists()) {
          const authorData = { id: authorSnap.id, ...authorSnap.data() } as Author;
          setAuthor(authorData);

          // 2. Ambil Berita yang ditulis oleh penulis ini
          const articlesQuery = query(
            collection(db, 'articles'),
            where('kredit.penulis', '==', authorData.name)
          );
          
          const articlesSnap = await getDocs(articlesQuery);
          const fetchedArticles = articlesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Article))
            .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            
          setArticles(fetchedArticles);
        }
      } catch (error) {
        console.error("Gagal mengambil data portofolio:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] w-full">
         <div className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-xs font-bold tracking-widest uppercase text-[#0f2136] dark:text-gray-300">Menyusun Portofolio...</p>
         </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] w-full flex-col gap-4">
        <h2 className="text-2xl font-serif font-bold text-gray-500">Penulis Tidak Ditemukan</h2>
        <Link href="/penulis" className="text-yellow-600 font-bold flex items-center gap-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Penulis
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-[1300px] mx-auto px-4 md:px-8 py-8 md:py-12 min-h-screen w-full min-w-0">
      
      <Link href="/penulis" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-yellow-600 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Daftar Penulis
      </Link>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 w-full">
        
        {/* KOLOM KIRI: Profil Penulis */}
        <div className="w-full lg:w-[35%] shrink-0">
          <div className="sticky top-32 bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-lg">
            <div className="relative w-40 h-40 mx-auto rounded-full border-[4px] border-yellow-500 overflow-hidden mb-6 shadow-md bg-gray-50">
              <Image 
                src={author.imageUrl || 'https://via.placeholder.com/300?text=No+Photo'} 
                alt={author.name} 
                fill 
                className="object-cover"
                sizes="160px"
              />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black font-serif text-[#0f2136] dark:text-white mb-2 leading-tight">
              {author.name}
            </h1>
            <p className="inline-block bg-[#0f2136] text-yellow-500 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded uppercase tracking-widest mb-6">
              {author.role}
            </p>
            
            <div className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-8 text-left border-l-4 border-yellow-500 pl-4 italic">
              "{author.bio}"
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex justify-center gap-4">
              {author.instagram && (
                <a href={`https://instagram.com/${author.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-yellow-500 hover:text-[#0f2136] transition-colors shadow-sm">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {author.linkedin && (
                <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-yellow-500 hover:text-[#0f2136] transition-colors shadow-sm">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Daftar Karya/Berita */}
        <div className="w-full lg:w-[65%] min-w-0">
          <div className="flex items-center gap-3 border-b-[3px] border-gray-200 dark:border-gray-800 pb-3 mb-8 relative">
            <div className="absolute -bottom-[3px] left-0 w-24 h-[3px] bg-red-600"></div>
            <FileText className="w-6 h-6 text-[#0f2136] dark:text-white" />
            <h2 className="font-sans text-[#0f2136] dark:text-white font-black text-xl md:text-2xl tracking-wide uppercase">
              Portofolio Karya ({articles.length})
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <PenTool className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Belum ada karya tulis yang dipublikasikan oleh penulis ini.</p>
              <p className="text-xs text-gray-400 mt-2">Pastikan nama penulis di berita sama persis dengan nama profil ini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {articles.map((article) => (
                <Link href={`/berita/${article.slug}`} key={article.id} className="group flex flex-col sm:flex-row gap-5 bg-white dark:bg-[#0d1520] p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800/60 hover:shadow-xl hover:border-yellow-500/50 transition-all duration-300 min-w-0">
                  <div className="relative w-full sm:w-[200px] md:w-[240px] aspect-[4/3] rounded-xl overflow-hidden shrink-0 shadow-sm">
                    <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 640px) 100vw, 240px" />
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider rounded-sm shadow">
                      {article.category}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="text-lg md:text-xl font-bold font-serif text-[#0f2136] dark:text-gray-100 mb-2 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4 leading-relaxed line-clamp-2 break-words">
                      {stripHtmlAndTruncate(article.content, 150)}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-3 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-t border-gray-100 dark:border-gray-800 pt-3">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-yellow-600" /> {formatDate(article.createdAt)}</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {article.views || 0} Dilihat</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}