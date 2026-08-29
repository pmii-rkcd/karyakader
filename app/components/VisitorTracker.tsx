'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef('');

  useEffect(() => {
    if (!pathname) return;

    // Halaman admin dan login tidak masuk statistik pengunjung publik.
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) return;

    // Mencegah React Strict Mode mengirim halaman yang sama dua kali.
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    const controller = new AbortController();

    fetch('/api/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {
      // Kegagalan statistik tidak boleh mengganggu tampilan website.
    });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
