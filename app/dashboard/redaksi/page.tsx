// app/dashboard/redaksi/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImageToCloudinary as uploadImage } from '@/lib/upload-image';

interface Redaksi {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export default function RedaksiPage() {
  const [members, setMembers] = useState<Redaksi[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const redaksiQuery = query(collection(db, 'redaksi'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(redaksiQuery);
      const data = querySnapshot.docs.map(item => ({ id: item.id, ...item.data() } as Redaksi));
      setMembers(data);
    } catch (error) {
      console.error('Gagal mengambil data redaksi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
  }, []);

  const resetForm = () => {
    setName('');
    setRole('');
    setImage(null);
    setEditingId('');
    setCurrentImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (member: Redaksi) => {
    setEditingId(member.id);
    setName(member.name);
    setRole(member.role);
    setImage(null);
    setCurrentImageUrl(member.imageUrl || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !role.trim() || (!editingId && !image)) {
      alert(editingId ? 'Nama dan Jabatan wajib diisi!' : 'Nama, Jabatan, dan Foto wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrl = image ? await uploadImage(image) : currentImageUrl;
      if (!imageUrl) {
        alert('Foto profil wajib diisi!');
        return;
      }

      if (editingId) {
        await updateDoc(doc(db, 'redaksi', editingId), {
          name: name.trim(),
          role: role.trim(),
          imageUrl,
          updatedAt: serverTimestamp(),
        });
        alert('Anggota Redaksi berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'redaksi'), {
          name: name.trim(),
          role: role.trim(),
          imageUrl,
          createdAt: serverTimestamp(),
        });
        alert('Anggota Redaksi berhasil ditambahkan!');
      }

      resetForm();
      void fetchMembers();
    } catch (error) {
      console.error(editingId ? 'Gagal mengedit redaksi:' : 'Gagal menambah redaksi:', error);
      alert(`GAGAL: ${error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus anggota redaksi ini?')) return;
    try {
      await deleteDoc(doc(db, 'redaksi', id));
      if (editingId === id) resetForm();
      alert('Anggota dihapus!');
      void fetchMembers();
    } catch (error) {
      console.error('Gagal menghapus:', error);
      alert('Anggota belum dapat dihapus. Silakan coba lagi.');
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#0f2136]">Susunan Redaksi</h2>
          <p className="mt-1 text-sm text-gray-500">Atur profil tim redaksi yang akan ditampilkan di halaman Tentang Kami.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-4 lg:col-span-1">
          <h3 className="mb-4 border-b pb-2 text-lg font-bold text-[#0f2136]">{editingId ? 'Edit Anggota' : 'Tambah Anggota'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Nama Lengkap</label>
              <input type="text" value={name} onChange={event => setName(event.target.value)} className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Contoh: Ahmad Albert" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Jabatan / Posisi</label>
              <input type="text" value={role} onChange={event => setRole(event.target.value)} className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Contoh: Pemimpin Redaksi" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Foto Profil</label>
              <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                {image ? (
                  <p className="truncate text-xs font-bold text-green-600">{image.name}</p>
                ) : editingId && currentImageUrl ? (
                  <p className="mb-2 text-[10px] text-gray-500">Foto lama akan tetap dipakai jika tidak memilih foto baru.</p>
                ) : (
                  <p className="mb-2 text-[10px] text-gray-400">Pilih foto rasio 1:1 (Kotak)</p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={event => { if (event.target.files) setImage(event.target.files[0]); }}
                  className="w-full cursor-pointer text-xs text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  required={!editingId}
                />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className={`w-full rounded py-3 font-bold text-white shadow-md transition ${isSubmitting ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>
              {isSubmitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Anggota'}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="w-full rounded border border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Batal Edit</button>}
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 border-b pb-2 text-lg font-bold text-[#0f2136]">Daftar Tim Redaksi</h3>

          {isLoading ? (
            <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f2136] border-t-yellow-500" /></div>
          ) : members.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 bg-gray-50 py-10 text-center">
              <p className="text-sm text-gray-500">Belum ada anggota redaksi yang ditambahkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {members.map(member => (
                <div key={member.id} className="group relative flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-yellow-500 bg-gray-100">
                    {member.imageUrl && <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <h4 className="break-words text-sm font-bold leading-tight text-[#0f2136]">{member.name}</h4>
                    <p className="mt-0.5 break-words text-xs font-semibold text-yellow-600">{member.role}</p>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => startEdit(member)} className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white">Edit</button>
                    <button type="button" onClick={() => handleDelete(member.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white">×</button>
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

