// app/tentang/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';

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
           <div className="w-12 h-12 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin mx-auto mb-4 shadow-lg"></div>
           <p className="text-sm font-serif font-bold tracking-widest uppercase text-[#0f2136]">Memuat Profil...</p>
         </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-20">
      
      {/* HEADER HERO */}
      <div className="bg-[#0f2136] text-white py-20 px-4 text-center border-b-4 border-yellow-500 relative overflow-hidden">
        {/* Dekorasi Latar */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute w-64 h-64 border-4 border-white rounded-full -top-10 -left-10"></div>
          <div className="absolute w-96 h-96 border-4 border-white rounded-full -bottom-20 -right-20"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-yellow-500 mb-6 tracking-wide uppercase drop-shadow-md">
            Tentang Kami
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed">
            {about?.description || 'Portal berita resmi pergerakan dan literasi mahasiswa. Menyajikan informasi teraktual, kajian mendalam, dan opini tajam dari para kader.'}
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-16 space-y-20">
        
        {/* VISI & MISI */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="bg-gray-50 p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
            <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-3xl mb-6 shadow-md">🎯</div>
            <h2 className="text-3xl font-serif font-bold text-[#0f2136] mb-4">Visi</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
              {about?.visi || 'Belum ada data visi yang diisi dari dashboard.'}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#0f2136] text-white p-8 md:p-10 rounded-2xl shadow-md border-b-4 border-yellow-500 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-3xl mb-6 border border-gray-600 shadow-md">🚀</div>
            <h2 className="text-3xl font-serif font-bold text-yellow-500 mb-4">Misi</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
              {about?.misi || 'Belum ada data misi yang diisi dari dashboard.'}
            </p>
          </motion.div>
        </section>

        {/* SUSUNAN REDAKSI */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="pt-10 border-t border-gray-100"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0f2136] uppercase tracking-widest">Susunan Redaksi</h2>
            <div className="w-24 h-1.5 bg-yellow-500 mx-auto mt-6 rounded-full"></div>
            <p className="text-gray-500 mt-4 text-md">Tim di balik layar yang menggerakkan literasi portal Karya Kader.</p>
          </div>

          {redaksi.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Data redaksi belum ditambahkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {redaksi.map((member, index) => (
                <motion.div 
                  key={member.id} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group text-center"
                >
                  <div className="relative w-44 h-44 mx-auto mb-5 rounded-full overflow-hidden border-4 border-gray-100 shadow-md group-hover:border-yellow-500 group-hover:shadow-xl transition-all duration-300">
                    <Image 
                      src={member.imageUrl} 
                      alt={member.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-[#0f2136] group-hover:text-blue-700 transition-colors">{member.name}</h3>
                  <p className="text-sm font-extrabold text-yellow-600 uppercase tracking-widest mt-1.5">{member.role}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* LOKASI / PETA */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="pt-10 border-t border-gray-100"
        >
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-md flex flex-col md:flex-row hover:shadow-lg transition-shadow duration-300">
            <div className="p-8 md:p-12 md:w-1/3 flex flex-col justify-center bg-white z-10">
              <h2 className="text-3xl font-serif font-bold text-[#0f2136] mb-6 flex items-center gap-3">
                <span className="text-yellow-500">📍</span> Sekretariat
              </h2>
              <p className="text-gray-600 mb-8 text-md leading-relaxed font-medium">
                {about?.address || 'Jl. Joyo Tamansari 1 No.41, Merjosari, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144'}
              </p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(about?.address || 'Malang')}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#0f2136] text-white px-8 py-4 rounded-lg font-bold text-sm hover:bg-yellow-500 hover:text-[#0f2136] transition shadow-md w-max uppercase tracking-widest"
              >
                Buka di Maps &rarr;
              </a>
            </div>
            <div className="md:w-2/3 h-80 md:h-auto bg-gray-200 relative">
              {about?.mapUrl ? (
                <iframe 
                  src={about.mapUrl} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, minHeight: '100%' }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium border-l border-gray-200">
                  Peta belum diatur di dashboard admin.
                </div>
              )}
            </div>
          </div>
        </motion.section>

      </div>
    </main>
  );
}