// app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SettingsPage() {
  // === STATE IDENTITAS & SOSMED (Baru) ===
  const [webName, setWebName] = useState('KARYA KADER');
  const [tagline, setTagline] = useState('PR. PMII KAWAH CHONDRODIMUKO');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [linkedin, setLinkedin] = useState('');
  
  // === STATE BERANDA ===
  const [agenda, setAgenda] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [currentPosterUrl, setCurrentPosterUrl] = useState('');
  
  // === STATE TENTANG KAMI ===
  const [aboutDesc, setAboutDesc] = useState('');
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      // Ambil data General (Beranda, Identitas, Sosmed)
      const generalSnap = await getDoc(doc(db, 'settings', 'general'));
      if (generalSnap.exists()) {
        const d = generalSnap.data();
        setWebName(d.webName || 'KARYA KADER');
        setTagline(d.tagline || 'PR. PMII KAWAH CHONDRODIMUKO');
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setInstagram(d.instagram || '');
        setYoutube(d.youtube || '');
        setTiktok(d.tiktok || '');
        setLinkedin(d.linkedin || '');
        setAgenda(d.agenda || '');
        setCurrentPosterUrl(d.posterUrl || '');
      }

      // Ambil data About (Tentang Kami)
      const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
      if (aboutSnap.exists()) {
        const d = aboutSnap.data();
        setAboutDesc(d.description || '');
        setVisi(d.visi || '');
        setMisi(d.misi || '');
        setAddress(d.address || '');
        setMapUrl(d.mapUrl || '');
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
      let finalPosterUrl = currentPosterUrl;
      if (posterFile) {
        finalPosterUrl = await uploadPoster(posterFile);
        setCurrentPosterUrl(finalPosterUrl);
      }
      
      // 1. Simpan Pengaturan Umum (General)
      await setDoc(doc(db, 'settings', 'general'), {
        webName, tagline, email, phone, instagram, youtube, tiktok, linkedin,
        agenda, posterUrl: finalPosterUrl, updatedAt: new Date()
      }, { merge: true });

      // 2. Simpan Pengaturan Tentang Kami (About)
      await setDoc(doc(db, 'settings', 'about'), {
        description: aboutDesc, visi, misi, address, mapUrl, updatedAt: new Date()
      }, { merge: true });

      alert('Seluruh pengaturan (Identitas, Sosmed, Agenda, dll) berhasil diperbarui!');
      setPosterFile(null);
    } catch (error) {
      console.error('Gagal menyimpan pengaturan:', error);
      alert('Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 pb-10">
      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* KARTU 1: IDENTITAS WEB & KONTAK */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold font-serif text-[#0f2136] mb-6 border-b pb-2">1. Identitas & Kontak</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-1">Nama Website (Header & Footer)</label><input type="text" value={webName} onChange={(e) => setWebName(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div><label className="block text-sm font-bold mb-1">Tagline / Nama Rayon</label><input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div><label className="block text-sm font-bold mb-1">Email Redaksi</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div><label className="block text-sm font-bold mb-1">No. WA (Gunakan 62...)</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" placeholder="6281234..." /></div>
          </div>
        </div>

        {/* KARTU 2: SOSIAL MEDIA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold font-serif text-[#0f2136] mb-6 border-b pb-2">2. Link Sosial Media (Awali dengan https://)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-1">Instagram</label><input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div><label className="block text-sm font-bold mb-1">YouTube</label><input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div><label className="block text-sm font-bold mb-1">TikTok</label><input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div><label className="block text-sm font-bold mb-1">LinkedIn</label><input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
          </div>
        </div>

        {/* KARTU 3: WIDGET BERANDA (Agenda & Poster) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold font-serif text-[#0f2136] mb-6 border-b pb-2">3. Widget Sidebar (Beranda)</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-bold mb-1">Teks Agenda Rayon</label><textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div>
              <label className="block text-sm font-bold mb-1">Poster / Info Kegiatan</label>
              {currentPosterUrl && <img src={currentPosterUrl} alt="Poster" className="h-32 mb-2 rounded border object-contain bg-gray-100" />}
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setPosterFile(e.target.files[0]); }} className="w-full text-sm" />
            </div>
          </div>
        </div>

        {/* KARTU 4: HALAMAN TENTANG KAMI */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold font-serif text-[#0f2136] mb-6 border-b pb-2">4. Halaman Tentang Kami</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-bold mb-1">Deskripsi Singkat</label><textarea value={aboutDesc} onChange={(e) => setAboutDesc(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold mb-1">Visi</label><textarea value={visi} onChange={(e) => setVisi(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
              <div><label className="block text-sm font-bold mb-1">Misi</label><textarea value={misi} onChange={(e) => setMisi(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            </div>
            <div><label className="block text-sm font-bold mb-1">Alamat Lengkap</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
            <div><label className="block text-sm font-bold mb-1">Link Embed Google Maps (src)</label><input type="text" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} className="w-full px-4 py-2 border rounded outline-none focus:ring-2 focus:ring-[#0f2136]" /></div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} className={`w-full py-4 text-[#0f2136] font-extrabold rounded-md shadow-md transition-all ${isSaving ? 'bg-yellow-300' : 'bg-yellow-500 hover:bg-yellow-400'}`}>
          {isSaving ? 'Menyimpan Semua...' : 'Simpan Semua Pengaturan'}
        </button>
      </form>
    </div>
  );
}