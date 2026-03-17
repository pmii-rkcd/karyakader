// app/dashboard/agenda/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface Agenda {
  id: string;
  title: string;
  date: string;
  linkInfo: string;
  imageUrl: string;
}

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(''); // Menggunakan datetime-local
  const [linkInfo, setLinkInfo] = useState('');
  const [image, setImage] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mengambil daftar agenda dari Firebase
  const fetchAgendas = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'agendas'), orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
      setAgendas(data);
    } catch (error) {
      console.error("Gagal mengambil data agenda:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  // Fungsi Upload Gambar ke Cloudinary
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST', body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  // Menyimpan Agenda Baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !image) {
      alert('Judul, Tanggal/Waktu, dan Gambar wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrl = await uploadImage(image);
      await addDoc(collection(db, 'agendas'), {
        title,
        date, // Format: YYYY-MM-DDTHH:mm (bisa langsung dipakai untuk countdown)
        linkInfo: linkInfo || '#',
        imageUrl
      });

      alert('Agenda berhasil ditambahkan!');
      setTitle(''); setDate(''); setLinkInfo(''); setImage(null);
      fetchAgendas(); // Refresh daftar tabel
    } catch (error) {
      console.error("Gagal menambah agenda:", error);
      alert('Terjadi kesalahan saat menyimpan agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Menghapus Agenda
  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus agenda ini?')) {
      try {
        await deleteDoc(doc(db, 'agendas', id));
        alert('Agenda dihapus!');
        fetchAgendas(); // Refresh daftar
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#0f2136]">Manajemen Agenda</h2>
          <p className="text-gray-500 text-sm mt-1">Atur jadwal kegiatan yang akan muncul beserta hitung mundurnya di sidebar publik.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM TAMBAH AGENDA (Kiri) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">➕ Tambah Agenda Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Kegiatan</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm" placeholder="Contoh: RTAR Kawah 2026" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Waktu Pelaksanaan</label>
              {/* datetime-local sangat penting agar kita dapat Hari, Jam, Menit untuk Countdown */}
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Link Info / Pendaftaran</label>
              <input type="url" value={linkInfo} onChange={(e) => setLinkInfo(e.target.value)} className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm" placeholder="https://wa.me/..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Poster Kegiatan</label>
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setImage(e.target.files[0]); }} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" required />
            </div>
            <button type="submit" disabled={isSubmitting} className={`w-full py-2 text-white font-bold rounded shadow-sm text-sm transition ${isSubmitting ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
            </button>
          </form>
        </div>

        {/* DAFTAR AGENDA (Kanan) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">📋 Daftar Agenda Mendatang</h3>
          
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">Memuat data...</p>
          ) : agendas.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">Belum ada agenda yang dijadwalkan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendas.map((agenda) => (
                <div key={agenda.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg hover:shadow-md transition bg-gray-50">
                  <div className="w-full sm:w-24 h-24 relative rounded overflow-hidden shrink-0">
                    <img src={agenda.imageUrl} alt={agenda.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-[#0f2136]">{agenda.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      🗓️ {new Date(agenda.date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                    {agenda.linkInfo !== '#' && (
                      <a href={agenda.linkInfo} target="_blank" className="text-[10px] text-blue-500 hover:underline mt-1 inline-block">🔗 Lihat Tautan Info</a>
                    )}
                  </div>
                  <div className="shrink-0 mt-2 sm:mt-0">
                    <button onClick={() => handleDelete(agenda.id)} className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded text-xs font-bold transition">
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}