// app/tentang/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

export default function TentangKamiPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [general, setGeneral] = useState({ agenda: '', posterUrl: '' });
  const [about, setAbout] = useState({ description: '', visi: '', misi: '', address: '', mapUrl: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesSnap, generalSnap, aboutSnap] = await Promise.all([
          getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc'))),
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'about'))
        ]);

        setArticles(articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (generalSnap.exists()) setGeneral(generalSnap.data() as any);
        if (aboutSnap.exists()) setAbout(aboutSnap.data() as any);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 bg-gray-50/50">
      
      {/* HEADER HALAMAN */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#0f2136] mb-2">Tentang Kami</h1>
        <p className="text-gray-500">Mengenal lebih dekat Portal Berita Karya Kader.</p>
        <div className="w-full h-px bg-gray-200 mt-6"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* KOLOM KIRI (Konten Utama) */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* Card 1: Visi Misi */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-700 mb-6 leading-relaxed">
              {about.description || "Selamat datang di Portal Berita Karya Kader. Platform ini didirikan sebagai wadah kreativitas dan informasi bagi seluruh kader."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-lg">
                <h4 className="font-bold text-[#0f2136] mb-2 flex items-center gap-2">🚀 Visi Kami</h4>
                <p className="text-sm text-gray-700">{about.visi || "Menjadi media digital terdepan yang mencerahkan."}</p>
              </div>
              <div className="bg-green-50/50 border border-green-100 p-5 rounded-lg">
                <h4 className="font-bold text-[#0f2136] mb-2 flex items-center gap-2">🎯 Misi Kami</h4>
                <p className="text-sm text-gray-700">{about.misi || "Menyajikan berita berimbang dan mewadahi karya kader."}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Lokasi */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-[#0f2136] mb-4 flex items-center gap-2">
              📍 Lokasi Sekretariat
            </h3>
            <div className="w-full h-px bg-gray-100 mb-4"></div>
            <p className="text-sm text-gray-600 mb-4">{about.address || "Jl. Joyo Tamansari 1 No.41, Merjosari, Kec. Lowokwaru, Kota Malang"}</p>
            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
              {about.mapUrl ? (
                <iframe src={about.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Peta belum diatur</div>
              )}
            </div>
          </div>

          {/* Card 3: Susunan Redaksi (Statik Sementara) */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-[#0f2136] mb-4">Susunan Redaksi</h3>
            <div className="w-full h-px bg-gray-100 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contoh Anggota Redaksi */}
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                <div className="w-12 h-12 bg-[#0f2136] rounded-full flex items-center justify-center text-yellow-500 font-bold">ED</div>
                <div>
                  <h4 className="font-bold text-[#0f2136] text-sm">Redaksi Kawah</h4>
                  <p className="text-xs text-blue-600">Editor & Publisher</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* KOLOM KANAN (Sidebar Persis Beranda) */}
        <aside className="w-full lg:w-1/3 space-y-8">
          <div className="bg-white border-t-4 border-[#0f2136] rounded-b-lg p-6 shadow-sm border-x border-b border-gray-100">
            <h3 className="font-serif text-[#0f2136] font-extrabold text-sm mb-4 uppercase border-b border-yellow-500 pb-2">
              Agenda Rayon
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">{general.agenda || "Belum ada agenda."}</div>
          </div>

          <div className="bg-white border-t-4 border-yellow-500 rounded-b-lg p-6 shadow-sm border-x border-b border-gray-100">
            <h3 className="font-serif text-[#0f2136] font-extrabold text-sm mb-4 uppercase border-b border-[#0f2136] pb-2">
              Info / Poster
            </h3>
            <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-md overflow-hidden">
              {general.posterUrl ? (
                <Image src={general.posterUrl} alt="Poster" fill className="object-cover" />
              ) : (
                <p className="text-xs text-gray-400 absolute inset-0 flex items-center justify-center">Belum ada poster.</p>
              )}
            </div>
          </div>

          <div className="bg-white border-t-4 border-[#0f2136] rounded-b-lg p-6 shadow-sm border-x border-b border-gray-100">
            <h3 className="font-serif text-[#0f2136] font-extrabold text-sm mb-4 uppercase border-b border-yellow-500 pb-2">
              Paling Dibaca
            </h3>
            <div className="space-y-4">
              {articles.slice(0, 4).map((article, index) => (
                 <Link href={`/berita/${article.slug}`} key={article.id} className="flex gap-3 group">
                   <h4 className="text-sm font-semibold text-gray-700 group-hover:text-[#0f2136] line-clamp-2 leading-snug">
                     {article.title}
                   </h4>
                 </Link>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}