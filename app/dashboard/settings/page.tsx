// app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SettingsPage() {
  // State untuk Beranda
  const [agenda, setAgenda] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [currentPosterUrl, setCurrentPosterUrl] = useState('');
  
  // State untuk Tentang Kami
  const [aboutDesc, setAboutDesc] = useState('');
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      // Ambil data General (Beranda)
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      if (generalSnap.exists()) {
        const data = generalSnap.data();
        setAgenda(data.agenda || '');
        setCurrentPosterUrl(data.posterUrl || '');
      }

      // Ambil data About (Tentang Kami)
      const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
      if (aboutSnap.exists()) {
        const data = aboutSnap.data();
        setAboutDesc(data.description || '');
        setVisi(data.visi || '');
        setMisi(data.misi || '');
        setAddress(data.address || '');
        setMapUrl(data.mapUrl || '');
      }
    };
    fetchSettings();
  }, []);

  const uploadPoster = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Simpan Pengaturan Beranda
      let finalPosterUrl = currentPosterUrl;
      if (posterFile) {
        finalPosterUrl = await uploadPoster(posterFile);
        setCurrentPosterUrl(finalPosterUrl);
      }
      await setDoc(doc(db, 'settings', 'general'), {
        agenda, posterUrl: finalPosterUrl, updatedAt: new Date()
      }, { merge: true });

      // 2. Simpan Pengaturan Tentang Kami
      await setDoc(doc(db, 'settings', 'about'), {
        description: aboutDesc,
        visi,
        misi,
        address,
        mapUrl,
        updatedAt: new Date()
      }, { merge: true });

      alert('Seluruh pengaturan berhasil diperbarui!');
      setPosterFile(null);
    } catch (error) {
      console.error('Gagal menyimpan pengaturan:', error);
      alert('Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* KARTU 1: PENGATURAN BERANDA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold font-serif text-[#0f2136] mb-6 border-b pb-2">Pengaturan Sidebar Beranda</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Teks Agenda Rayon</label>
              <textarea
                value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#0f2136] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Poster / Info Kegiatan</label>
              {currentPosterUrl && <img src={currentPosterUrl} alt="Poster" className="h-32 mb-2 rounded border object-contain bg-gray-100" />}
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setPosterFile(e.target.files[0]); }} className="w-full text-sm" />
            </div>
          </div>
        </div>

        {/* KARTU 2: PENGATURAN TENTANG KAMI */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold font-serif text-[#0f2136] mb-6 border-b pb-2">Pengaturan Halaman Tentang Kami</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
              <textarea
                value={aboutDesc} onChange={(e) => setAboutDesc(e.target.value)} rows={2}
                placeholder="Selamat datang di Portal Berita Karya Kader..."
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#0f2136] outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Visi</label>
                <textarea value={visi} onChange={(e) => setVisi(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-md outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Misi</label>
                <textarea value={misi} onChange={(e) => setMisi(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-md outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Alamat Sekretariat</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-md outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Link Embed Google Maps (src)</label>
              <input 
                type="text" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} 
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full px-4 py-2 border rounded-md outline-none text-sm" 
              />
              <p className="text-xs text-gray-500 mt-1">Buka Google Maps &gt; Share &gt; Embed a map &gt; Copy tulisan di dalam tanda kutip src="...".</p>
            </div>
          </div>
        </div>

        <button
          type="submit" disabled={isSaving}
          className={`w-full py-4 text-[#0f2136] font-extrabold rounded-md transition text-lg shadow-md ${isSaving ? 'bg-yellow-300' : 'bg-yellow-500 hover:bg-yellow-400'}`}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </button>
      </form>
    </div>
  );
}