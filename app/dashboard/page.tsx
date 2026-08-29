// app/dashboard/agenda/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';

interface Agenda {
  id: string;
  title: string;
  date?: string;
  hasTime?: boolean;
  linkInfo?: string;
  imageUrl?: string;
}

const namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

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

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [title, setTitle] = useState('');
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      alert('Nama kegiatan wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrl = image ? await uploadImage(image) : '';
      const nilaiTanggal = date ? `${date}T${time || '00:00'}` : '';

      await addDoc(collection(db, 'agendas'), {
        title: title.trim(),
        date: nilaiTanggal,
        hasTime: Boolean(date && time),
        linkInfo: linkInfo.trim(),
        imageUrl,
      });

      alert('Agenda berhasil ditambahkan!');
      setTitle('');
      setDate('');
      setTime('');
      setLinkInfo('');
      setImage(null);
      setFileInputKey((nilai) => nilai + 1);
      setBulanKalender(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      );
      fetchAgendas();
    } catch (error) {
      console.error('Gagal menambah agenda:', error);
      alert('Terjadi kesalahan saat menyimpan agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus agenda ini?')) return;

    try {
      await deleteDoc(doc(db, 'agendas', id));
      alert('Agenda dihapus!');
      fetchAgendas();
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
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">
            ➕ Tambah Agenda Baru
          </h3>

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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">
            📋 Daftar Agenda
          </h3>

          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Memuat data...
            </p>
          ) : agendas.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">
                Belum ada agenda yang disimpan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendas.map((agenda) => {
                const memilikiTanggal = tanggalValid(agenda.date);

                return (
                  <div
                    key={agenda.id}
                    className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg hover:shadow-md transition bg-gray-50"
                  >
                    <div className="w-full sm:w-24 h-24 relative rounded overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                      {agenda.imageUrl ? (
                        <img
                          src={agenda.imageUrl}
                          alt={agenda.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[9px] font-bold uppercase">
                            Tanpa Poster
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-bold text-[#0f2136]">
                        {agenda.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        🗓️{' '}
                        {memilikiTanggal
                          ? new Date(agenda.date as string).toLocaleString(
                              'id-ID',
                              agenda.hasTime === false
                                ? { dateStyle: 'full' }
                                : {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                  }
                            )
                          : 'Jadwal belum ditentukan'}
                      </p>

                      {agenda.linkInfo && agenda.linkInfo !== '#' && (
                        <a
                          href={agenda.linkInfo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:underline mt-1 inline-block"
                        >
                          🔗 Lihat Tautan Info
                        </a>
                      )}
                    </div>

                    <div className="shrink-0 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleDelete(agenda.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded text-xs font-bold transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
