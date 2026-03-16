export const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'NAMA_PRESET_KAMU'); // Buat di settings Cloudinary
  formData.append('cloud_name', 'CLOUD_NAME_KAMU');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/CLOUD_NAME_KAMU/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url; // Ini yang akan disimpan di Firestore 'imageUrl'
};