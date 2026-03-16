// app/dashboard/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Untuk mengetahui halaman mana yang sedang aktif

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/login');
      else setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Memuat...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-[#0f2136] text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold font-serif text-yellow-500">DASHBOARD REDAKSI</h1>
          <p className="text-xs text-gray-400 mt-1">Karya Kader PMII</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/dashboard" 
            className={`block px-4 py-3 rounded-md transition ${pathname === '/dashboard' ? 'bg-yellow-500 text-[#0f2136] font-bold' : 'hover:bg-gray-800'}`}
          >
            📝 Tulis Berita
          </Link>
          <Link 
            href="/dashboard/settings" 
            className={`block px-4 py-3 rounded-md transition ${pathname === '/dashboard/settings' ? 'bg-yellow-500 text-[#0f2136] font-bold' : 'hover:bg-gray-800'}`}
          >
            ⚙️ Pengaturan Web
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition">
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Area Konten Dinamis */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}