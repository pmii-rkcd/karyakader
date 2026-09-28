'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, Home, LogOut, ShieldCheck } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function InventoryAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribeAuth: (() => void) | undefined;

    async function checkInventorySession() {
      try {
        const response = await fetch('/api/inventory-session', { cache: 'no-store' });
        const data = await response.json();
        if (data.ok) {
          if (active) setChecking(false);
          return true;
        }
      } catch {}
      return false;
    }

    checkInventorySession().then(hasInventorySession => {
      if (hasInventorySession) return;

      unsubscribeAuth = onAuthStateChanged(auth, async user => {
        if (!user) {
          if (active) router.replace('/login');
          return;
        }

        try {
          const adminSnapshot = await getDoc(doc(db, 'admins', user.uid));
          if (!adminSnapshot.exists() || adminSnapshot.data()?.role !== 'admin') {
            await signOut(auth);
            if (active) router.replace('/login?error=unauthorized');
            return;
          }
          if (active) setChecking(false);
        } catch {
          await signOut(auth);
          if (active) router.replace('/login?error=unauthorized');
        }
      });

    });

    return () => {
      active = false;
      unsubscribeAuth?.();
    };
  }, [router]);

  async function logout() {
    await fetch('/api/inventory-session', { method: 'DELETE' });
    if (auth.currentUser) await signOut(auth);
    router.replace('/login');
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-[#07111f] px-4 text-white">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500 text-[#0f2136]"><ShieldCheck className="h-8 w-8 animate-pulse" /></div>
        <h1 className="mt-5 font-serif text-xl font-black">Memeriksa Akses Inventaris</h1>
        <p className="mt-2 text-sm text-gray-400">Mohon tunggu sebentar...</p>
      </div>
    </div>;
  }

  return <div className="min-h-screen bg-gray-50 text-gray-900">
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-[#07111f] text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500 text-[#0f2136]"><Archive className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Admin Khusus</p>
            <h1 className="font-serif text-xl font-black">Inventaris Rahasia</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-white/10"><Home className="h-4 w-4" />Lihat Website</Link>
          <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10"><LogOut className="h-4 w-4" />Keluar</button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
  </div>;
}
