export async function uploadImageToCloudinary(file: File | null): Promise<string> {
  if (!file) return '';

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error('Konfigurasi unggahan gambar belum lengkap.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok || typeof data.secure_url !== 'string' || !data.secure_url.startsWith('https://')) {
    throw new Error('Gagal mengunggah gambar. Periksa koneksi dan pengaturan Cloudinary, lalu coba lagi.');
  }
  return data.secure_url;
}
