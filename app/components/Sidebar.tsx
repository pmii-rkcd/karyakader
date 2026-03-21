// app/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/effect-fade';

import { CalendarDays, Compass, ExternalLink, Image as ImageIcon, Info, ChevronRight, Clock } from 'lucide-react';

interface Agenda {
  id: string; title: string; date: string; imageUrl: string; linkInfo: string;
}

interface PosterData {
  url: string; link: string;
}

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
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    // PERBAIKAN MOBILE: Ukuran timer dikecilkan agar muat sejajar di HP
    <div className="flex gap-1.5 sm:gap-2 text-center mt-5 justify-center flex-wrap">
      <div className="bg-gray-50 dark:bg-[#15202b] border border-gray-200 dark:border-gray-700/50 text-[#0f2136] dark:text-gray-200 rounded-xl p-2 w-[50px] sm:w-[55px] shadow-sm flex flex-col items-center justify-center">
        <span className="font-black text-base sm:text-lg leading-none">{timeLeft.days}</span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-gray-500 mt-1">Hari</span>
      </div>
      <div className="bg-gray-50 dark:bg-[#15202b] border border-gray-200 dark:border-gray-700/50 text-[#0f2136] dark:text-gray-200 rounded-xl p-2 w-[50px] sm:w-[55px] shadow-sm flex flex-col items-center justify-center">
        <span className="font-black text-base sm:text-lg leading-none">{timeLeft.hours}</span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-gray-500 mt-1">Jam</span>
      </div>
      <div className="bg-gray-50 dark:bg-[#15202b] border border-gray-200 dark:border-gray-700/50 text-[#0f2136] dark:text-gray-200 rounded-xl p-2 w-[50px] sm:w-[55px] shadow-sm flex flex-col items-center justify-center">
        <span className="font-black text-base sm:text-lg leading-none">{timeLeft.mins}</span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-gray-500 mt-1">Mnt</span>
      </div>
      <div className="bg-yellow-500 border border-yellow-400 text-[#0f2136] rounded-xl p-2 w-[50px] sm:w-[55px] shadow-md flex flex-col items-center justify-center">
        <span className="font-black text-base sm:text-lg leading-none">{timeLeft.secs}</span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-black mt-1">Dtk</span>
      </div>
    </div>
  );
};

export default function Sidebar({ menuName }: { menuName: string }) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [posters, setPosters] = useState<PosterData[]>([]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      if (generalSnap.exists()) {
        const data = generalSnap.data();
        if (data.posters && data.posters.length > 0) {
          setPosters(data.posters);
        } else if (data.posterUrl) { 
          setPosters([{ url: data.posterUrl, link: data.posterLink || '#' }]);
        }
      }

      try {
        const q = query(collection(db, 'agendas'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedAgendas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
        
        const now = new Date().getTime();
        const activeAgendas = fetchedAgendas.filter(a => {
          const agendaTime = new Date(a.date).getTime();
          return agendaTime > now;
        });
        
        setAgendas(activeAgendas); 
      } catch (error) {
        console.log("Gagal memuat agenda", error);
      }
    };
    
    fetchSidebarData();
  }, [menuName]);

  return (
    // PERBAIKAN MOBILE: min-w-0 max-w-full overflow-hidden adalah kunci anti jebol kanan!
    <aside className="w-full space-y-6 sm:space-y-8 sticky top-24 font-sans pb-10 min-w-0 max-w-full overflow-hidden">
      
      {/* 1. PENGUMUMAN MENU */}
      <div className="bg-gradient-to-br from-[#0f2136] to-[#1a365d] dark:from-black dark:to-[#0a0f18] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-gray-800 relative overflow-hidden group transition-colors duration-500">
        <Compass className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
        <div className="relative z-10">
          <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500" /> Anda Sedang Membaca
          </p>
          <h3 className="font-serif font-black text-yellow-500 uppercase tracking-wide text-lg sm:text-xl leading-tight">
            {menuName}
          </h3>
        </div>
      </div>

      {/* 2. AGENDA RAYON */}
      <div className="bg-white dark:bg-[#0d1520] border border-gray-100 dark:border-gray-800/60 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden w-full">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h3 className="font-serif text-[#0f2136] dark:text-white font-black text-base sm:text-lg tracking-wide uppercase">
              Agenda Rayon
            </h3>
          </div>
          {agendas.length > 1 && (
             <span className="text-[9px] sm:text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded font-bold uppercase tracking-widest">
               {agendas.length} Acara
             </span>
          )}
        </div>
        
        <div className="p-0 w-full overflow-hidden">
          {agendas.length === 0 ? (
            <div className="text-center py-8 sm:py-10 m-4 sm:m-5 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-[#15202b]">
               <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
               <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Tidak Ada Agenda Terdekat</p>
            </div>
          ) : (
            <Swiper
              modules={[Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              pagination={{ clickable: true, dynamicBullets: true }}
              className="w-full agenda-swiper"
            >
              {agendas.map((agenda) => (
                <SwiperSlide key={agenda.id} className="w-full">
                  <div className="p-4 sm:p-5 pb-10 w-full box-border">
                    <div className="border border-gray-100 dark:border-gray-800/80 rounded-xl p-3 sm:p-4 bg-white dark:bg-[#0a0f18] shadow-sm w-full">
                      {agenda.imageUrl && (
                         <div className="w-full aspect-[4/3] sm:aspect-auto sm:h-40 relative mb-4 sm:mb-5 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                           <Image src={agenda.imageUrl} alt={agenda.title} fill className="object-cover hover:scale-105 transition duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                         </div>
                      )}
                      <h4 className="font-black text-[#0f2136] dark:text-gray-100 text-[15px] sm:text-[17px] text-center line-clamp-2 leading-snug">
                        {agenda.title}
                      </h4>
                      <div className="flex justify-center items-center mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg py-1.5 mx-auto w-full sm:max-w-[80%]">
                        <span className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 text-center px-2">
                          <CalendarDays className="w-3 h-3 text-yellow-500 shrink-0" />
                          {new Date(agenda.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <CountdownTimer targetDate={agenda.date} />
                      
                      {agenda.linkInfo && agenda.linkInfo !== '#' && (
                        <a href={agenda.linkInfo} target="_blank" rel="noopener noreferrer" className="mt-5 sm:mt-6 flex justify-center items-center gap-2 w-full bg-yellow-500 dark:bg-yellow-500/90 text-[#0f2136] text-[10px] sm:text-[11px] font-black uppercase tracking-widest py-3 sm:py-3.5 rounded-xl hover:bg-yellow-400 hover:shadow-lg transition-all duration-300">
                          Info Pendaftaran <ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>

      {/* 3. Papan Info / Poster */}
      <div className="bg-white dark:bg-[#0d1520] border border-gray-100 dark:border-gray-800/60 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden w-full">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h3 className="font-serif text-[#0f2136] dark:text-white font-black text-base sm:text-lg tracking-wide uppercase">
              Papan Info
            </h3>
          </div>
        </div>
        
        <div className="p-4 sm:p-5 w-full">
          {posters.length > 0 ? (
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 relative w-full">
              <Swiper
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                spaceBetween={0}
                slidesPerView={1}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true, dynamicBullets: true }}
                className="w-full"
              >
                {posters.map((poster, index) => {
                  const isValidLink = poster.link && poster.link !== '#' && poster.link.startsWith('http');
                  
                  const PosterContent = (
                    <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-[#15202b] overflow-hidden group">
                      <Image src={poster.url} alt={`Poster ${index+1}`} fill className="object-cover group-hover:scale-105 transition duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                      {isValidLink && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-6 flex justify-center items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <span className="flex items-center gap-2 text-yellow-400 font-bold text-[9px] sm:text-[10px] tracking-widest uppercase bg-black/60 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-yellow-400/30">
                             Klik Untuk Detail <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                           </span>
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <SwiperSlide key={index} className="w-full">
                      {isValidLink ? (
                        <Link href={poster.link} target="_blank" rel="noopener noreferrer" className="block w-full">
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
                 <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                 <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">Poster Publik Kosong</p>
               </div>
            </div>
          )}
        </div>
        
        <style jsx global>{`
          .swiper-pagination-bullet { background-color: #cbd5e1 !important; opacity: 1 !important; }
          .dark .swiper-pagination-bullet { background-color: #334155 !important; }
          .swiper-pagination-bullet-active { background-color: #eab308 !important; transform: scale(1.3); }
          .agenda-swiper .swiper-pagination { bottom: 0px !important; }
        `}</style>
      </div>

    </aside>
  );
}