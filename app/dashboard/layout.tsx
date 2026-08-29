'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import {
  Menu,
  X,
  FileText,
  CalendarDays,
  Users,
  LayoutTemplate,
  PanelRight,
  Building,
  Home,
  LogOut,
  UserCheck,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Memeriksa apakah pengguna login dan terdaftar sebagai admin
  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isActive) {
          setIsCheckingAccess(true);
          router.replace('/login');
        }
        return;
      }

      try {
        const adminReference = doc(db, 'admins', user.uid);
        const adminSnapshot = await getDoc(adminReference);

        if (!adminSnapshot.exists()) {
          await signOut(auth);

          if (isActive) {
            router.replace('/login?error=unauthorized');
          }

          return;
        }

        if (isActive) {
          setIsCheckingAccess(false);
        }
      } catch (error) {
        console.error('Gagal memeriksa akses admin:', error);

        await signOut(auth);

        if (isActive) {
          router.replace('/login?error=unauthorized');
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [router]);

  // Tutup sidebar setiap berpindah halaman
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (window.confirm('Yakin ingin keluar dari panel admin?')) {
      try {
        await signOut(auth);
        router.replace('/login');
        router.refresh();
      } catch (error) {
        console.error('Gagal logout:', error);
      }
    }
  };

  const navItems = [
    {
      name: 'Manajemen Berita',
      path: '/dashboard',
      icon: FileText,
    },
    {
      name: 'Manajemen Penulis',
      path: '/dashboard/penulis',
      icon: UserCheck,
    },
    {
      name: 'Agenda Rayon',
      path: '/dashboard/agenda',
      icon: CalendarDays,
    },
    {
      name: 'Statistik Pengunjung',
      path: '/dashboard/statistik',
      icon: BarChart3,
    },
    {
      name: 'Susunan Redaksi',
      path: '/dashboard/redaksi',
      icon: Users,
    },
    {
      name: 'Header & Footer',
      path: '/dashboard/settings/header-footer',
      icon: LayoutTemplate,
    },
    {
      name: 'Sidebar Pengunjung',
      path: '/dashboard/settings/sidebar',
      icon: PanelRight,
    },
    {
      name: 'Tentang Kami',
      path: '/dashboard/settings/tentang',
      icon: Building,
    },
  ];

  // Dashboard tidak ditampilkan sebelum status admin dipastikan
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-[#0a1727] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500 text-[#0f2136] flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>

          <h1 className="mt-5 text-xl font-serif font-black text-white">
            Memeriksa Akses Admin
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Mohon tunggu sebentar...
          </p>

          <div className="mt-5 w-40 h-1.5 mx-auto bg-gray-800 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-yellow-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans overflow-hidden">

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1727] text-gray-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 bg-[#050b14] border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-yellow-500 font-serif tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              KARYA KADER
            </h2>

            <p className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-widest font-bold">
              Panel Redaksi
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-1"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar">
          <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Menu Utama
          </p>

          {navItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== '/dashboard' &&
                pathname.startsWith(item.path));

            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-yellow-500 text-[#0f2136] shadow-md'
                    : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#0f2136]' : 'text-gray-500'
                  }`}
                />

                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2 bg-[#0a1727] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 rounded-xl transition border border-transparent hover:border-blue-900/50"
          >
            <Home className="w-5 h-5" />
            Lihat Website
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 font-bold hover:bg-red-900/20 hover:text-red-300 rounded-xl transition border border-transparent hover:border-red-900/50"
          >
            <LogOut className="w-5 h-5" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 w-full h-screen flex flex-col overflow-hidden bg-gray-50 transition-all duration-300">

        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex justify-between items-center px-4 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-[#0f2136] hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label="Buka menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h2 className="font-serif font-black text-[#0f2136] text-lg tracking-wide">
              Dapur Redaksi
            </h2>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            aria-label="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-0 md:p-4">
          {children}
        </div>
      </main>
    </div>
  );
}