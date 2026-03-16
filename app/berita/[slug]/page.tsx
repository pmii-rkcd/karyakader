// app/berita/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link'; // Ditambahkan untuk penanda kategori
import { useParams, useRouter } from 'next/navigation';

// Mendefinisikan tipe data artikel
interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  authorEmail: string;
  createdAt: any;
}

export default function DetailBerita() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug; // Mengambil slug dari URL

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      try {
        // Mencari artikel di Firestore yang 'slug'-nya cocok dengan URL
        const q = query(collection(db, 'articles'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Jika ketemu, ambil data dokumen pertama
          const docData = querySnapshot.docs[0];
          setArticle({ id: docData.id, ...docData.data() } as Article);
        } else {
          // Jika tidak ada berita dengan slug tersebut
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

  // Tampilan jika berita tidak ditemukan (Error 404 manual)
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

  // Memformat tanggal Firebase (Timestamp) menjadi teks yang mudah dibaca
  const formattedDate = article.createdAt?.toDate 
    ? article.createdAt.toDate().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Tanggal tidak diketahui';

  return (
    <main className="min-h-screen bg-white pb-12">
      {/* Navigasi Atas (Disesuaikan dengan warna tema PMII) */}
      <nav className="bg-[#0f2136] text-white py-4 shadow-md border-b-2 border-yellow-500">
        <div className="container mx-auto px-4 max-w-4xl">
          <button onClick={() => router.push('/')} className="hover:text-yellow-400 transition flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
            &larr; Beranda
          </button>
        </div>
      </nav>

      {/* Konten Artikel */}
      <article className="container mx-auto px-4 max-w-3xl mt-8">
        
        {/* === PENANDA MERAH / BREADCRUMB DI SINI === */}
        <div className="flex items-center gap-2 text-xs mb-6 font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-3">
          <Link href="/" className="hover:text-[#0f2136] transition-colors">Beranda</Link>
          <span className="text-gray-300">/</span>
          {/* Warna oranye-merah menggunakan class text-[#f97316] */}
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
            Oleh <span className="font-semibold text-gray-800">Redaksi Karya Kader</span> • {formattedDate}
          </p>
        </div>

        {/* Gambar Utama */}
        <div className="relative w-full h-64 md:h-[450px] mb-10 rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <Image 
            src={article.imageUrl} 
            alt={article.title}
            fill
            className="object-cover"
            priority // Memprioritaskan loading gambar ini karena ada di atas (above the fold)
          />
        </div>

        {/* Teks Berita (Menggunakan dangerouslySetInnerHTML untuk merender Rich Text Quill) */}
        <div 
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed marker:text-yellow-500 prose-a:text-blue-600 hover:prose-a:text-blue-800"
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />
      </article>
    </main>
  );
}