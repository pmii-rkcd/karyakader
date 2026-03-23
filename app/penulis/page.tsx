// app/penulis/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
// 🚀 IMPORT BARU UNTUK BACA PARAMETER PENCARIAN
import { useSearchParams } from 'next/navigation';
// 🚀 IMPORT LUCIDE ICONS
import { Loader2, Instagram, Linkedin, ArrowRight, PenTool, SearchX } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  instagram: string;
  linkedin: string;
  slug?: string; 
}

// ⚠️ KITA BUNGKUS KONTEN UTAMA DALAM KOMPONEN BARU 
function PenulisContent() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔥 TANGKAP KATA KUNCI PENCARIAN DARI URL (Misal: ?q=ahmad)
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('q')?.toLowerCase() || '';

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const q = query(collection(db, 'authors'));
        const querySnapshot = await getDocs(q);
        const fetchedAuthors = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Author[];
        
        setAuthors(fetchedAuthors);
      } catch (error) {
        console.error("Gagal mengambil data penulis:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  // 🔥 FILTER DATA PENULIS BERDASARKAN PENCARIAN (NAMA/PERAN/BIO)
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchQuery) ||
    author.role.toLowerCase().includes(searchQuery) ||
    author.bio.toLowerCase().includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] w-full">
         <div className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-xs font-bold tracking-widest uppercase text-[#0f2136] dark:text-gray-300">Memuat Daftar Penulis...</p>
         </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 min-h-screen bg-gray-50/50 dark:bg-[#0a0f18] transition-colors duration-500 w-full min-w-0">
      
      {/* HEADER HALAMAN */}
      <div className="text-center mb-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 mb-6 shadow-sm">
          <PenTool className="w-8 h-8" />
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-serif font-black text-[#0f2136] dark:text-white mb-4 uppercase tracking-wide drop-shadow-sm">
          {/* 🔥 UBAH JUDUL JIKA SEDANG MENCARI 🔥 */}
          {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : "Kader Penulis"}
        </motion.h1>
        
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="w-24 h-1.5 bg-yellow-500 mx-auto rounded-full shadow-sm mb-6"></motion.div>
        
        {/* Sembunyikan deskripsi jika sedang mencari */}
        {!searchQuery && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Mengenal lebih dekat para pemikir, kreator, dan penggerak literasi di balik setiap karya dan narasi PMII "Kawah" Chondrodimuko.
          </motion.p>
        )}
      </div>

      {/* GRID PENULIS */}
      {filteredAuthors.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0d1520] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center">
          <SearchX className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-xl font-serif text-gray-500 dark:text-gray-400">
            {searchQuery ? `Tidak ada penulis yang cocok dengan "${searchQuery}"` : "Belum ada profil penulis yang dipublikasikan."}
          </p>
          {searchQuery && (
            <Link href="/penulis" className="mt-6 px-6 py-2 bg-[#0f2136] text-white rounded-lg hover:bg-yellow-500 hover:text-[#0f2136] transition-colors text-sm font-bold">
              Kembali ke Daftar Penulis
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAuthors.map((author, index) => (
            <motion.div 
              key={author.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col items-center text-center p-6 relative"
            >
              {/* Latar Belakang Aksen */}
              <div className="absolute top-0 left-0 w-full h-24 bg-[#0f2136] dark:bg-black border-b-[3px] border-yellow-500 z-0"></div>

              {/* Foto Profil */}
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-[#0d1520] overflow-hidden shadow-md z-10 mt-6 mb-4 group-hover:scale-105 transition-transform duration-500 bg-gray-100">
                <Image 
                  src={author.imageUrl || 'https://via.placeholder.com/300?text=No+Photo'} 
                  alt={author.name} 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 768px) 120px, 150px"
                />
              </div>

              {/* Info Penulis */}
              <div className="flex flex-col flex-1 z-10 w-full">
                <h3 className="text-xl font-bold font-serif text-[#0f2136] dark:text-white group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors">
                  {author.name}
                </h3>
                <p className="text-xs font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-1 mb-4">
                  {author.role}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3 px-2">
                  {author.bio}
                </p>

                {/* Tombol Lihat Portofolio */}
                <div className="mt-auto w-full pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-4">
                  
                  {/* Media Sosial */}
                  <div className="flex justify-center gap-3">
                    {author.instagram && (
                      <a href={`https://instagram.com/${author.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-500/20 dark:hover:text-yellow-400 transition-colors">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {author.linkedin && (
                      <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Link 
                    href={`/penulis/${author.slug || author.id}`} 
                    className="w-full bg-[#0f2136] dark:bg-yellow-500 text-white dark:text-[#0f2136] font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-yellow-500 dark:hover:bg-yellow-400 hover:text-[#0f2136] transition-colors flex items-center justify-center gap-2"
                  >
                    Lihat Karya <ArrowRight className="w-4 h-4" />
                  </Link>

                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

// ⚠️ WAJIB: Bungkusan Suspense agar aman dari error peringatan Next.js soal useSearchParams
export default function DaftarPenulisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f18]"><Loader2 className="w-12 h-12 animate-spin text-yellow-500" /></div>}>
      <PenulisContent />
    </Suspense>
  );
}