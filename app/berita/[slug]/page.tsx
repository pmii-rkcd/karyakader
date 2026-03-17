// app/berita/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Mendefinisikan tipe data artikel (Diperbarui dengan field baru)
interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  authorEmail: string;
  createdAt: any;
  dateline?: string;
  tags?: string[];
  kredit?: {
    penulis: string;
    editor: string;
    fotografer: string;
    sumber: string;
  };
}

export default function DetailBerita() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      try {
        const q = query(collection(db, 'articles'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          setArticle({ id: docData.id, ...docData.data() } as Article);
        } else {
          setArticle(null);
        }
      } catch (error) {
        console.error("Gagal mengambil berita:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
         <div className="text-center">
           <div className="w-12 h-12 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-sm font-serif font-bold tracking-widest uppercase text-[#0f2136]">Memuat Artikel...</p>
         </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Berita tidak ditemukan</h1>
        <button 
          onClick={() => router.push('/')} 
          className="text-[#0f2136] font-bold hover:text-yellow-500 transition"
        >
          &larr; Kembali ke Beranda
        </button>
      </div>
    );
  }

  const formattedDate = article.createdAt?.toDate 
    ? article.createdAt.toDate().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Tanggal tidak diketahui';

  // Menyisipkan Dateline ke awal paragraf pertama dengan gaya Jurnalistik
  let displayContent = article.content;
  if (article.dateline) {
    // Mencari tag <p> pertama dan memasukkan tulisan dateline tebal di dalamnya
    displayContent = article.content.replace(
      /<p[^>]*>/i, 
      (match) => `${match}<strong class="uppercase text-[#0f2136]">${article.dateline}</strong> &mdash; `
    );
  }

  return (
    <main className="min-h-screen bg-white pb-12">
      {/* Navigasi Atas */}
      <nav className="bg-[#0f2136] text-white py-4 shadow-md border-b-2 border-yellow-500">
        <div className="container mx-auto px-4 max-w-4xl">
          <button onClick={() => router.push('/')} className="hover:text-yellow-400 transition flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
            &larr; Beranda
          </button>
        </div>
      </nav>

      {/* Konten Artikel */}
      <article className="container mx-auto px-4 max-w-3xl mt-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6 font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-3">
          <Link href="/" className="hover:text-[#0f2136] transition-colors">Beranda</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#f97316] font-extrabold">
            {article.category}
          </span>
        </div>

        {/* Header Artikel */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-serif font-extrabold text-[#0f2136] mt-2 mb-4 leading-tight">
            {article.title}
          </h1>
          <p className="text-gray-500 text-sm">
            Oleh <span className="font-semibold text-gray-800">{article.kredit?.penulis || 'Redaksi Karya Kader'}</span> • {formattedDate}
          </p>
        </div>

        {/* Gambar Utama */}
        <div className="relative w-full h-64 md:h-[450px] mb-10 rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <Image 
            src={article.imageUrl} 
            alt={article.title}
            fill
            className="object-cover"
            priority 
          />
        </div>

        {/* Teks Berita */}
        <div 
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed marker:text-yellow-500 prose-a:text-blue-600 hover:prose-a:text-blue-800"
          dangerouslySetInnerHTML={{ __html: displayContent }} 
        />

        {/* === AREA TAGS DAN KREDIT REDAKSI === */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map((tag, index) => (
                <span key={index} className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-sm uppercase tracking-wider hover:bg-yellow-100 hover:text-yellow-800 transition cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Susunan Kredit */}
          {article.kredit && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-sm">
              <h4 className="font-bold text-[#0f2136] mb-4 uppercase tracking-widest text-xs border-b border-gray-200 pb-2 flex items-center gap-2">
                👥 Kredit Redaksi
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700">
                {article.kredit.penulis && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Penulis</span>
                    <span className="font-semibold">{article.kredit.penulis}</span>
                  </div>
                )}
                {article.kredit.editor && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Editor</span>
                    <span className="font-semibold">{article.kredit.editor}</span>
                  </div>
                )}
                {article.kredit.fotografer && article.kredit.fotografer !== '-' && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Fotografer</span>
                    <span className="font-semibold">{article.kredit.fotografer}</span>
                  </div>
                )}
                {article.kredit.sumber && article.kredit.sumber !== '-' && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Sumber</span>
                    <span className="font-semibold">{article.kredit.sumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </article>
    </main>
  );
}