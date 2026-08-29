'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  BarChart3,
  CalendarDays,
  Eye,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';

interface DailyStatistic {
  date: string;
  visitors: number;
  pageViews: number;
}

interface PopularPage {
  path: string;
  pageViews: number;
}

interface StatisticData {
  totalVisitors: number;
  totalPageViews: number;
  visitorsToday: number;
  visitors7Days: number;
  visitors30Days: number;
  daily: DailyStatistic[];
  popularPages: PopularPage[];
}

const emptyData: StatisticData = {
  totalVisitors: 0,
  totalPageViews: 0,
  visitorsToday: 0,
  visitors7Days: 0,
  visitors30Days: 0,
  daily: [],
  popularPages: [],
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
}

export default function StatistikPage() {
  const [data, setData] = useState<StatisticData>(emptyData);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setIsLoading(false);
        setError('Sesi admin tidak ditemukan. Silakan login kembali.');
      }
    });
  }, []);

  const fetchStatistics = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/visitor', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil statistik.');
      }

      setData(result as StatisticData);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Gagal mengambil statistik.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchStatistics(user);
  }, [user, fetchStatistics]);

  const chartData = useMemo(() => data.daily.slice(-14), [data.daily]);
  const highestVisitor = Math.max(...chartData.map((item) => item.visitors), 1);

  const cards = [
    {
      label: 'Total Pengunjung',
      value: data.totalVisitors,
      description: 'Perangkat/browser unik sejak fitur aktif',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pengunjung Hari Ini',
      value: data.visitorsToday,
      description: 'Pengunjung unik hari ini',
      icon: Eye,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: '7 Hari Terakhir',
      value: data.visitors7Days,
      description: 'Akumulasi pengunjung harian',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: '30 Hari Terakhir',
      value: data.visitors30Days,
      description: 'Akumulasi pengunjung harian',
      icon: CalendarDays,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-[#0f2136]">
            Statistik Pengunjung
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan kunjungan publik KaryaKader.id tanpa menyimpan identitas pribadi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => user && fetchStatistics(user)}
          disabled={isLoading || !user}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2136] text-white text-sm font-bold hover:bg-yellow-500 hover:text-[#0f2136] disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Perbarui Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
                  <p className="text-3xl font-black text-[#0f2136] mt-2">
                    {isLoading ? '—' : formatNumber(card.value)}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-black text-[#0f2136]">Grafik Pengunjung</h2>
                <p className="text-xs text-gray-400">14 hari terakhir</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Total halaman dibuka</p>
              <p className="font-black text-[#0f2136]">{formatNumber(data.totalPageViews)}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Memuat grafik...</div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-center text-sm text-gray-400">
              Data akan muncul setelah website menerima kunjungan.
            </div>
          ) : (
            <div className="h-64 mt-6 flex items-end gap-2 md:gap-3">
              {chartData.map((item) => {
                const barHeight = Math.max((item.visitors / highestVisitor) * 190, item.visitors > 0 ? 10 : 2);

                return (
                  <div key={item.date} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center group">
                    <div className="text-[10px] font-bold text-[#0f2136] mb-1 opacity-0 group-hover:opacity-100 transition">
                      {item.visitors}
                    </div>
                    <div
                      className="w-full max-w-10 bg-[#0f2136] group-hover:bg-yellow-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${barHeight}px` }}
                      title={`${item.visitors} pengunjung; ${item.pageViews} halaman dibuka`}
                    />
                    <span className="text-[9px] text-gray-400 mt-2 truncate w-full text-center">
                      {formatShortDate(item.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-black text-[#0f2136]">Halaman Populer</h2>
              <p className="text-xs text-gray-400">Paling banyak dibuka</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-400 py-8 text-center">Memuat data...</p>
            ) : data.popularPages.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Belum ada data halaman.</p>
            ) : (
              data.popularPages.map((page, index) => (
                <div key={page.path} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-[#0f2136] text-yellow-400 flex items-center justify-center text-xs font-black">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0f2136] truncate">{page.path}</p>
                    <p className="text-[11px] text-gray-400">{formatNumber(page.pageViews)} kali dibuka</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-700">
        Angka “Total Pengunjung” dihitung berdasarkan browser anonim. Jika seseorang menghapus cookie atau memakai perangkat lain,
        sistem dapat menganggapnya sebagai pengunjung baru. Karena itu, data ini merupakan estimasi statistik, bukan identitas orang secara pasti.
      </div>
    </div>
  );
}
