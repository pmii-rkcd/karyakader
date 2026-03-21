// app/tentang/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';

// 🚀 IMPORT LUCIDE ICONS (Untuk nambah estetika)
import { Target, Rocket, Users, MapPin, ExternalLink, Loader2 } from 'lucide-react';

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
        const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
        if (aboutSnap.exists()) {
          setAbout(aboutSnap.data() as AboutData);
        }

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
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0a0f18] transition-colors duration-500 w-full overflow-hidden">
         <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="text-center flex flex-col items-center">
           <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
           <p className="text-[#0f2136] dark:text-gray-300 font-serif font-bold tracking-widest uppercase text-sm">Memuat Profil...</p>
         </motion.div>
      </div>
    );
  }

  return (
    // PERBAIKAN: Menambahkan dukungan dark mode (dark:bg-[#0a0f18]) dan overflow-x-hidden
    <main className="min-h-screen bg-white dark:bg-[#0a0f18] transition-colors duration-500 pb-20 font-sans min-w-0 max-w-[100vw] overflow-x-hidden">
      
      {/* HEADER HERO */}
      {/* PERBAIKAN: Menyesuaikan padding untuk mobile (py-14 sm:py-20) */}
      <div className="bg-[#0f2136] dark:bg-black text-white py-14 sm:py-20 px-4 text-center border-b-[3px] sm:border-b-4 border-yellow-500 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute w-40 h-40 sm:w-64 sm:h-64 border-2 sm:border-4 border-white rounded-full -top-10 -left-10"></div>
          <div className="absolute w-60 h-60 sm:w-96 sm:h-96 border-2 sm:border-4 border-white rounded-full -bottom-10 sm:-bottom-20 -right-10 sm:-right-20"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          {/* PERBAIKAN: Ukuran font judul lebih dinamis (text-3xl sm:text-4xl md:text-5xl) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-yellow-500 mb-4 sm:mb-6 tracking-wide uppercase drop-shadow-md">
            Tentang Kami
          </h1>
          {/* PERBAIKAN: Ukuran font deskripsi lebih ramah baca di HP (text-base sm:text-lg) */}
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-light leading-relaxed px-2 sm:px-0">
            {about?.description || 'Portal berita resmi pergerakan dan literasi mahasiswa. Menyajikan informasi teraktual, kajian mendalam, dan opini tajam dari para kader.'}
          </p>
        </motion.div>
      </div>

      {/* PERBAIKAN: Margin top untuk mobile diperkecil (mt-10 sm:mt-16) dan jarak antar section (space-y-14 sm:space-y-20) */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10 sm:mt-16 space-y-14 sm:space-y-20 min-w-0">
        
        {/* VISI & MISI */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            // PERBAIKAN: Mendukung dark mode untuk kotak Visi
            className="bg-gray-50 dark:bg-[#0d1520] p-6 sm:p-8 md:p-10 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-500 rounded-full flex items-center justify-center mb-5 sm:mb-6 shadow-md">
              <Target className="w-6 h-6 sm:w-7 sm:h-7 text-[#0f2136]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0f2136] dark:text-white mb-3 sm:mb-4">Visi</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
              {about?.visi || 'Belum ada data visi yang diisi dari dashboard.'}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            // PERBAIKAN: Kotak Misi lebih konsisten dengan tema dark
            className="bg-[#0f2136] dark:bg-[#15202b] text-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-md border-b-[3px] sm:border-b-4 border-yellow-500 hover:shadow-xl transition-all duration-300 border border-transparent dark:border-gray-800"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-full flex items-center justify-center mb-5 sm:mb-6 border border-white/20 shadow-md">
               <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-yellow-500 mb-3 sm:mb-4">Misi</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
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
          className="pt-10 border-t border-gray-100 dark:border-gray-800/80"
        >
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#0f2136] dark:text-white uppercase tracking-widest flex items-center justify-center gap-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" /> Susunan Redaksi
            </h2>
            <div className="w-16 sm:w-24 h-1.5 bg-yellow-500 mx-auto mt-4 sm:mt-6 rounded-full"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-3 sm:mt-4 text-sm sm:text-base px-4">Tim di balik layar yang menggerakkan literasi portal Karya Kader.</p>
          </div>

          {redaksi.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic bg-gray-50 dark:bg-[#0d1520] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              Data redaksi belum ditambahkan.
            </div>
          ) : (
            // PERBAIKAN: Mengatur Grid responsif. 2 kolom untuk HP, 3 untuk Tablet, 4 untuk PC
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8 md:gap-10">
              {redaksi.map((member, index) => (
                <motion.div 
                  key={member.id} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group text-center flex flex-col items-center"
                >
                  {/* PERBAIKAN: Ukuran foto dinamis, tidak kaku di w-44 */}
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-4 sm:mb-5 rounded-full overflow-hidden border-[3px] sm:border-4 border-gray-100 dark:border-gray-800 shadow-sm group-hover:border-yellow-500 dark:group-hover:border-yellow-500 group-hover:shadow-lg transition-all duration-300">
                    <Image 
                      src={member.imageUrl} 
                      alt={member.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, 250px"
                    />
                  </div>
                  {/* PERBAIKAN: Teks nama dan peran diatur agar tidak pecah dan rapi */}
                  <h3 className="text-sm sm:text-lg md:text-xl font-bold font-serif text-[#0f2136] dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-yellow-400 transition-colors px-1 leading-snug">
                    {member.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-1.5 px-2">
                    {member.role}
                  </p>
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
          className="pt-10 border-t border-gray-100 dark:border-gray-800/80"
        >
          <div className="bg-gray-50 dark:bg-[#0d1520] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md flex flex-col md:flex-row hover:shadow-lg transition-all duration-300">
            {/* PERBAIKAN: Teks lokasi menyesuaikan dark mode */}
            <div className="p-6 sm:p-8 md:p-12 md:w-1/3 flex flex-col justify-center bg-white dark:bg-[#15202b] z-10">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0f2136] dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" /> Sekretariat
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed font-medium">
                {about?.address || 'Jl. Joyo Tamansari 1 No.41, Merjosari, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144'}
              </p>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(about?.address || 'Malang')}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 justify-center bg-[#0f2136] dark:bg-yellow-500 text-white dark:text-[#0f2136] px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-bold text-xs sm:text-sm hover:bg-yellow-500 dark:hover:bg-yellow-400 hover:text-[#0f2136] transition-all shadow-md w-full sm:w-max uppercase tracking-widest group"
              >
                Buka di Maps <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
            
            {/* PERBAIKAN: Peta tinggi disesuaikan di layar HP (h-64) */}
            <div className="w-full md:w-2/3 h-64 sm:h-80 md:h-auto bg-gray-200 dark:bg-gray-800 relative border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
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
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs sm:text-sm font-medium">
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