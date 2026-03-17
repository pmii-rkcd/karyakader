// app/dashboard/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Gagal logout', error);
    }
  };

  // Daftar Menu di Sidebar Admin
  const navItems = [
    { name: '📝 Tulis Berita', path: '/dashboard' },
    { name: '📅 Agenda Rayon', path: '/dashboard/agenda' },
    { name: '👥 Susunan Redaksi', path: '/dashboard/redaksi' },
    { name: '⚙️ Header & Footer', path: '/dashboard/settings/header-footer' },
    { name: '🖼️ Sidebar Pengunjung', path: '/dashboard/settings/sidebar' },
    { name: '🏢 Tentang Kami', path: '/dashboard/settings/tentang' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      
      {/* SIDEBAR ADMIN (KIRI) */}
      <aside className="w-64 bg-[#0f2136] text-white flex flex-col shadow-xl hidden md:flex fixed h-screen z-50">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-500 font-serif tracking-wider">KARYA KADER</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Panel Redaksi</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} 
                className={`block px-4 py-3 rounded-lg text-sm font-semibold transition duration-200 ${
                  isActive 
                    ? 'bg-yellow-500 text-[#0f2136] shadow-md' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <Link href="/" className="block w-full text-center px-4 py-2 mb-2 text-xs font-bold text-blue-400 hover:bg-gray-800 rounded-lg transition border border-blue-900">
            👁️ Lihat Website
          </Link>
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 font-bold hover:bg-gray-800 rounded-lg transition">
            🚪 Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA (KANAN) */}
      <main className="flex-1 md:ml-64 w-full h-screen overflow-y-auto">
        {/* Header Mobile (Hanya muncul di HP) */}
        <div className="md:hidden bg-[#0f2136] text-white p-4 flex justify-between items-center shadow-md">
          <h2 className="font-serif font-bold text-yellow-500">KARYA KADER Admin</h2>
          <button onClick={handleLogout} className="text-xs text-red-400">Logout</button>
        </div>
        
        {/* Render halaman aktif di sini */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}