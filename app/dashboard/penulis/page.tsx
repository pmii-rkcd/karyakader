// app/dashboard/penulis/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Loader2, Plus, Edit, Trash2, X, Upload, Save, UserCheck } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  instagram: string;
  linkedin: string;
}

// 🔥 SEKARANG OTOMATIS AMBIL DARI .env.local 🔥
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""; 
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export default function ManajemenPenulisPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Kader / Penulis');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null); // State file fisik
  const [imageUrl, setImageUrl] = useState(''); // State URL hasil upload

  // Fetch Authors
  const fetchAuthors = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'authors'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
      setAuthors(data);
    } catch (error) {
      console.error("Gagal mengambil data penulis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const resetForm = () => {
    setName('');
    setRole('Kader / Penulis');
    setBio('');
    setInstagram('');
    setLinkedin('');
    setImageFile(null);
    setImageUrl('');
    setEditingId(null);
  };

  const handleOpenModal = (author?: Author) => {
    if (author) {
      setEditingId(author.id);
      setName(author.name);
      setRole(author.role);
      setBio(author.bio);
      setInstagram(author.instagram || '');
      setLinkedin(author.linkedin || '');
      setImageUrl(author.imageUrl);
      setImageFile(null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let uploadedImageUrl = imageUrl;

      // 🔥 PROSES UPLOAD KE CLOUDINARY JIKA ADA FILE BARU 🔥
      if (imageFile) {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
          alert('Error: Pengaturan Cloudinary di .env.local belum lengkap!');
          setIsSaving(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        
        if (data.secure_url) {
          uploadedImageUrl = data.secure_url;
        } else {
          throw new Error('Gagal upload gambar ke Cloudinary');
        }
      }

      // Simpan data text + Link ke Firestore
      const authorData = {
        name,
        role,
        bio,
        instagram,
        linkedin,
        imageUrl: uploadedImageUrl || 'https://via.placeholder.com/300?text=No+Photo',
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'authors', editingId), authorData);
        alert('Data penulis berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'authors'), { ...authorData, createdAt: serverTimestamp() });
        alert('Penulis baru berhasil ditambahkan!');
      }

      handleCloseModal();
      fetchAuthors();
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert('Terjadi kesalahan saat menyimpan data. Periksa kembali file gambar Anda.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus ${name} dari daftar penulis?`)) {
      try {
        await deleteDoc(doc(db, 'authors', id));
        alert('Penulis berhasil dihapus.');
        fetchAuthors();
      } catch (error) {
        console.error("Gagal menghapus data:", error);
        alert('Terjadi kesalahan saat menghapus data.');
      }
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-serif text-[#0f2136] flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-yellow-500" />
            Manajemen Penulis
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola profil dan portofolio kader penulis PMII.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-[#0f2136] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-yellow-500 hover:text-[#0f2136] transition flex items-center gap-2 text-sm shadow-md"
        >
          <Plus className="w-4 h-4" /> Tambah Penulis
        </button>
      </div>

      {/* Table / List View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : authors.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            Belum ada penulis yang ditambahkan. Silakan klik "Tambah Penulis".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-bold">Profil Penulis</th>
                  <th className="px-6 py-4 font-bold hidden md:table-cell">Bio Singkat</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {authors.map((author) => (
                  <tr key={author.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-yellow-500 shrink-0">
                          <Image src={author.imageUrl} alt={author.name} fill className="object-cover" sizes="48px" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0f2136] text-sm md:text-base">{author.name}</p>
                          <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider mt-0.5">{author.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-500 line-clamp-2">{author.bio}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(author)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(author.id, author.name)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 md:p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold font-serif text-[#0f2136]">
                {editingId ? 'Edit Data Penulis' : 'Tambah Penulis Baru'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 md:p-6 space-y-6">
              
              {/* Tombol Upload File Biasa */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Foto Profil</label>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-50 shrink-0">
                    {(imageFile || imageUrl) ? (
                      <Image src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} alt="Preview" fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><Upload className="w-8 h-8" /></div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => { 
                      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); 
                    }} 
                    className="text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#0f2136] file:text-white hover:file:bg-yellow-500 hover:file:text-[#0f2136] cursor-pointer transition-colors" 
                  />
                </div>Gambar harus kelihatan wajah dengan jelas.
                <p className="text-xs text-gray-400 mt-2"></p>
              </div>

              {/* Form Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap / Pena</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none transition text-sm" placeholder="Contoh: Ahmad Aditya" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Peran / Titel</label>
                  <input type="text" value={role} onChange={(e) => setRole(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none transition text-sm" placeholder="Contoh: Penulis Muda PMII" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bio Singkat</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} required rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none transition text-sm resize-none" placeholder="Tulis profil singkat atau moto pergerakan..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Username Instagram</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none transition text-sm" placeholder="karyakader" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Link LinkedIn (Opsional)</label>
                  <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none transition text-sm" placeholder="https://linkedin.com/in/..." />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
                <button type="submit" disabled={isSaving} className="bg-[#0f2136] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-yellow-500 hover:text-[#0f2136] transition flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Penulis'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}