// app/dashboard/agenda/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Pencil,
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
  { value: 'biro-geranad', label: 'Biro Geranad (Gerakan dan Advokasi)', color: '#EF4444' },
  { value: 'biro-pengkaderan', label: 'Biro Pengkaderan', color: '#F97316' },
  { value: 'biro-intelektual', label: 'Biro Intelektual', color: '#3B82F6' },
  { value: 'biro-keagamaan', label: 'Biro Keagamaan', color: '#10B981' },
  { value: 'biro-medjar', label: 'Biro Medjar (Media dan Jaringan)', color: '#06B6D4' },
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

function tanggalValid(date?: string) {
  if (!date) return false;
  return !Number.isNaN(new Date(date).getTime());
}

function waktuAkhirAgenda(agenda: Agenda) {
  if (!tanggalValid(agenda.date)) return null;

  if (agenda.hasTime === false) {
    const tanggalSaja = (agenda.date as string).split('T')[0];
    return new Date(`${tanggalSaja}T23:59:59`).getTime();
  }

  return new Date(agenda.date as string).getTime();
}

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [linkInfo, setLinkInfo] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [bulanKalender, setBulanKalender] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [kataPencarian, setKataPencarian] = useState('');
  const [filterStatus, setFilterStatus] = useState('mendatang');
  const [filterUnit, setFilterUnit] = useState('semua');
  const [halamanAktif, setHalamanAktif] = useState(1);
  const [agendaDiedit, setAgendaDiedit] = useState<Agenda | null>(null);

  const fetchAgendas = async () => {
    setIsLoading(true);

    try {
      const agendaQuery = query(
        collection(db, 'agendas'),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(agendaQuery);
      const data = querySnapshot.docs.map((agendaDoc) => ({
        id: agendaDoc.id,
        ...agendaDoc.data(),
      })) as Agenda[];

      setAgendas(data);
    } catch (error) {
      console.error('Gagal mengambil data agenda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string
    );
    formData.append(
      'cloud_name',
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error('Gagal mengunggah poster ke Cloudinary.');
    }

    return data.secure_url as string;
  };

  const resetForm = () => {
    setTitle('');
    setUnit('');
    setDate('');
    setTime('');
    setLinkInfo('');
    setImage(null);
    setAgendaDiedit(null);
    setFileInputKey((nilai) => nilai + 1);
    setBulanKalender(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !unit) {
      alert('Nama kegiatan dan pelaksana wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrl = image
        ? await uploadImage(image)
        : agendaDiedit?.imageUrl || '';
      const nilaiTanggal = date ? `${date}T${time || '00:00'}` : '';

      const dataAgenda = {
        title: title.trim(),
        unit,
        date: nilaiTanggal,
        hasTime: Boolean(date && time),
        linkInfo: linkInfo.trim(),
        imageUrl,
      };

      if (agendaDiedit) {
        await updateDoc(doc(db, 'agendas', agendaDiedit.id), dataAgenda);
        alert('Perubahan agenda berhasil disimpan!');
      } else {
        await addDoc(collection(db, 'agendas'), dataAgenda);
        alert('Agenda berhasil ditambahkan!');
      }

      resetForm();
      await fetchAgendas();
    } catch (error) {
      console.error('Gagal menyimpan agenda:', error);
      alert(
        agendaDiedit
          ? 'Terjadi kesalahan saat memperbarui agenda.'
          : 'Terjadi kesalahan saat menyimpan agenda.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mulaiEdit = (agenda: Agenda) => {
    setAgendaDiedit(agenda);
    setTitle(agenda.title || '');
    setUnit(agenda.unit || '');
    setLinkInfo(agenda.linkInfo === '#' ? '' : agenda.linkInfo || '');
    setImage(null);
    setFileInputKey((nilai) => nilai + 1);

    if (tanggalValid(agenda.date)) {
      const [tanggalAgenda, waktuAgenda = ''] = (agenda.date as string).split('T');
      setDate(tanggalAgenda);
      setTime(agenda.hasTime === false ? '' : waktuAgenda.slice(0, 5));

      const tanggalKalender = new Date(`${tanggalAgenda}T00:00:00`);
      setBulanKalender(
        new Date(
          tanggalKalender.getFullYear(),
          tanggalKalender.getMonth(),
          1
        )
      );
    } else {
      setDate('');
      setTime('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus agenda ini?')) return;

    try {
      await deleteDoc(doc(db, 'agendas', id));
      if (agendaDiedit?.id === id) resetForm();
      alert('Agenda dihapus!');
      await fetchAgendas();
    } catch (error) {
      console.error('Gagal menghapus agenda:', error);
      alert('Agenda gagal dihapus.');
    }
  };

  const tahun = bulanKalender.getFullYear();
  const bulan = bulanKalender.getMonth();
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
  const posisiHariPertama = new Date(tahun, bulan, 1).getDay();
  const kotakKalender: Array<number | null> = [
    ...Array.from({ length: posisiHariPertama }, () => null),
    ...Array.from({ length: jumlahHari }, (_, index) => index + 1),
  ];

  const pilihTanggal = (nomorHari: number) => {
    setDate(buatKunciTanggal(new Date(tahun, bulan, nomorHari)));
  };

  const statistikAgenda = useMemo(() => {
    const sekarang = new Date().getTime();
    let mendatang = 0;
    let tanpaTanggal = 0;
    let selesai = 0;

    agendas.forEach((agenda) => {
      const waktuAkhir = waktuAkhirAgenda(agenda);

      if (waktuAkhir === null) tanpaTanggal += 1;
      else if (waktuAkhir >= sekarang) mendatang += 1;
      else selesai += 1;
    });

    return { semua: agendas.length, mendatang, tanpaTanggal, selesai };
  }, [agendas]);

  const agendaTerfilter = useMemo(() => {
    const sekarang = new Date().getTime();
    const kata = kataPencarian.trim().toLowerCase();

    return agendas.filter((agenda) => {
      const unitAgenda = informasiUnit(agenda.unit).label.toLowerCase();
      const cocokPencarian =
        !kata ||
        agenda.title.toLowerCase().includes(kata) ||
        unitAgenda.includes(kata);

      if (!cocokPencarian) return false;
      if (filterUnit !== 'semua' && agenda.unit !== filterUnit) return false;

      const waktuAkhir = waktuAkhirAgenda(agenda);
      if (filterStatus === 'mendatang') {
        return waktuAkhir !== null && waktuAkhir >= sekarang;
      }
      if (filterStatus === 'tanpa-tanggal') return waktuAkhir === null;
      if (filterStatus === 'selesai') {
        return waktuAkhir !== null && waktuAkhir < sekarang;
      }
      return true;
    });
  }, [agendas, kataPencarian, filterStatus, filterUnit]);

  const jumlahPerHalaman = 5;
  const jumlahHalaman = Math.max(
    1,
    Math.ceil(agendaTerfilter.length / jumlahPerHalaman)
  );
  const agendaPadaHalaman = agendaTerfilter.slice(
    (halamanAktif - 1) * jumlahPerHalaman,
    halamanAktif * jumlahPerHalaman
  );

  useEffect(() => {
    setHalamanAktif(1);
  }, [kataPencarian, filterStatus, filterUnit]);

  useEffect(() => {
    if (halamanAktif > jumlahHalaman) setHalamanAktif(jumlahHalaman);
  }, [halamanAktif, jumlahHalaman]);

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#0f2136]">
            Manajemen Agenda
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Atur jadwal kegiatan yang akan ditampilkan pada website.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="mb-4 flex items-center justify-between gap-3 border-b pb-2">
            <h3 className="text-lg font-bold text-[#0f2136]">
              {agendaDiedit ? '✏️ Edit Agenda' : '➕ Tambah Agenda Baru'}
            </h3>

            {agendaDiedit && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-200 transition"
              >
                <X className="h-3.5 w-3.5" />
                Batal
              </button>
            )}
          </div>

          {agendaDiedit && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-[11px] font-bold text-blue-700">
                Sedang mengedit: {agendaDiedit.title}
              </p>
              <p className="mt-0.5 text-[10px] text-blue-500">
                Ubah data yang diperlukan, kemudian tekan Simpan Perubahan.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Kegiatan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm"
                placeholder="Contoh: RTAR Kawah 2026"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Pelaksana <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm bg-white"
                required
              >
                <option value="">Pilih BPH/Biro/LSO</option>
                {UNIT_OPTIONS.map((unitItem) => (
                  <option key={unitItem.value} value={unitItem.value}>
                    {unitItem.label}
                  </option>
                ))}
              </select>

              {unit && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: informasiUnit(unit).color }}
                  />
                  <span className="text-[11px] font-bold text-gray-600">
                    Warna kalender: {informasiUnit(unit).label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700">
                  Tanggal Pelaksanaan <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                {date && (
                  <button
                    type="button"
                    onClick={() => {
                      setDate('');
                      setTime('');
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Hapus tanggal
                  </button>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between bg-[#0f2136] px-3 py-2 text-white">
                  <button
                    type="button"
                    onClick={() =>
                      setBulanKalender(new Date(tahun, bulan - 1, 1))
                    }
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                    aria-label="Bulan sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <p className="font-bold text-xs capitalize">
                    {bulanKalender.toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setBulanKalender(new Date(tahun, bulan + 1, 1))
                    }
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                    aria-label="Bulan berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 bg-gray-100">
                  {namaHari.map((hari, indexHari) => (
                    <div
                      key={hari}
                      className={`py-1.5 text-center text-[9px] font-bold uppercase ${
                        indexHari === 0 ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {hari}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 p-2">
                  {kotakKalender.map((nomorHari, index) => {
                    if (nomorHari === null) {
                      return <div key={`kosong-${index}`} className="h-8" />;
                    }

                    const tanggalKotak = new Date(tahun, bulan, nomorHari);
                    const kunciTanggal = buatKunciTanggal(tanggalKotak);
                    const dipilih = date === kunciTanggal;
                    const hariIni =
                      kunciTanggal === buatKunciTanggal(new Date());
                    const hariMinggu = tanggalKotak.getDay() === 0;

                    return (
                      <button
                        type="button"
                        key={kunciTanggal}
                        onClick={() => pilihTanggal(nomorHari)}
                        className={`h-8 rounded-md text-[11px] font-bold transition ${
                          dipilih
                            ? 'bg-yellow-500 text-[#0f2136] ring-2 ring-yellow-300'
                            : hariMinggu
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : hariIni
                            ? 'bg-[#0f2136] text-white'
                            : 'text-gray-700 hover:bg-yellow-100'
                        }`}
                      >
                        {nomorHari}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-100 px-3 py-2">
                <CalendarDays className="w-4 h-4 text-yellow-600 shrink-0" />
                <p className="text-[11px] text-gray-600">
                  {date
                    ? new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
                        dateStyle: 'full',
                      })
                    : 'Belum ada tanggal yang dipilih.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Waktu Pelaksanaan <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                disabled={!date}
                className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
              />
              {!date && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Pilih tanggal terlebih dahulu jika ingin menambahkan waktu.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Link Info/Pendaftaran <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <input
                type="url"
                value={linkInfo}
                onChange={(event) => setLinkInfo(event.target.value)}
                className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm"
                placeholder="https://wa.me/..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Poster Kegiatan <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImage(event.target.files?.[0] || null)
                }
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {agendaDiedit?.imageUrl && !image && (
                <p className="mt-1.5 text-[10px] text-gray-500">
                  Poster lama tetap digunakan jika Anda tidak memilih poster baru.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 text-white font-bold rounded shadow-sm text-sm transition ${
                isSubmitting
                  ? 'bg-gray-400'
                  : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'
              }`}
            >
              {isSubmitting
                ? 'Menyimpan...'
                : agendaDiedit
                ? 'Simpan Perubahan'
                : 'Simpan Agenda'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="text-lg font-bold text-[#0f2136]">
                📋 Pusat Data Agenda
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">
                Cari, kelompokkan, dan tampilkan lima agenda per halaman.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#0f2136] px-3 py-1.5 text-[10px] font-bold text-white">
              {statistikAgenda.semua} Total Agenda
            </span>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mt-4">
            {[
              { value: 'semua', label: 'Semua', count: statistikAgenda.semua, color: '#0f2136' },
              { value: 'mendatang', label: 'Mendatang', count: statistikAgenda.mendatang, color: '#F59E0B' },
              { value: 'tanpa-tanggal', label: 'Belum Dijadwalkan', count: statistikAgenda.tanpaTanggal, color: '#3B82F6' },
              { value: 'selesai', label: 'Selesai', count: statistikAgenda.selesai, color: '#64748B' },
            ].map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setFilterStatus(item.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  filterStatus === item.value
                    ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                    : 'border-gray-200 bg-gray-50 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {item.label}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <p className="mt-1 text-2xl font-black text-[#0f2136]">
                  {item.count}
                </p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={kataPencarian}
                onChange={(event) => setKataPencarian(event.target.value)}
                placeholder="Cari nama agenda atau pelaksana..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-yellow-500"
              />
            </div>

            <select
              value={filterUnit}
              onChange={(event) => setFilterUnit(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-yellow-500"
            >
              <option value="semua">Semua pelaksana</option>
              {UNIT_OPTIONS.map((unitItem) => (
                <option key={unitItem.value} value={unitItem.value}>
                  {unitItem.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-10">
              Memuat data...
            </p>
          ) : agendas.length === 0 ? (
            <div className="text-center py-10 mt-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">
                Belum ada agenda yang disimpan.
              </p>
            </div>
          ) : agendaTerfilter.length === 0 ? (
            <div className="text-center py-10 mt-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-sm font-bold text-gray-600">
                Agenda tidak ditemukan.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Coba ubah kata pencarian atau pilihan filter.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {agendaPadaHalaman.map((agenda) => {
                  const memilikiTanggal = tanggalValid(agenda.date);
                  const unitAgenda = informasiUnit(agenda.unit);
                  const waktuAkhir = waktuAkhirAgenda(agenda);
                  const sudahSelesai =
                    waktuAkhir !== null && waktuAkhir < new Date().getTime();

                  return (
                    <div
                      key={agenda.id}
                      className="relative overflow-hidden flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 hover:border-yellow-400 hover:shadow-sm transition"
                    >
                      <span
                        className="absolute inset-y-0 left-0 w-1"
                        style={{ backgroundColor: unitAgenda.color }}
                      />

                      <div className="w-14 h-14 ml-1 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-200">
                        {agenda.imageUrl ? (
                          <img
                            src={agenda.imageUrl}
                            alt={agenda.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-[#0f2136] truncate">
                            {agenda.title}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
                              !memilikiTanggal
                                ? 'bg-blue-100 text-blue-600'
                                : sudahSelesai
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {!memilikiTanggal
                              ? 'Belum Dijadwalkan'
                              : sudahSelesai
                              ? 'Selesai'
                              : 'Mendatang'}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: unitAgenda.color }}
                          />
                          <span className="text-[9px] font-bold uppercase text-gray-500 truncate">
                            {unitAgenda.label}
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-500 mt-1 truncate">
                          🗓️{' '}
                          {memilikiTanggal
                            ? new Date(agenda.date as string).toLocaleString(
                                'id-ID',
                                agenda.hasTime === false
                                  ? { dateStyle: 'full' }
                                  : { dateStyle: 'full', timeStyle: 'short' }
                              )
                            : 'Jadwal belum ditentukan'}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => mulaiEdit(agenda)}
                          className="flex items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(agenda.id)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600 hover:bg-red-100 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
                <p className="text-[10px] text-gray-500">
                  Halaman {halamanAktif} dari {jumlahHalaman} • Menampilkan maksimal 5 agenda
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setHalamanAktif((halaman) => Math.max(1, halaman - 1))
                    }
                    disabled={halamanAktif === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-yellow-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHalamanAktif((halaman) =>
                        Math.min(jumlahHalaman, halaman + 1)
                      )
                    }
                    disabled={halamanAktif === jumlahHalaman}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-yellow-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
