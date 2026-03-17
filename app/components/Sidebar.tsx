// app/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';

interface Agenda {
  id: string;
  title: string;
  date: string; // Format YYYY-MM-DDTHH:mm
  imageUrl: string;
  linkInfo: string;
}

// === KOMPONEN HITUNG MUNDUR (COUNTDOWN) ===
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex gap-2 text-center mt-3 justify-center">
      <div className="bg-[#0f2136] text-white rounded p-1.5 w-10 shadow-sm"><div className="font-bold text-sm">{timeLeft.days}</div><div className="text-[8px] uppercase tracking-wider">Hari</div></div>
      <div className="bg-[#0f2136] text-white rounded p-1.5 w-10 shadow-sm"><div className="font-bold text-sm">{timeLeft.hours}</div><div className="text-[8px] uppercase tracking-wider">Jam</div></div>
      <div className="bg-[#0f2136] text-white rounded p-1.5 w-10 shadow-sm"><div className="font-bold text-sm">{timeLeft.mins}</div><div className="text-[8px] uppercase tracking-wider">Mnt</div></div>
      <div className="bg-yellow-500 text-[#0f2136] rounded p-1.5 w-10 shadow-sm"><div className="font-bold text-sm">{timeLeft.secs}</div><div className="text-[8px] uppercase tracking-wider font-bold">Dtk</div></div>
    </div>
  );
};

// === KOMPONEN UTAMA SIDEBAR ===
export default function Sidebar({ menuName }: { menuName: string }) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [poster, setPoster] = useState({ url: '', link: '' });

  useEffect(() => {
    const fetchSidebarData = async () => {
      // 1. Ambil Data Poster (HANYA MENGAMBIL 'GENERAL' AGAR GLOBAL/SERAGAM DI SEMUA MENU)
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      
      if (generalSnap.exists() && generalSnap.data().posterUrl) {
        setPoster({ 
          url: generalSnap.data().posterUrl, 
          link: generalSnap.data().posterLink || '#' 
        });
      } else {
        setPoster({ url: '', link: '' });
      }

      // 2. Ambil Data Agenda Terdekat
      try {
        const q = query(collection(db, 'agendas'), orderBy('date', 'asc'), limit(5));
        const querySnapshot = await getDocs(q);
        const fetchedAgendas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
        
        // Filter hanya agenda yang belum lewat hari H (H-1 masih ditampilkan)
        const upcoming = fetchedAgendas.filter(a => new Date(a.date).getTime() >= new Date().getTime() - (24 * 60 * 60 * 1000));
        
        // Ambil maksimal 3 agenda terdekat
        setAgendas(upcoming.slice(0, 3));
      } catch (error) {
        console.log("Koleksi Agenda mungkin belum dibuat", error);
      }
    };
    
    fetchSidebarData();
  }, [menuName]);

  // Validasi Link Poster agar tidak error di Next.js Link
  const isValidLink = poster.link && poster.link !== '#' && poster.link.startsWith('http');

  return (
    <aside className="w-full space-y-8 sticky top-24">
      
      {/* PENGUMUMAN MENU SPESIFIK */}
      <div className="bg-[#0f2136] text-white rounded-lg p-4 shadow-sm text-center border-b-4 border-yellow-500">
        <p className="text-xs text-gray-300">Anda sedang membaca kanal:</p>
        <h3 className="font-serif font-bold text-yellow-500 uppercase tracking-widest mt-1 text-lg">{menuName}</h3>
      </div>

      {/* AGENDA RAYON */}
      <div className="bg-white border-t-4 border-[#0f2136] rounded-b-lg shadow-sm border-x border-b border-gray-100 overflow-hidden">
        <h3 className="font-serif text-[#0f2136] font-extrabold text-sm p-4 uppercase border-b border-yellow-500 bg-gray-50 text-center tracking-wider">
          Agenda Terdekat
        </h3>
        <div className="p-4 space-y-6">
          {agendas.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
               <p className="text-xs text-gray-500 italic">Belum ada agenda terdekat.</p>
            </div>
          ) : (
            agendas.map((agenda) => (
              <div key={agenda.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition relative">
                {agenda.imageUrl && (
                   <div className="w-full h-32 relative mb-3 rounded overflow-hidden border border-gray-100">
                     <Image src={agenda.imageUrl} alt={agenda.title} fill className="object-cover hover:scale-105 transition duration-500" />
                   </div>
                )}
                <h4 className="font-bold text-[#0f2136] text-sm text-center line-clamp-2 leading-snug">{agenda.title}</h4>
                <p className="text-center text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                  📅 {new Date(agenda.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                
                {/* Komponen Hitung Mundur */}
                <CountdownTimer targetDate={agenda.date} />

                {agenda.linkInfo && agenda.linkInfo !== '#' && (
                  <a href={agenda.linkInfo} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-yellow-500 text-[#0f2136] text-xs font-bold py-2.5 rounded hover:bg-yellow-400 transition shadow-sm">
                    Info Selengkapnya &rarr;
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* INFO / POSTER (GLOBAL) */}
      <div className="bg-white border-t-4 border-yellow-500 rounded-b-lg p-4 shadow-sm border-x border-b border-gray-100">
        <h3 className="font-serif text-[#0f2136] font-extrabold text-sm mb-4 uppercase border-b border-[#0f2136] pb-2 text-center tracking-wider">
          Info / Poster
        </h3>
        
        {isValidLink ? (
          <Link href={poster.link} target="_blank" rel="noopener noreferrer">
            <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-md overflow-hidden hover:opacity-95 transition cursor-pointer shadow-sm group border border-gray-100">
              {poster.url ? (
                <Image src={poster.url} alt="Poster" fill className="object-cover group-hover:scale-105 transition duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
              ) : (
                <p className="text-xs text-gray-400 absolute inset-0 flex items-center justify-center">Belum ada poster.</p>
              )}
              {/* Overlay Link */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-yellow-400 font-bold text-[10px] text-center py-2.5 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest uppercase">
                Klik untuk info ↗
              </div>
            </div>
          </Link>
        ) : (
          <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-md overflow-hidden shadow-sm border border-gray-100">
            {poster.url ? (
              <Image src={poster.url} alt="Poster" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            ) : (
              <p className="text-xs text-gray-400 absolute inset-0 flex items-center justify-center text-center px-4 border border-dashed border-gray-300 m-2 rounded">Poster publik belum diatur.</p>
            )}
          </div>
        )}
      </div>

    </aside>
  );
}