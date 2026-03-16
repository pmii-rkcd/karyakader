import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Karya Kader - PR. PMII Kawah Chondrodimuko',
  description: 'Portal Berita Resmi PR. PMII Kawah Chondrodimuko',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-gray-50 text-gray-900`}>
        {/* TOP BAR */}
        <div className="bg-[#0f2136] text-gray-300 text-xs py-1 px-4 md:px-8 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span>📅 {currentDate}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Ikon Sosial Media (Bisa diganti dengan SVG asli/React Icons) */}
            <span className="hover:text-white cursor-pointer">IG</span>
            <span className="hover:text-white cursor-pointer">YT</span>
            <span className="hover:text-white cursor-pointer">TK</span>
            <span className="hover:text-white cursor-pointer">IN</span>
          </div>
        </div>

        {/* HEADER */}
        <header className="bg-white py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            {/* Placeholder Logo */}
            <div className="w-16 h-16 bg-[#0f2136] rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-xs text-center p-1">
              LOGO<br/>PMII
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0f2136] tracking-wide">KARYA KADER</h1>
              <div className="bg-[#0f2136] text-yellow-500 text-[10px] md:text-xs px-2 py-0.5 mt-1 rounded-sm font-bold inline-block uppercase tracking-wider">
                PR. PMII "KAWAH" CHONDRODIMUKO
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari berita..." 
                className="bg-gray-100 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2136] w-64"
              />
              <span className="absolute right-3 top-2.5 text-gray-500 cursor-pointer">🔍</span>
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

        {/* MAIN CONTENT */}
        <div className="min-h-screen">
          {children}
        </div>

        {/* FOOTER */}
        <footer className="bg-[#0a1727] text-gray-300 py-12 px-4 md:px-8 border-t-4 border-yellow-500">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Kolom 1: Profil */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-[#0f2136] rounded-full border border-yellow-500 flex items-center justify-center text-xs text-yellow-500">Logo</div>
                 <div>
                   <h3 className="text-yellow-500 font-bold text-lg font-serif">KARYA KADER</h3>
                   <p className="text-[10px] uppercase tracking-wider">Website Resmi</p>
                 </div>
              </div>
              <p className="italic text-sm mb-4">"Dzikir, Fikir, Amal Sholeh"</p>
              <div className="border-t border-gray-700 pt-4 text-sm">
                <p className="font-bold text-white mb-1">SEKRETARIAT:</p>
                <p className="text-gray-400 mb-2">Jl. Joyo Tamansari 1 No.41, Merjosari, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144</p>
                <p>📧 pmiirkcd@gmail.com</p>
                <p>📞 6285748203760</p>
              </div>
            </div>

            {/* Kolom 2: Sosial Media */}
            <div>
              <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">IKUTI KAMI</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">📷</span> Instagram</li>
                <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">▶</span> YouTube</li>
                <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">🎵</span> TikTok</li>
                <li className="flex items-center gap-2 cursor-pointer hover:text-white"><span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">💼</span> LinkedIn</li>
              </ul>
            </div>

            {/* Kolom 3: Kanal */}
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

            {/* Kolom 4: Redaksi */}
            <div>
              <h3 className="text-yellow-500 font-bold text-lg font-serif mb-4">REDAKSI</h3>
              <div className="bg-[#0f2136] p-4 rounded-lg border border-gray-700">
                <h4 className="text-white font-bold mb-2">Ingin Berkontribusi?</h4>
                <p className="text-sm text-gray-400 mb-4">Kirimkan tulisan, opini, atau liputan kegiatanmu ke redaksi kami.</p>
                <button className="w-full bg-yellow-500 text-[#0f2136] font-bold py-2 px-4 rounded hover:bg-yellow-400 transition flex justify-center items-center gap-2">
                  Hubungi Redaksi 🚀
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© 2026 <span className="text-yellow-500">Jurnalistik Penelitian dan Pengembangan</span>. All rights reserved.</p>
            <p className="mt-2 md:mt-0 uppercase tracking-widest">PR. PMII "KAWAH" CHONDRODIMUKO</p>
          </div>
        </footer>
      </body>
    </html>
  );
}