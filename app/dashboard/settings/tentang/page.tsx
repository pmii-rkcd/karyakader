// app/dashboard/settings/tentang/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function TentangSettingsPage() {
  const [description, setDescription] = useState('');
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAbout = async () => {
      const snap = await getDoc(doc(db, 'settings', 'about'));
      if (snap.exists()) {
        const d = snap.data();
        setDescription(d.description || ''); setVisi(d.visi || '');
        setMisi(d.misi || ''); setAddress(d.address || ''); setMapUrl(d.mapUrl || '');
      }
    };
    fetchAbout();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'about'), {
        description, visi, misi, address, mapUrl, updatedAt: new Date()
      }, { merge: true });
      alert('Halaman Tentang Kami berhasil diperbarui!');
    } catch (error) {
      alert('Gagal menyimpan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-[#0f2136] mb-6 border-b pb-2">🏢 Pengaturan Profil & Visi Misi</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-sm font-bold block mb-1">Deskripsi Singkat</label><textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} className="w-full border p-2 rounded"></textarea></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-bold block mb-1">Visi</label><textarea value={visi} onChange={(e)=>setVisi(e.target.value)} rows={4} className="w-full border p-2 rounded"></textarea></div>
          <div><label className="text-sm font-bold block mb-1">Misi</label><textarea value={misi} onChange={(e)=>setMisi(e.target.value)} rows={4} className="w-full border p-2 rounded"></textarea></div>
        </div>
        <div><label className="text-sm font-bold block mb-1">Alamat Lengkap</label><input type="text" value={address} onChange={(e)=>setAddress(e.target.value)} className="w-full border p-2 rounded" /></div>
        <div><label className="text-sm font-bold block mb-1">Link Embed Maps (src)</label><input type="text" value={mapUrl} onChange={(e)=>setMapUrl(e.target.value)} className="w-full border p-2 rounded" placeholder="https://www.google.com/maps/embed?pb=..." /></div>
        
        <button type="submit" disabled={isSubmitting} className={`w-full py-3 text-white font-bold rounded ${isSubmitting ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>Simpan Profil</button>
      </form>
    </div>
  );
}