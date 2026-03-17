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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', selectedMenu));
      if (snap.exists()) {
        const d = snap.data();
        setWebName(d.webName || ''); setTagline(d.tagline || '');
        setEmail(d.email || ''); setPhone(d.phone || '');
        setInstagram(d.instagram || ''); setYoutube(d.youtube || '');
      } else {
        setWebName(''); setTagline(''); setEmail(''); setPhone(''); setInstagram(''); setYoutube('');
      }
    };
    fetchSettings();
  }, [selectedMenu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', selectedMenu), {
        webName, tagline, email, phone, instagram, youtube, updatedAt: new Date()
      }, { merge: true });
      alert(`Header/Footer untuk menu "${selectedMenu}" berhasil disimpan!`);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-sm font-bold block mb-1">Nama Web (Header)</label><input type="text" value={webName} onChange={(e)=>setWebName(e.target.value)} className="w-full border p-2 rounded" placeholder="KARYA KADER" /></div>
          <div><label className="text-sm font-bold block mb-1">Tagline</label><input type="text" value={tagline} onChange={(e)=>setTagline(e.target.value)} className="w-full border p-2 rounded" placeholder="PR. PMII KAWAH" /></div>
          <div><label className="text-sm font-bold block mb-1">Email Redaksi</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border p-2 rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">No. WA</label><input type="text" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border p-2 rounded" placeholder="628..." /></div>
          <div><label className="text-sm font-bold block mb-1">Link Instagram</label><input type="text" value={instagram} onChange={(e)=>setInstagram(e.target.value)} className="w-full border p-2 rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">Link YouTube</label><input type="text" value={youtube} onChange={(e)=>setYoutube(e.target.value)} className="w-full border p-2 rounded" /></div>
        </div>

        <button type="submit" disabled={isSubmitting} className={`w-full py-3 text-white font-bold rounded ${isSubmitting ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>Simpan Pengaturan Header/Footer</button>
      </form>
    </div>
  );
}