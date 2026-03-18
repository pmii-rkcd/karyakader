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
    // PERBAIKAN STICKY: Menghapus overflow-x-hidden agar sticky navbar bisa bekerja
    <div className="flex flex-col min-h-screen w-full">
      
      {/* TOP BAR - Icon Sosmed diubah menggunakan SVG elegan */}
      <div className="bg-[#0f2136] text-gray-300 text-[10px] md:text-xs py-2 px-4 md:px-8 flex flex-wrap justify-between items-center border-b border-gray-700 gap-2">
        <div className="flex items-center gap-2">
          <span>📅 {currentDate}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* ICON INSTAGRAM */}
          <a href={settings.instagram || '#'} target="_blank" className="hover:text-yellow-400 transition cursor-pointer flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          {/* ICON YOUTUBE */}
          <a href={settings.youtube || '#'} target="_blank" className="hover:text-yellow-400 transition cursor-pointer flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
          </a>
          {/* ICON TIKTOK */}
          <a href={settings.tiktok || '#'} target="_blank" className="hover:text-yellow-400 transition cursor-pointer flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
          </a>
          {/* ICON LINKEDIN */}
          <a href={settings.linkedin || '#'} target="_blank" className="hover:text-yellow-400 transition cursor-pointer flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>

      {/* HEADER - Fitur Logo Dinamis dari Firebase */}
      <header className="bg-white py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 md:gap-0 relative z-10">
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
          
          {/* LOGO DINAMIS */}
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo PMII" className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-yellow-500 shrink-0 shadow-sm" />
          ) : (
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0f2136] rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-[10px] md:text-xs text-center p-1 shrink-0 shadow-sm">
              LOGO<br/>PMII
            </div>
          )}

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
              className="bg-gray-100 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2136] w-full border border-gray-200 shadow-inner"
            />
            <span className="absolute right-3 top-2 text-gray-500 cursor-pointer">🔍</span>
          </div>
        </div>
      </header>

      {/* NAVBAR - Bagian inilah yang akan lengket (Sticky) di atas layar */}
      <nav className="bg-[#0f2136] text-white py-3 px-4 md:px-8 border-b-4 border-yellow-500 shadow-lg sticky top-0 z-50 overflow-x-auto hide-scrollbar">
        <ul className="flex flex-nowrap md:flex-wrap gap-6 text-sm font-semibold uppercase tracking-wider w-max md:w-auto mx-auto md:mx-0">
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

      {/* FOOTER */}
      <footer className="bg-[#0a1727] text-gray-300 py-12 px-4 md:px-8 border-t-4 border-yellow-500 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
                {/* LOGO FOOTER */}
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo PMII" className="w-10 h-10 rounded-full object-cover border border-yellow-500" />
                ) : (
                  <div className="w-10 h-10 bg-[#0f2136] rounded-full border border-yellow-500 flex items-center justify-center text-xs text-yellow-500">Logo</div>
                )}
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
              <li><a href={settings.instagram || '#'} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">📷</span> Instagram</a></li>
              <li><a href={settings.youtube || '#'} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">▶</span> YouTube</a></li>
              <li><a href={settings.tiktok || '#'} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">🎵</span> TikTok</a></li>
              <li><a href={settings.linkedin || '#'} target="_blank" className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">💼</span> LinkedIn</a></li>
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