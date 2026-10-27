import { createNalarHandlers, persistNalarDraft } from '@/lib/nalar-tempaan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Firebase is loaded after authentication and validation, so an unconfigured
// integration does not prevent the rest of the website from building or running.
const handlers = createNalarHandlers({
  token: () => process.env.NALAR_TEMPAAN_INGEST_TOKEN,
  publicationMode: 'publish',
  checkConnection: async () => {
    const { adminDb } = await import('@/lib/firebase-admin');
    await adminDb.collection('nalar_tempaan_deliveries').limit(1).get();
  },
  save: async draft => {
    const { adminDb } = await import('@/lib/firebase-admin');
    const { FieldValue } = await import('firebase-admin/firestore');
    return persistNalarDraft(adminDb, draft, () => FieldValue.serverTimestamp());
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
