// app/ClientLayout.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import ThemeProvider from './components/ThemeProvider';
// 🚀 IMPORT LUCIDE ICONS
import { Calendar, Search, Sun, Moon, MapPin, Mail, Phone, Instagram, Youtube, Linkedin, Send } from 'lucide-react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); 
  const isAdminPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login');
  
  const [settings, setSettings] = useState<any>({});
  const [aboutSettings, setAboutSettings] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAdminPage) return;
    const fetchSettings = async () => {
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
      if (generalSnap.exists()) setSettings(generalSnap.data());
      if (aboutSnap.exists()) setAboutSettings(aboutSnap.data());
    };
    fetchSettings();
  }, [isAdminPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isAdminPage) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>;
  }

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-[#0a0f18] transition-colors duration-500 font-sans">
      
      {/* === TOP BAR === */}
      <div className="bg-[#0f2136] dark:bg-black text-gray-300 text-[10px] md:text-xs py-2 px-4 md:px-8 flex flex-wrap justify-between items-center border-b border-gray-800 gap-2 transition-colors duration-500">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <Calendar className="w-3.5 h-3.5 text-yellow-500" />
          <span>{currentDate}</span>
        </div>
        
        <div className="flex items-center gap-4">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-yellow-500 text-gray-300 hover:text-[#0f2136] transition-all duration-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <div className="w-px h-4 bg-gray-700"></div> 
          <a href={settings.instagram || '#'} target="_blank" className="hover:text-yellow-400"><Instagram className="w-4 h-4" /></a>
          <a href={settings.youtube || '#'} target="_blank" className="hover:text-yellow-400"><Youtube className="w-4 h-4" /></a>
          <a href={settings.tiktok || '#'} target="_blank" className="hover:text-yellow-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
          </a>
          <a href={settings.linkedin || '#'} target="_blank" className="hover:text-yellow-400"><Linkedin className="w-4 h-4" /></a>
        </div>
      </div>

      {/* === HEADER === */}
      <header className="bg-white dark:bg-[#0d1520] py-5 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center shadow-sm dark:shadow-none dark:border-b dark:border-gray-800 gap-5 relative z-[60] transition-colors duration-500">
        <Link href="/" className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start group">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-yellow-500" />
          ) : (
            <div className="w-14 h-14 md:w-16 md:h-16 bg-[#0f2136] rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-[10px]">LOGO</div>
          )}
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-black text-[#0f2136] dark:text-white tracking-tight">{settings.webName || 'KARYA KADER'}</h1>
            <div className="bg-[#0f2136] text-yellow-500 text-[10px] px-2.5 py-1 mt-1 rounded font-bold uppercase tracking-widest">{settings.tagline || 'PR. PMII "KAWAH" CHONDRODIMUKO'}</div>
          </div>
        </Link>
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input type="text" placeholder="Cari berita..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-100 dark:bg-[#15202b] rounded-full py-2.5 px-5 pr-12 text-sm w-full focus:ring-2 focus:ring-yellow-500 outline-none transition-all" required />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500"><Search className="w-4 h-4" /></button>
        </form>
      </header>

      {/* === NAVBAR (Sticky) === */}
      <nav className="bg-[#0f2136]/95 dark:bg-[#0a0f18]/90 backdrop-blur-md text-white py-3 px-4 md:px-8 border-b-[3px] border-yellow-500 shadow-md sticky top-0 z-[50] transition-colors duration-500 overflow-x-auto hide-scrollbar">
        <ul className="flex flex-nowrap md:flex-wrap gap-1 md:gap-2 text-[13px] font-bold uppercase tracking-widest w-max md:w-auto">
          <li><Link href="/" className="hover:bg-white/10 hover:text-yellow-400 px-4 py-2 rounded-md inline-block whitespace-nowrap">Beranda</Link></li>
          <li><Link href="/bararasa" className="hover:bg-white/10 hover:text-yellow-400 px-4 py-2 rounded-md inline-block whitespace-nowrap">Bararasa</Link></li>
          <li><Link href="/kabar" className="hover:bg-white/10 hover:text-yellow-400 px-4 py-2 rounded-md inline-block whitespace-nowrap">Kabar Dari Kawah</Link></li>
          <li><Link href="/mutiara" className="hover:bg-white/10 hover:text-yellow-400 px-4 py-2 rounded-md inline-block whitespace-nowrap">Mutiara Chondro</Link></li>
          <li><Link href="/nalar" className="hover:bg-white/10 hover:text-yellow-400 px-4 py-2 rounded-md inline-block whitespace-nowrap">Nalar Tempaan</Link></li>
          <li><Link href="/tentang" className="hover:bg-white/10 hover:text-yellow-400 px-4 py-2 rounded-md inline-block whitespace-nowrap">Tentang Kami</Link></li>
        </ul>
      </nav>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex flex-col w-full relative">
        {children}
      </div>

      {/* === FOOTER === */}
      <footer className="bg-[#0a1727] dark:bg-[#05080f] text-gray-400 py-16 px-4 md:px-8 border-t-[4px] border-yellow-500 transition-colors duration-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
                {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 rounded-full border-2 border-yellow-500" /> : <div className="w-12 h-12 bg-[#0f2136] rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-[10px]">LOGO</div>}
                <div>
                  <h3 className="text-white font-black text-xl font-serif">{settings.webName || 'KARYA KADER'}</h3>
                  <p className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest">Portal Berita Resmi</p>
                </div>
            </div>
            <p className="italic text-sm border-l-2 border-gray-700 pl-3">"Dzikir, Fikir, Amal Sholeh"</p>
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-3"><MapPin className="w-4 h-4 text-yellow-500 shrink-0" /> <span>{aboutSettings.address || 'Jl. Joyo Tamansari 1 No.41, Merjosari, Malang'}</span></p>
              <p className="flex items-center gap-3"><Mail className="w-4 h-4 text-yellow-500 shrink-0" /> {settings.email || 'pmiirkcd@gmail.com'}</p>
              <p className="flex items-center gap-3"><Phone className="w-4 h-4 text-yellow-500 shrink-0" /> {settings.phone || '+62 857-4820-3760'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-6 flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Ikuti Kami</h3>
            <ul className="space-y-4 text-sm">
              <li><a href={settings.instagram || '#'} target="_blank" className="flex items-center gap-3 hover:text-yellow-400 transition-colors"><Instagram className="w-4 h-4" /> Instagram</a></li>
              <li><a href={settings.youtube || '#'} target="_blank" className="flex items-center gap-3 hover:text-yellow-400 transition-colors"><Youtube className="w-4 h-4" /> YouTube</a></li>
              <li><a href={settings.linkedin || '#'} target="_blank" className="flex items-center gap-3 hover:text-yellow-400 transition-colors"><Linkedin className="w-4 h-4" /> LinkedIn</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-6 flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Navigasi</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-yellow-400 transition-colors">Beranda</Link></li>
              <li><Link href="/bararasa" className="hover:text-yellow-400 transition-colors">Bararasa</Link></li>
              <li><Link href="/kabar" className="hover:text-yellow-400 transition-colors">Kabar Dari Kawah</Link></li>
              <li><Link href="/nalar" className="hover:text-yellow-400 transition-colors">Nalar Tempaan</Link></li>
              <li><Link href="/tentang" className="hover:text-yellow-400 transition-colors">Tentang Kami</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-6 flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Redaksi</h3>
            <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/50">
              <h4 className="text-white font-bold mb-2">Punya Tulisan Menarik?</h4>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">Kirimkan opini, puisi, atau liputan kegiatanmu untuk dipublikasikan.</p>
              <a href={`https://wa.me/${settings.phone || '6285748203760'}`} target="_blank" className="w-full bg-yellow-500 text-[#0f2136] font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition-colors flex justify-center items-center gap-2 text-sm">
                Hubungi Redaksi <Send className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 font-medium">
          <p>© {new Date().getFullYear()} <span className="text-white font-bold">Jurnalistik, Penelitian dan Pengembangan</span>. All rights reserved.</p>
          <p className="uppercase tracking-widest">{settings.tagline || 'PR. PMII "KAWAH" CHONDRODIMUKO'}</p>
        </div>
      </footer>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}