// app/dashboard/settings/header-footer/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function HeaderFooterSettings() {
  const [selectedMenu, setSelectedMenu] = useState('general');
  const [webName, setWebName] = useState('');
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [linkedin, setLinkedin] = useState('');
  
  // State untuk Upload Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', selectedMenu));
      if (snap.exists()) {
        const d = snap.data();
        setWebName(d.webName || ''); setTagline(d.tagline || '');
        setEmail(d.email || ''); setPhone(d.phone || '');
        setInstagram(d.instagram || ''); setYoutube(d.youtube || '');
        setTiktok(d.tiktok || ''); setLinkedin(d.linkedin || '');
        setLogoUrl(d.logoUrl || ''); // Tarik URL Logo
      } else {
        setWebName(''); setTagline(''); setEmail(''); setPhone(''); 
        setInstagram(''); setYoutube(''); setTiktok(''); setLinkedin(''); setLogoUrl('');
      }
    };
    fetchSettings();
  }, [selectedMenu]);

  // Fungsi Upload ke Cloudinary
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalLogoUrl = logoUrl;
      // Jika admin mengunggah logo baru, upload dulu ke Cloudinary
      if (logoFile) {
        finalLogoUrl = await uploadImage(logoFile);
      }

      await setDoc(doc(db, 'settings', selectedMenu), {
        webName, tagline, email, phone, instagram, youtube, tiktok, linkedin, 
        logoUrl: finalLogoUrl, 
        updatedAt: new Date()
      }, { merge: true });
      
      alert(`Pengaturan untuk menu "${selectedMenu}" berhasil disimpan!`);
      setLogoFile(null); // Reset file input setelah sukses
    } catch (error) {
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-[#0f2136] mb-6 border-b pb-2">⚙️ Header & Footer (Dinamis per Menu)</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-bold text-[#0f2136] mb-2">Pilih Halaman yang Ingin Diubah:</label>
          <select value={selectedMenu} onChange={(e) => setSelectedMenu(e.target.value)} className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-[#0f2136] outline-none">
            <option value="general">🏠 Pengaturan Utama (Default semua halaman)</option>
            <option value="kabar-dari-kawah">📰 Kabar Dari Kawah</option>
            <option value="bararasa">📝 Bararasa</option>
            <option value="nalar-tempaan">🧠 Nalar Tempaan</option>
            <option value="mutiara-chondro">✨ Mutiara Chondro</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">*Jika dikosongkan, halaman akan otomatis menggunakan Pengaturan Utama (Beranda).</p>
        </div>

        {/* INPUT LOGO WEB */}
        <div className="bg-gray-50 p-4 border rounded-md">
          <label className="text-sm font-bold block mb-2">Logo Website (Header & Footer)</label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full border-2 border-[#0f2136] object-cover bg-white" />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400 text-center">No<br/>Logo</div>
            )}
            <div className="flex-1">
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setLogoFile(e.target.files[0]); }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:font-semibold file:bg-[#0f2136] file:text-white hover:file:bg-gray-800 transition cursor-pointer" />
              <p className="text-xs text-gray-400 mt-1">Gunakan gambar rasio 1:1 (Kotak), background transparan (PNG) lebih direkomendasikan.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-sm font-bold block mb-1">Nama Web (Header)</label><input type="text" value={webName} onChange={(e)=>setWebName(e.target.value)} className="w-full border p-2 rounded" placeholder="KARYA KADER" /></div>
          <div><label className="text-sm font-bold block mb-1">Tagline</label><input type="text" value={tagline} onChange={(e)=>setTagline(e.target.value)} className="w-full border p-2 rounded" placeholder="PR. PMII KAWAH" /></div>
          <div><label className="text-sm font-bold block mb-1">Email Redaksi</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border p-2 rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">No. WA</label><input type="text" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border p-2 rounded" placeholder="628..." /></div>
          <div><label className="text-sm font-bold block mb-1">Link Instagram</label><input type="text" value={instagram} onChange={(e)=>setInstagram(e.target.value)} className="w-full border p-2 rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">Link YouTube</label><input type="text" value={youtube} onChange={(e)=>setYoutube(e.target.value)} className="w-full border p-2 rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">Link TikTok</label><input type="text" value={tiktok} onChange={(e)=>setTiktok(e.target.value)} className="w-full border p-2 rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">Link LinkedIn</label><input type="text" value={linkedin} onChange={(e)=>setLinkedin(e.target.value)} className="w-full border p-2 rounded" /></div>
        </div>

        <button type="submit" disabled={isSubmitting} className={`w-full py-4 text-white font-bold rounded shadow-md transition ${isSubmitting ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>Simpan Pengaturan Header/Footer</button>
      </form>
    </div>
  );
}