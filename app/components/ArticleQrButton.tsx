'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Download, Loader2, QrCode, X } from 'lucide-react';
import { createBrandedArticleQr, getPublicArticleUrl } from '@/lib/article-qr';

function ArticleQrDialog({ title, slug, onClose }: { title: string; slug: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [image, setImage] = useState('');
  const [error, setError] = useState(false);
  const url = getPublicArticleUrl(slug);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    let active = true;
    createBrandedArticleQr(slug).then(dataUrl => {
      if (active) setImage(dataUrl);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
      element?.close();
    };
  }, [slug]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={headingId}
      onCancel={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-sm overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-black/60 dark:bg-gray-900 dark:text-gray-100"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-bold">QR artikel</h2>
        <button type="button" onClick={onClose} aria-label="Tutup kode QR" className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-yellow-500">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 break-words text-sm font-medium">{title}</p>
      <div className="my-4 flex aspect-square items-center justify-center rounded-xl bg-white">
        {image ? (
          <Image src={image} alt={`Kode QR untuk artikel ${title}`} width={768} height={768} unoptimized className="h-auto w-full" />
        ) : error ? (
          <p role="alert" className="p-4 text-sm text-red-700">QR belum berhasil dibuat. Tutup lalu buka kembali untuk mencoba lagi.</p>
        ) : (
          <span role="status" className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />Membuat QR...</span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Pindai dengan kamera ponsel untuk membuka artikel.</p>
      <a href={url} className="mt-2 block break-all text-xs text-blue-600 underline dark:text-blue-400">{url}</a>
      {image && (
        <a href={image} download={`qr-${slug.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 80)}.png`} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-3 text-sm font-bold text-gray-900 hover:bg-yellow-400">
          <Download className="h-4 w-4" aria-hidden="true" />Unduh QR (PNG)
        </a>
      )}
    </dialog>
  );
}

export default function ArticleQrButton({ title, slug }: { title: string; slug: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Tampilkan QR artikel" aria-label="Tampilkan QR artikel" aria-haspopup="dialog" className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-yellow-500 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-yellow-500 dark:hover:text-gray-900">
        <QrCode className="h-4 w-4" aria-hidden="true" />QR
      </button>
      {open && <ArticleQrDialog key={slug} title={title} slug={slug} onClose={() => setOpen(false)} />}
    </>
  );
}
