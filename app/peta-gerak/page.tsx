'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';

interface Agenda {
  id: string;
  title: string;
  unit?: string;
  date?: string;
  hasTime?: boolean;
  linkInfo?: string;
  imageUrl?: string;
}

const namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const UNIT_OPTIONS = [
  { value: 'bph', label: 'BPH', color: '#F59E0B' },
  { value: 'bph-kopri', label: 'BPH Kopri', color: '#EC4899' },
  { value: 'internal-kopri', label: 'Internal Kopri', color: '#A855F7' },
  { value: 'eksternal-kopri', label: 'Eksternal Kopri', color: '#D946EF' },
  { value: 'biro-geranad', label: 'Biro Geranad', color: '#EF4444' },
  { value: 'biro-pengkaderan', label: 'Biro Pengkaderan', color: '#F97316' },
  { value: 'biro-intelektual', label: 'Biro Intelektual', color: '#3B82F6' },
  { value: 'biro-keagamaan', label: 'Biro Keagamaan', color: '#10B981' },
  { value: 'biro-medjar', label: 'Biro Medjar', color: '#06B6D4' },
  { value: 'lso-tukul', label: 'LSO Tukul', color: '#84CC16' },
  { value: 'lso-jurlitbang', label: 'LSO Jurlitbang', color: '#6366F1' },
  { value: 'lso-entrepreneurship', label: 'LSO Entrepreneurship', color: '#14B8A6' },
  { value: 'lso-olahraga', label: 'LSO Olahraga', color: '#22C55E' },
  { value: 'lso-laskar-alam', label: 'LSO Laskar Alam', color: '#166534' },
];

function informasiUnit(value?: string) {
  return (
    UNIT_OPTIONS.find((unitItem) => unitItem.value === value) || {
      value: '',
      label: 'Pelaksana belum ditentukan',
      color: '#94A3B8',
    }
  );
}

function buatKunciTanggal(tanggal: Date) {
  const tahun = tanggal.getFullYear();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
  const hari = String(tanggal.getDate()).padStart(2, '0');

  return `${tahun}-${bulan}-${hari}`;
}

function tanggalAgendaValid(date?: string) {
  if (!date) return false;
  return !Number.isNaN(new Date(date).getTime());
}

function waktuAkhirAgenda(agenda: Agenda) {
  if (!tanggalAgendaValid(agenda.date)) return null;

  if (agenda.hasTime === false) {
    const tanggalSaja = (agenda.date as string).split('T')[0];
    return new Date(`${tanggalSaja}T23:59:59`).getTime();
  }

  return new Date(agenda.date as string).getTime();
}

export default function PetaGerakPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [bulanAktif, setBulanAktif] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [tanggalDipilih, setTanggalDipilih] = useState<string | null>(null);
  const [tanggalHariIni, setTanggalHariIni] = useState(
    buatKunciTanggal(new Date())
  );
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [pesanError, setPesanError] = useState('');
  const [kataPencarian, setKataPencarian] = useState('');

  useEffect(() => {
    const ambilAgenda = async () => {
      setSedangMemuat(true);
      setPesanError('');

      try {
        const agendaQuery = query(
          collection(db, 'agendas'),
          orderBy('date', 'asc')
        );

        const hasil = await getDocs(agendaQuery);

        const dataAgenda = hasil.docs.map((dokumen) => ({
          id: dokumen.id,
          ...dokumen.data(),
        })) as Agenda[];

        setAgendas(dataAgenda);
      } catch (error) {
        console.error('Gagal mengambil agenda:', error);
        setPesanError(
          'Agenda belum dapat dimuat. Silakan periksa koneksi internet dan coba kembali.'
        );
      } finally {
        setSedangMemuat(false);
      }
    };

    ambilAgenda();
  }, []);

  // Memindahkan penanda hari ini secara otomatis ketika tanggal berganti.
  useEffect(() => {
    const perbaruiTanggal = () => {
      setTanggalHariIni(buatKunciTanggal(new Date()));
    };

    const interval = window.setInterval(perbaruiTanggal, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const tahun = bulanAktif.getFullYear();
  const bulan = bulanAktif.getMonth();
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
  const posisiHariPertama = new Date(tahun, bulan, 1).getDay();

  const agendaBerdasarkanTanggal = useMemo(() => {
    const hasil: Record<string, Agenda[]> = {};

    agendas.forEach((agenda) => {
      if (!tanggalAgendaValid(agenda.date)) return;

      const tanggalAgenda = new Date(agenda.date as string);

      if (!Number.isNaN(tanggalAgenda.getTime())) {
        const kunci = buatKunciTanggal(tanggalAgenda);

        if (!hasil[kunci]) {
          hasil[kunci] = [];
        }

        hasil[kunci].push(agenda);
      }
    });

    return hasil;
  }, [agendas]);

  const agendaTanpaTanggal = useMemo(() => {
    return agendas.filter((agenda) => !tanggalAgendaValid(agenda.date));
  }, [agendas]);

  const kataPencarianBersih = kataPencarian.trim().toLowerCase();
  const sedangMencari = kataPencarianBersih.length > 0;

  const hasilPencarian = useMemo(() => {
    if (!kataPencarianBersih) return [];

    return agendas.filter((agenda) => {
      const namaAgenda = agenda.title.toLowerCase();
      const namaPelaksana = informasiUnit(agenda.unit).label.toLowerCase();

      return (
        namaAgenda.includes(kataPencarianBersih) ||
        namaPelaksana.includes(kataPencarianBersih)
      );
    });
  }, [agendas, kataPencarianBersih]);

  const agendaYangDitampilkan =
    sedangMencari
      ? hasilPencarian
      : tanggalDipilih === 'tanpa-tanggal'
      ? agendaTanpaTanggal
      : tanggalDipilih
      ? agendaBerdasarkanTanggal[tanggalDipilih] || []
      : [];

  const kotakKalender: Array<number | null> = [
    ...Array.from({ length: posisiHariPertama }, () => null),
    ...Array.from({ length: jumlahHari }, (_, index) => index + 1),
  ];

  const pindahBulan = (arah: number) => {
    setBulanAktif(new Date(tahun, bulan + arah, 1));
    setTanggalDipilih(null);
    setKataPencarian('');
  };

  const kembaliKeBulanIni = () => {
    const sekarang = new Date();

    setBulanAktif(
      new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)
    );
    setTanggalDipilih(null);
    setKataPencarian('');
  };

  const pilihTanggalKalender = (kunciTanggal: string) => {
    setKataPencarian('');
    setTanggalDipilih(kunciTanggal);
  };

  return (
    <main className="w-full bg-gray-50 dark:bg-[#0a0f18] py-5 md:py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <section className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-600 dark:text-yellow-400 md:text-xs">
              Kalender Kegiatan
            </p>

            <h1 className="font-serif text-2xl font-black text-[#0f2136] dark:text-white md:text-3xl">
              Peta Gerak
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-gray-600 dark:text-gray-400 md:text-sm">
              Informasi jadwal dan kegiatan PMII Rayon “Kawah” Chondrodimuko.
            </p>
          </div>

          <div className="w-full md:w-[360px] lg:w-[420px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-500" />
              <input
                type="search"
                value={kataPencarian}
                onChange={(event) => {
                  const nilai = event.target.value;
                  setKataPencarian(nilai);
                  if (nilai.trim()) setTanggalDipilih(null);
                }}
                placeholder="Cari proker atau pelaksana..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-xs text-[#0f2136] shadow-sm outline-none placeholder:text-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 dark:border-gray-700 dark:bg-[#101b29] dark:text-white transition"
              />

              {kataPencarian && (
                <button
                  type="button"
                  onClick={() => setKataPencarian('')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-[#0f2136] dark:hover:bg-gray-700 dark:hover:text-white transition"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {sedangMencari && (
              <p className="mt-1.5 px-1 text-[10px] text-gray-500 dark:text-gray-400">
                Ditemukan <strong>{hasilPencarian.length}</strong> agenda untuk
                “{kataPencarian.trim()}”.
              </p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* KALENDER */}
          <section className="lg:col-span-3 bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => pindahBulan(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[#0f2136] dark:text-white hover:bg-yellow-500 transition"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h2 className="font-serif text-lg md:text-xl font-black text-[#0f2136] dark:text-white capitalize">
                  {bulanAktif.toLocaleDateString('id-ID', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>

                <button
                  type="button"
                  onClick={kembaliKeBulanIni}
                  className="text-[10px] md:text-xs text-yellow-600 dark:text-yellow-400 font-bold hover:underline mt-0.5"
                >
                  Kembali ke bulan ini
                </button>
              </div>

              <button
                type="button"
                onClick={() => pindahBulan(1)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[#0f2136] dark:text-white hover:bg-yellow-500 transition"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 bg-[#0f2136] text-white">
              {namaHari.map((hari, indexHari) => (
                <div
                  key={hari}
                  className={`py-2 text-center text-[10px] sm:text-xs font-bold uppercase ${
                    indexHari === 0 ? 'bg-red-600 text-white' : ''
                  }`}
                >
                  {hari}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 p-2 sm:p-3 gap-1">
              {kotakKalender.map((nomorHari, index) => {
                if (nomorHari === null) {
                  return (
                    <div
                      key={`kosong-${index}`}
                      className="h-14 sm:h-16"
                    />
                  );
                }

                const tanggal = new Date(tahun, bulan, nomorHari);
                const kunciTanggal = buatKunciTanggal(tanggal);
                const daftarAgenda =
                  agendaBerdasarkanTanggal[kunciTanggal] || [];
                const warnaPelaksana = Array.from(
                  new Set(
                    daftarAgenda.map(
                      (agenda) => informasiUnit(agenda.unit).color
                    )
                  )
                );

                const hariIni = kunciTanggal === tanggalHariIni;

                const sedangDipilih = tanggalDipilih === kunciTanggal;
                const hariMinggu = tanggal.getDay() === 0;

                return (
                  <button
                    type="button"
                    key={kunciTanggal}
                    onClick={() => pilihTanggalKalender(kunciTanggal)}
                    className={`relative h-14 sm:h-16 rounded-lg border p-1 sm:p-1.5 text-left transition ${
                      sedangDipilih
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/20'
                        : hariMinggu
                        ? 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 hover:border-red-500'
                        : 'border-gray-200 dark:border-gray-800 hover:border-yellow-400 bg-white dark:bg-[#101b29]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                          hariMinggu
                            ? hariIni
                              ? 'bg-red-600 text-white'
                              : 'text-red-600 dark:text-red-400'
                            : hariIni
                            ? 'bg-yellow-500 text-[#0f2136]'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {nomorHari}
                      </span>

                      {warnaPelaksana.length > 0 && (
                        <div
                          className="flex items-center gap-1"
                          aria-label={`${daftarAgenda.length} agenda`}
                        >
                          {warnaPelaksana.slice(0, 4).map((warna) => (
                            <span
                              key={warna}
                              className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/40"
                              style={{ backgroundColor: warna }}
                            />
                          ))}
                          {warnaPelaksana.length > 4 && (
                            <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400">
                              +{warnaPelaksana.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <details className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-black/10">
              <summary className="cursor-pointer list-none px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 transition">
                Lihat keterangan warna pelaksana
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 pb-4">
                {UNIT_OPTIONS.map((unitItem) => (
                  <div
                    key={unitItem.value}
                    className="flex items-center gap-2 text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: unitItem.color }}
                    />
                    <span>{unitItem.label}</span>
                  </div>
                ))}
              </div>
            </details>
          </section>

          {/* DAFTAR AGENDA */}
          <section className="lg:col-span-2">
            <div className="bg-white dark:bg-[#0d1520] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-[#0f2136]">
                  <CalendarDays className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-serif font-black text-lg text-[#0f2136] dark:text-white">
                    {sedangMencari
                      ? 'Hasil Pencarian'
                      : tanggalDipilih === 'tanpa-tanggal'
                      ? 'Jadwal Belum Ditentukan'
                      : tanggalDipilih
                      ? 'Agenda Terpilih'
                      : 'Pilih Tanggal'}
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sedangMencari
                      ? `${hasilPencarian.length} agenda ditemukan untuk “${kataPencarian.trim()}”`
                      : tanggalDipilih === 'tanpa-tanggal'
                      ? `${agendaTanpaTanggal.length} agenda belum dijadwalkan`
                      : tanggalDipilih
                      ? new Date(`${tanggalDipilih}T00:00:00`).toLocaleDateString(
                          'id-ID',
                          { dateStyle: 'full' }
                        )
                      : 'Klik salah satu tanggal pada kalender'}
                  </p>
                </div>
              </div>

              {(tanggalDipilih || sedangMencari) && (
                <button
                  type="button"
                  onClick={() => {
                    setTanggalDipilih(null);
                    setKataPencarian('');
                  }}
                  className="mt-4 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  {sedangMencari ? 'Tutup hasil pencarian' : 'Tutup agenda terpilih'}
                </button>
              )}

              <div className="mt-4 space-y-4">
                {sedangMemuat ? (
                  <div className="text-center py-8">
                    <div className="w-9 h-9 mx-auto rounded-full border-4 border-gray-200 border-t-yellow-500 animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">
                      Memuat agenda...
                    </p>
                  </div>
                ) : pesanError ? (
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {pesanError}
                    </p>
                  </div>
                ) : sedangMencari && agendaYangDitampilkan.length === 0 ? (
                  <div
                    key={`tidak-ditemukan-${kataPencarian}`}
                    className="agenda-reveal text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl"
                  >
                    <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                    <p className="text-sm font-bold text-[#0f2136] dark:text-white mt-3">
                      Agenda tidak ditemukan
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-4">
                      Coba gunakan nama proker atau nama pelaksana yang berbeda.
                    </p>
                  </div>
                ) : !tanggalDipilih && !sedangMencari ? (
                  <div className="agenda-reveal text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <CalendarDays className="w-10 h-10 mx-auto text-yellow-500" />
                    <p className="text-sm font-bold text-[#0f2136] dark:text-white mt-3">
                      Pilih tanggal pada kalender
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-4">
                      Agenda pada tanggal tersebut akan muncul di bagian ini.
                    </p>

                    {agendaTanpaTanggal.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTanggalDipilih('tanpa-tanggal')}
                        className="mt-4 rounded-lg bg-[#0f2136] dark:bg-yellow-500 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white dark:text-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136] transition"
                      >
                        Lihat {agendaTanpaTanggal.length} agenda tanpa tanggal
                      </button>
                    )}
                  </div>
                ) : agendaYangDitampilkan.length === 0 ? (
                  <div
                    key={sedangMencari ? `cari-${kataPencarian}` : tanggalDipilih || 'agenda'}
                    className="agenda-reveal text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl"
                  >
                    <CalendarDays className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                    <p className="text-sm text-gray-500 mt-3">
                      Belum ada agenda pada tanggal ini.
                    </p>
                  </div>
                ) : (
                  <div
                    key={
                      sedangMencari
                        ? `hasil-${kataPencarianBersih}`
                        : tanggalDipilih || 'agenda'
                    }
                    className="agenda-reveal max-h-[430px] space-y-4 overflow-y-auto pr-1"
                  >
                  {agendaYangDitampilkan.map((agenda) => {
                    const memilikiTanggal = tanggalAgendaValid(agenda.date);
                    const tanggalAgenda = memilikiTanggal
                      ? new Date(agenda.date as string)
                      : null;
                    const unitAgenda = informasiUnit(agenda.unit);
                    const waktuSelesai = waktuAkhirAgenda(agenda);
                    const sudahSelesai =
                      waktuSelesai !== null &&
                      waktuSelesai < new Date().getTime();
                    const angkaTanggal = tanggalAgenda
                      ? tanggalAgenda.getDate()
                      : '?';
                    const bulanSingkat = tanggalAgenda
                      ? tanggalAgenda.toLocaleDateString('id-ID', {
                          month: 'short',
                        })
                      : 'TBD';

                    return (
                      <article
                        key={agenda.id}
                        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-gray-50 dark:from-[#101b29] dark:to-[#0b1420] shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                        style={{ borderColor: `${unitAgenda.color}66` }}
                      >
                        <span
                          className="absolute inset-x-0 top-0 h-1.5"
                          style={{ backgroundColor: unitAgenda.color }}
                        />

                        <div className="p-4 pt-5">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-16 h-[74px] shrink-0 rounded-xl border flex flex-col items-center justify-center shadow-sm"
                              style={{
                                borderColor: `${unitAgenda.color}66`,
                                backgroundColor: `${unitAgenda.color}18`,
                              }}
                            >
                              <span
                                className="text-2xl font-black leading-none"
                                style={{ color: unitAgenda.color }}
                              >
                                {angkaTanggal}
                              </span>
                              <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                                {bulanSingkat}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-black/20 border border-gray-200 dark:border-gray-700 px-2.5 py-1">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: unitAgenda.color }}
                                  />
                                  <span className="text-[9px] font-black uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    {unitAgenda.label}
                                  </span>
                                </div>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${
                                    !memilikiTanggal
                                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                      : sudahSelesai
                                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                      : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                  }`}
                                >
                                  {!memilikiTanggal
                                    ? 'Belum Dijadwalkan'
                                    : sudahSelesai
                                    ? 'Selesai'
                                    : 'Akan Datang'}
                                </span>
                              </div>

                              <h3 className="mt-3 font-serif text-xl font-black text-[#0f2136] dark:text-white leading-tight">
                                {agenda.title}
                              </h3>

                              <div className="mt-2 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Clock
                                  className="w-4 h-4 shrink-0 mt-0.5"
                                  style={{ color: unitAgenda.color }}
                                />
                                <span className="leading-relaxed">
                                  {tanggalAgenda
                                    ? tanggalAgenda.toLocaleString(
                                        'id-ID',
                                        agenda.hasTime === false
                                          ? { dateStyle: 'full' }
                                          : {
                                              dateStyle: 'full',
                                              timeStyle: 'short',
                                            }
                                      )
                                    : 'Tanggal dan waktu belum ditentukan'}
                                </span>
                              </div>
                            </div>

                            <div className="hidden sm:block w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                              {agenda.imageUrl ? (
                                <img
                                  src={agenda.imageUrl}
                                  alt={agenda.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <CalendarDays
                                    className="w-8 h-8"
                                    style={{ color: unitAgenda.color }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {agenda.linkInfo && agenda.linkInfo !== '#' && (
                            <a
                              href={agenda.linkInfo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f2136] dark:bg-yellow-500 text-white dark:text-[#0f2136] px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-[#0f2136] transition"
                            >
                              Buka Informasi Kegiatan
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        @keyframes agendaReveal {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .agenda-reveal {
          animation: agendaReveal 0.35s ease-out both;
        }
      `}</style>
    </main>
  );
}
