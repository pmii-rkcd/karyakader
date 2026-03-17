// app/tentang/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

interface AboutData {
  description: string;
  visi: string;
  misi: string;
  address: string;
  mapUrl: string;
}

interface Redaksi {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export default function TentangPage() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [redaksi, setRedaksi] = useState<Redaksi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ambil data Pengaturan Tentang Kami (Visi, Misi, Deskripsi)
        const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
        if (aboutSnap.exists()) {
          setAbout(aboutSnap.data() as AboutData);
        }

        // 2. Ambil data Susunan Redaksi
        const q = query(collection(db, 'redaksi'), orderBy('createdAt', 'asc'));
        const redaksiSnap = await getDocs(q);
        setRedaksi(redaksiSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Redaksi)));
        
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center">
           <div className="w-12 h-12 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-sm font-serif font-bold tracking-widest uppercase text-[#0f2136]">Memuat Profil...</p>
         </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-20">
      
      {/* HEADER HERO */}
      <div className="bg-[#0f2136] text-white py-16 px-4 text-center border-b-4 border-yellow-500 relative overflow-hidden">
        {/* Dekorasi Latar */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute w-64 h-64 border-4 border-white rounded-full -top-10 -left-10"></div>
          <div className="absolute w-96 h-96 border-4 border-white rounded-full -bottom-20 -right-20"></div>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-yellow-500 mb-4 tracking-wide uppercase">
            Tentang Kami
          </h1>
          <p className="text-lg text-gray-300 font-light leading-relaxed">
            {about?.description || 'Portal berita resmi pergerakan dan literasi mahasiswa. Menyajikan informasi teraktual, kajian mendalam, dan opini tajam dari para kader.'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 space-y-16">
        
        {/* VISI & MISI */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-2xl mb-6 shadow-sm">🎯</div>
            <h2 className="text-2xl font-serif font-bold text-[#0f2136] mb-4">Visi</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {about?.visi || 'Belum ada data visi yang diisi dari dashboard.'}
            </p>
          </div>
          <div className="bg-[#0f2136] text-white p-8 rounded-2xl shadow-md border-b-4 border-yellow-500 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl mb-6 border border-gray-600">🚀</div>
            <h2 className="text-2xl font-serif font-bold text-yellow-500 mb-4">Misi</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {about?.misi || 'Belum ada data misi yang diisi dari dashboard.'}
            </p>
          </div>
        </section>

        {/* SUSUNAN REDAKSI */}
        <section className="pt-8 border-t border-gray-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-[#0f2136] uppercase tracking-widest">Susunan Redaksi</h2>
            <div className="w-20 h-1 bg-yellow-500 mx-auto mt-4 rounded-full"></div>
            <p className="text-gray-500 mt-4 text-sm">Tim di balik layar yang menggerakkan literasi portal Karya Kader.</p>
          </div>

          {redaksi.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
              Data redaksi belum ditambahkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {redaksi.map((member) => (
                <div key={member.id} className="group text-center">
                  <div className="relative w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm group-hover:border-yellow-500 transition-colors duration-300">
                    <Image 
                      src={member.imageUrl} 
                      alt={member.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-[#0f2136]">{member.name}</h3>
                  <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mt-1">{member.role}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LOKASI / PETA */}
        <section className="pt-8 border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex flex-col md:flex-row">
            <div className="p-8 md:w-1/3 flex flex-col justify-center">
              <h2 className="text-2xl font-serif font-bold text-[#0f2136] mb-4">Sekretariat</h2>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                {about?.address || 'Jl. Joyo Tamansari 1 No.41, Merjosari, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144'}
              </p>
              <a 
                href={about?.mapUrl ? `https://www.google.com/maps?q=${encodeURIComponent(about.address)}` : '#'} 
                target="_blank"
                className="inline-block bg-[#0f2136] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-yellow-500 hover:text-[#0f2136] transition shadow-md w-max"
              >
                📍 Buka di Maps
              </a>
            </div>
            <div className="md:w-2/3 h-64 md:h-auto bg-gray-200 relative">
              {about?.mapUrl ? (
                <iframe 
                  src={about.mapUrl} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, minHeight: '300px' }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Peta belum diatur di dashboard.
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}