'use client';

import { useRef, useState } from 'react';
import { Share2 } from 'lucide-react';

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const pending = useRef(false);
  const [isSharing, setIsSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const handleShare = async () => {
    if (pending.current) return;
    pending.current = true;
    setIsSharing(true);
    setMessage('');
    setManualUrl('');
    const shareUrl = url || window.location.href;

    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title, url: shareUrl });
          return;
        } catch (error) {
          // Closing the native share menu is a normal cancellation.
          if (error instanceof Error && error.name === 'AbortError') return;
        }
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        setMessage('Tautan berhasil disalin.');
      } catch {
        setMessage('Salin tautan berikut untuk membagikan artikel:');
        setManualUrl(shareUrl);
      }
    } finally {
      pending.current = false;
      setIsSharing(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        title="Bagikan artikel"
        aria-label="Bagikan artikel"
        aria-busy={isSharing}
        className="flex items-center justify-center rounded-full p-2.5 text-gray-500 hover:bg-gray-100 hover:text-[#0f2136] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
      </button>
      <div role="status" aria-live="polite">
        {message && (
          <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            <p>{message}</p>
            {manualUrl && (
              <input
                aria-label="Tautan artikel untuk disalin"
                readOnly
                value={manualUrl}
                onFocus={event => event.currentTarget.select()}
                onClick={event => event.currentTarget.select()}
                className="mt-2 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
              />
            )}
            <button type="button" onClick={() => { setMessage(''); setManualUrl(''); }} className="mt-2 font-semibold underline">Tutup</button>
          </div>
        )}
      </div>
    </div>
  );
}
