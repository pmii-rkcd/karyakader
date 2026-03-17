// app/ClientLayout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login');
  
  const [settings, setSettings] = useState<any>({});
  const [aboutSettings, setAboutSettings] = useState<any>({});

  useEffect(() => {
    if (isAdminPage) return;
    const fetchSettings = async () => {
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
      if (generalSnap.exists()) setSettings(generalSnap.data());
      if (aboutSnap.exists()) setAboutSettings(aboutSnap.data());
    };
    fetchSettings();
  }, [isAdminPage]);

  if (isAdminPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* TOP BAR - Responsif: gap disesuaikan, flex-wrap agar tidak bertumpuk di HP super kecil */}
      <div className="bg-[#0f2136] text-gray-300 text-[10px] md:text-xs py-2 px-4 md:px-8 flex flex-wrap justify-between items-center border-b border-gray-700 gap-2">
        <div className="flex items-center gap-2">
          <span>📅 {currentDate}</span>
        </div>
        <div className="flex items-center gap-4">
          {settings.instagram ? <a href={settings.instagram} target="_blank" className="hover:text-white cursor-pointer">IG</a> : <span className="hover:text-white cursor-pointer">IG</span>}
          {settings.youtube ? <a href={settings.youtube} target="_blank" className="hover:text-white cursor-pointer">YT</a> : <span className="hover:text-white cursor-pointer">YT</span>}
          {settings.tiktok ? <a href={settings.tiktok} target="_blank" className="hover:text-white cursor-pointer">TK</a> : <span className="hover:text-white cursor-pointer">TK</span>}
          {settings.linkedin ? <a href={settings.linkedin} target="_blank" className="hover:text-white cursor-pointer">IN</a> : <span className="hover:text-white cursor-pointer">IN</span>}
        </div>
      </div>

      {/* HEADER - Responsif: Search bar jadi full width di HP */}
      <header className="bg-white py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 md:gap-0">
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0f2136] rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-[10px] md:text-xs text-center p-1 shrink-0">
            LOGO<br/>PMII
          </div>
          <div className="text-center md:text-left">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#0f2136] tracking-wide">
              {settings.webName || 'KARYA KADER'}
            </h1>
            <div className="bg-[#0f2136] text-yellow-500 text-[9px] md:text-[10px] px-2 py-0.5 mt-1 rounded-sm font-bold inline-block uppercase tracking-wider">
              {settings.tagline || 'PR. PMII "KAWAH" CHONDRODIMUKO'}
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex items-center justify-center">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Cari berita..." 
              className="bg-gray-100 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2136] w-full border border-gray-200"
            />
            <span className="absolute right-3 top-2 text-gray-500 cursor-pointer">🔍</span>
          </div>
        </div>
      </header>

      {/* NAVBAR - Responsif: Bisa di-scroll menyamping (swipe) di HP tanpa terlipat */}
      <nav className="bg-[#0f2136] text-white py-3 px-4 md:px-8 border-b-4 border-yellow-500 shadow-md sticky top-0 z-50 overflow-x-auto hide-scrollbar">
        <ul className="flex flex-nowrap md:flex-wrap gap-6 text-sm font-semibold uppercase tracking-wider w-max md:w-auto">
          <li><Link href="/" className="hover:text-yellow-400 transition whitespace-nowrap">Beranda</Link></li>
          <li><Link href="/bararasa" className="hover:text-yellow-400 transition whitespace-nowrap">Bararasa</Link></li>
          <li><Link href="/kabar" className="hover:text-yellow-400 transition whitespace-nowrap">Kabar Dari Kawah</Link></li>
          <li><Link href="/mutiara" className="hover:text-yellow-400 transition whitespace-nowrap">Mutiara Chondro</Link></li>
          <li><Link href="/nalar" className="hover:text-yellow-400 transition whitespace-nowrap">Nalar Tempaan</Link></li>
          <li><Link href="/tentang" className="hover:text-yellow-400 transition whitespace-nowrap">Tentang Kami</Link></li>
        </ul>
      </nav>

      {/* MAIN CONTENT */}
      <div className="min-h-screen">
        {children}
      </div>

      {/* FOOTER (Otomatis menyusun ke bawah berkat grid-cols-1 bawaan Tailwind) */}
      <footer className="bg-[#0a1727] text-gray-300 py-12 px-4 md:px-8 border-t-4 border-yellow-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#0f2136] rounded-full border border-yellow-500 flex items-center justify-center text-xs text-yellow-500">Logo</div>
                <div>
                  <h3 className="text-yellow-500 font-bold text-lg font-serif">{settings.webName || 'KARYA KADER'}</h3>
                  <p className="text-[10px] uppercase tracking-wider">Website Resmi</p>
                </div>
            </div>
            <p className="italic text-sm mb-4">"Dzikir, Fikir, Amal Sholeh"</p>
            <div className="border-t border-gray-700 pt-4 text-sm break-words">
              <p className="font-bold text-white mb-1">SEKRETARIAT:</p>
              <p className="text-gray-400 mb-2">{aboutSettings.address || 'Jl. Joyo Tamansari 1 No.41, Malang'}</p>
              <p>📧 {settings.email || 'pmiirkcd@gmail.com'}</p>
              <p>📞 {settings.phone || '6285748203760'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">IKUTI KAMI</h3>
            <ul className="space-y-3 text-sm">
              {settings.instagram ? <li><a href={settings.instagram} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">📷</span> Instagram</a></li> : <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">📷</span> Instagram</li>}
              {settings.youtube ? <li><a href={settings.youtube} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">▶</span> YouTube</a></li> : <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">▶</span> YouTube</li>}
              {settings.tiktok ? <li><a href={settings.tiktok} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">🎵</span> TikTok</a></li> : <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">🎵</span> TikTok</li>}
              {settings.linkedin ? <li><a href={settings.linkedin} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">💼</span> LinkedIn</a></li> : <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">💼</span> LinkedIn</li>}
            </ul>
          </div>

          <div>
            <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">KANAL</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-yellow-400">🏠 Beranda</Link></li>
              <li><Link href="/tentang" className="hover:text-yellow-400">👥 Tentang Kami</Link></li>
              <li><Link href="/bararasa" className="hover:text-yellow-400">📁 Bararasa</Link></li>
              <li><Link href="/kabar" className="hover:text-yellow-400">📁 Kabar Dari Kawah</Link></li>
              <li><Link href="/mutiara" className="hover:text-yellow-400">📁 Mutiara Chondro</Link></li>
              <li><Link href="/nalar" className="hover:text-yellow-400">📁 Nalar Tempaan</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">REDAKSI</h3>
            <div className="bg-[#0f2136] p-4 rounded-lg border border-gray-700">
              <h4 className="text-white font-bold mb-2">Ingin Berkontribusi?</h4>
              <p className="text-sm text-gray-400 mb-4">Kirimkan tulisan, opini, atau liputan kegiatanmu ke redaksi kami.</p>
              <a href={`https://wa.me/${settings.phone || '6285748203760'}`} target="_blank" className="w-full bg-yellow-500 text-[#0f2136] font-bold py-2 px-4 rounded hover:bg-yellow-400 transition flex justify-center items-center gap-2 text-sm text-center">
                Hubungi Redaksi 🚀
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-gray-500 text-center md:text-left gap-2 md:gap-0">
          <p>© {new Date().getFullYear()} <span className="text-yellow-500">JPP</span>. All rights reserved.</p>
          <p className="uppercase tracking-widest">{settings.tagline || 'PR. PMII "KAWAH" CHONDRODIMUKO'}</p>
        </div>
      </footer>
    </div>
  );
}