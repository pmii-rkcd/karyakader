// app/ClientLayout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Deteksi apakah sedang di halaman admin/login
  const isAdminPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login');
  
  const [settings, setSettings] = useState<any>({});
  const [aboutSettings, setAboutSettings] = useState<any>({});

  // Ambil data pengaturan dari Firebase khusus untuk Header & Footer publik
  useEffect(() => {
    if (isAdminPage) return; // Jangan ambil data jika di admin agar cepat
    const fetchSettings = async () => {
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
      if (generalSnap.exists()) setSettings(generalSnap.data());
      if (aboutSnap.exists()) setAboutSettings(aboutSnap.data());
    };
    fetchSettings();
  }, [isAdminPage]);

  // Jika di halaman Admin/Login, tampilkan polosan (tanpa Header/Footer)
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Jika di halaman Publik, tampilkan desain lengkap
  const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen">
      {/* TOP BAR (Dinamis) */}
      <div className="bg-[#0f2136] text-gray-300 text-xs py-1 px-4 md:px-8 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2"><span>📅 {currentDate}</span></div>
        <div className="flex items-center gap-4">
          {settings.instagram && <a href={settings.instagram} target="_blank" className="hover:text-white">IG</a>}
          {settings.youtube && <a href={settings.youtube} target="_blank" className="hover:text-white">YT</a>}
          {settings.tiktok && <a href={settings.tiktok} target="_blank" className="hover:text-white">TK</a>}
          {settings.linkedin && <a href={settings.linkedin} target="_blank" className="hover:text-white">IN</a>}
        </div>
      </div>

      {/* HEADER (Dinamis) */}
      <header className="bg-white py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#0f2136] rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-xs text-center p-1">
            LOGO
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#0f2136] tracking-wide">
              {settings.webName || "KARYA KADER"}
            </h1>
            <div className="bg-[#0f2136] text-yellow-500 text-[10px] md:text-xs px-2 py-0.5 mt-1 rounded-sm font-bold inline-block uppercase tracking-wider">
              {settings.tagline || "PR. PMII KAWAH CHONDRODIMUKO"}
            </div>
          </div>
        </div>
      </header>

      {/* NAVBAR */}
      <nav className="bg-[#0f2136] text-white py-3 px-4 md:px-8 border-b-4 border-yellow-500 shadow-md sticky top-0 z-50">
        <ul className="flex flex-wrap gap-6 text-sm font-semibold uppercase tracking-wider">
          <li><Link href="/" className="hover:text-yellow-400 transition">Beranda</Link></li>
          <li><Link href="/bararasa" className="hover:text-yellow-400 transition">Bararasa</Link></li>
          <li><Link href="/kabar" className="hover:text-yellow-400 transition">Kabar Dari Kawah</Link></li>
          <li><Link href="/mutiara" className="hover:text-yellow-400 transition">Mutiara Chondro</Link></li>
          <li><Link href="/nalar" className="hover:text-yellow-400 transition">Nalar Tempaan</Link></li>
          <li><Link href="/tentang" className="hover:text-yellow-400 transition">Tentang Kami</Link></li>
        </ul>
      </nav>

      {/* KONTEN UTAMA HALAMAN */}
      <div className="flex-1 bg-gray-50">
        {children}
      </div>

      {/* FOOTER (Dinamis) */}
      <footer className="bg-[#0a1727] text-gray-300 py-12 px-4 md:px-8 border-t-4 border-yellow-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-yellow-500 font-bold text-lg font-serif">{settings.webName || "KARYA KADER"}</h3>
            <p className="italic text-sm mb-4">"Dzikir, Fikir, Amal Sholeh"</p>
            <div className="border-t border-gray-700 pt-4 text-sm">
              <p className="font-bold text-white mb-1">SEKRETARIAT:</p>
              <p className="text-gray-400 mb-2">{aboutSettings.address || "Jl. Joyo Tamansari 1 No.41, Malang"}</p>
              <p>📧 {settings.email || "pmiirkcd@gmail.com"}</p>
              <p>📞 {settings.phone || "6285748203760"}</p>
            </div>
          </div>
          <div>
             <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">IKUTI KAMI</h3>
             <ul className="space-y-3 text-sm">
               {settings.instagram && <li><a href={settings.instagram} target="_blank" className="hover:text-white">📷 Instagram</a></li>}
               {settings.youtube && <li><a href={settings.youtube} target="_blank" className="hover:text-white">▶ YouTube</a></li>}
               {settings.tiktok && <li><a href={settings.tiktok} target="_blank" className="hover:text-white">🎵 TikTok</a></li>}
             </ul>
          </div>
          <div>
             <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">KANAL</h3>
             <ul className="space-y-2 text-sm">
               <li><Link href="/" className="hover:text-yellow-400">🏠 Beranda</Link></li>
               <li><Link href="/tentang" className="hover:text-yellow-400">👥 Tentang Kami</Link></li>
             </ul>
          </div>
          <div>
            <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">REDAKSI</h3>
            <div className="bg-[#0f2136] p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-4">Kirimkan tulisan atau opini kegiatanmu ke redaksi kami.</p>
              <a href={`https://wa.me/${settings.phone || "6285748203760"}`} target="_blank" className="block text-center w-full bg-yellow-500 text-[#0f2136] font-bold py-2 px-4 rounded hover:bg-yellow-400">
                Hubungi Redaksi
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}