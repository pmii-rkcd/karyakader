import type Quill from 'quill';

interface UploadOptions {
  pending: { current: boolean };
  upload: (file: File) => Promise<string>;
  onStatus: (uploading: boolean) => void;
  onError: (message: string) => void;
}

export function createImageUploader({ pending, upload, onStatus, onError }: UploadOptions) {
  return {
    mimetypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    async handler(this: { quill: Quill }, range: { index: number; length: number }, files: File[]) {
      if (pending.current || !this.quill.isEnabled() || files.length === 0) return;
      const editor = this.quill;
      pending.current = true;
      onStatus(true);
      onError('');
      editor.disable();
      try {
        const urls = await Promise.all(files.map(upload));
        // The editor is locked during upload so the insertion position stays stable.
        if (!editor.root.isConnected) return;
        editor.enable();
        urls.forEach((url, offset) => editor.insertEmbed(range.index + offset, 'image', url, 'user'));
        editor.setSelection(range.index + urls.length, 0, 'silent');
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Gagal mengunggah foto. Silakan coba lagi.');
      } finally {
        editor.enable();
        pending.current = false;
        onStatus(false);
      }
    },
  };
}
