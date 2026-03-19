// app/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

// Import Swiper untuk Slider Poster
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

// 🚀 IMPORT LUCIDE ICONS
import { CalendarDays, Compass, ExternalLink, Image as ImageIcon, Info } from 'lucide-react';

interface Agenda {
  id: string; title: string; date: string; imageUrl: string; linkInfo: string;
}

interface PosterData {
  url: string; link: string;
}

// === KOMPONEN HITUNG MUNDUR (Desain Modern) ===
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
    <div className="flex gap-2 text-center mt-4 justify-center">
      <div className="bg-gray-50 dark:bg-[#15202b] border border-gray-200 dark:border-gray-800 text-[#0f2136] dark:text-gray-200 rounded-xl p-2 w-[55px] shadow-sm flex flex-col items-center justify-center transition-colors">
        <span className="font-black text-lg leading-none">{timeLeft.days}</span>
        <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 mt-1">Hari</span>
      </div>
      <div className="bg-gray-50 dark:bg-[#15202b] border border-gray-200 dark:border-gray-800 text-[#0f2136] dark:text-gray-200 rounded-xl p-2 w-[55px] shadow-sm flex flex-col items-center justify-center transition-colors">
        <span className="font-black text-lg leading-none">{timeLeft.hours}</span>
        <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 mt-1">Jam</span>
      </div>
      <div className="bg-gray-50 dark:bg-[#15202b] border border-gray-200 dark:border-gray-800 text-[#0f2136] dark:text-gray-200 rounded-xl p-2 w-[55px] shadow-sm flex flex-col items-center justify-center transition-colors">
        <span className="font-black text-lg leading-none">{timeLeft.mins}</span>
        <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 mt-1">Mnt</span>
      </div>
      <div className="bg-yellow-500 border border-yellow-400 text-[#0f2136] rounded-xl p-2 w-[55px] shadow-md flex flex-col items-center justify-center">
        <span className="font-black text-lg leading-none">{timeLeft.secs}</span>
        <span className="text-[9px] uppercase tracking-wider font-black mt-1">Dtk</span>
      </div>
    </div>
  );
};

// === KOMPONEN UTAMA SIDEBAR ===
export default function Sidebar({ menuName }: { menuName: string }) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [posters, setPosters] = useState<PosterData[]>([]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      // 1. Ambil Data Poster
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      if (generalSnap.exists()) {
        const data = generalSnap.data();
        if (data.posters && data.posters.length > 0) {
          setPosters(data.posters);
        } else if (data.posterUrl) { 
          setPosters([{ url: data.posterUrl, link: data.posterLink || '#' }]);
        }
      }

      // 2. Ambil Data Agenda Terdekat
      try {
        const q = query(collection(db, 'agendas'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedAgendas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const upcoming = fetchedAgendas.filter(a => {
          const agendaDate = new Date(a.date);
          return agendaDate.getTime() >= yesterday.getTime();
        });
        
        setAgendas(upcoming.slice(0, 3));
      } catch (error) {
        console.log("Koleksi Agenda mungkin belum dibuat", error);
      }
    };
    
    fetchSidebarData();
  }, [menuName]);

  return (
    <aside className="w-full space-y-8 sticky top-24 font-sans">
      
      {/* PENGUMUMAN MENU SPESIFIK (Desain Premium) */}
      <div className="bg-gradient-to-br from-[#0f2136] to-[#1a365d] dark:from-black dark:to-[#0a0f18] text-white rounded-2xl p-6 shadow-xl border border-gray-800 relative overflow-hidden group transition-colors duration-500">
        <Compass className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
        <div className="relative z-10">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-yellow-500" /> Sedang Mengeksplorasi
          </p>
          <h3 className="font-serif font-black text-yellow-500 uppercase tracking-wide text-xl leading-tight">
            {menuName}
          </h3>
        </div>
      </div>

      {/* AGENDA RAYON */}
      <div className="bg-white dark:bg-[#0d1520] border border-gray-100 dark:border-gray-800/60 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-3 bg-gray-50/50 dark:bg-black/20">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <CalendarDays className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h3 className="font-serif text-[#0f2136] dark:text-white font-black text-lg tracking-wide uppercase">
            Agenda Terdekat
          </h3>
        </div>
        
        <div className="p-5 space-y-6">
          {agendas.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-[#15202b] transition-colors">
               <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Belum ada agenda terdekat.</p>
            </div>
          ) : (
            agendas.map((agenda) => (
              <div key={agenda.id} className="border border-gray-100 dark:border-gray-800/80 rounded-xl p-4 bg-white dark:bg-[#0a0f18] shadow-sm hover:shadow-md hover:border-yellow-500/30 transition-all duration-300 relative group">
                {agenda.imageUrl && (
                   <div className="w-full h-40 relative mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                     <Image src={agenda.imageUrl} alt={agenda.title} fill className="object-cover group-hover:scale-110 transition duration-700" />
                   </div>
                )}
                <h4 className="font-bold text-[#0f2136] dark:text-gray-100 text-base text-center line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
                  {agenda.title}
                </h4>
                <div className="flex justify-center items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    {new Date(agenda.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                <CountdownTimer targetDate={agenda.date} />
                
                {agenda.linkInfo && agenda.linkInfo !== '#' && (
                  <a href={agenda.linkInfo} target="_blank" rel="noopener noreferrer" className="mt-5 flex justify-center items-center gap-2 w-full bg-yellow-500 dark:bg-yellow-500/90 text-[#0f2136] text-[11px] font-black uppercase tracking-widest py-3 rounded-lg hover:bg-yellow-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    Info Selengkapnya <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* INFO / POSTER SLIDER */}
      <div className="bg-white dark:bg-[#0d1520] border border-gray-100 dark:border-gray-800/60 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-3 bg-gray-50/50 dark:bg-black/20">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <ImageIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h3 className="font-serif text-[#0f2136] dark:text-white font-black text-lg tracking-wide uppercase">
            Papan Info
          </h3>
        </div>
        
        <div className="p-5">
          {posters.length > 0 ? (
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 relative">
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={0}
                slidesPerView={1}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                pagination={{ clickable: true, dynamicBullets: true }}
                className="w-full"
              >
                {posters.map((poster, index) => {
                  const isValidLink = poster.link && poster.link !== '#' && poster.link.startsWith('http');
                  
                  const PosterContent = (
                    <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-[#15202b] overflow-hidden group">
                      <Image src={poster.url} alt={`Poster ${index+1}`} fill className="object-cover group-hover:scale-105 transition duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                      {isValidLink && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-4 flex justify-center items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <span className="flex items-center gap-2 text-yellow-400 font-bold text-[10px] tracking-widest uppercase bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
                             Klik untuk info <ExternalLink className="w-3 h-3" />
                           </span>
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <SwiperSlide key={index}>
                      {isValidLink ? (
                        <Link href={poster.link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                          {PosterContent}
                        </Link>
                      ) : (
                        PosterContent
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-[#15202b] rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors flex items-center justify-center">
               <div className="text-center p-4">
                 <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                 <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Poster publik belum diatur.</p>
               </div>
            </div>
          )}
        </div>
        
        {/* Helper text buat admin untuk Swiper CSS global */}
        <style jsx global>{`
          .swiper-pagination-bullet { background-color: #cbd5e1 !important; opacity: 1 !important; }
          .dark .swiper-pagination-bullet { background-color: #334155 !important; }
          .swiper-pagination-bullet-active { background-color: #eab308 !important; transform: scale(1.2); }
        `}</style>
      </div>

    </aside>
  );
}