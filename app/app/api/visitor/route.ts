import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'kk_visitor_id';

function getJakartaDate(offsetDays = 0) {
  const date = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function cleanPath(value: unknown) {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/')) return '/';

  return value.split('?')[0].slice(0, 180) || '/';
}

function pageDocumentId(path: string) {
  return Buffer.from(path).toString('base64url').slice(0, 200) || 'homepage';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = cleanPath(body.path);

    if (path.startsWith('/dashboard') || path.startsWith('/login') || path.startsWith('/api')) {
      return NextResponse.json({ recorded: false });
    }

    const existingVisitorId = request.cookies.get(COOKIE_NAME)?.value;
    const visitorId = existingVisitorId || randomUUID();
    const today = getJakartaDate();

    const summaryRef = adminDb.collection('analytics_summary').doc('main');
    const dailyRef = adminDb.collection('analytics_daily').doc(today);
    const visitorRef = adminDb.collection('analytics_visitors').doc(visitorId);
    const dailyVisitorRef = adminDb.collection('analytics_visit_days').doc(`${today}_${visitorId}`);
    const pageRef = adminDb.collection('analytics_pages').doc(pageDocumentId(path));

    await adminDb.runTransaction(async (transaction) => {
      // Semua pembacaan dilakukan sebelum penulisan agar transaksi valid.
      const visitorSnapshot = await transaction.get(visitorRef);
      const dailyVisitorSnapshot = await transaction.get(dailyVisitorRef);

      const isNewVisitor = !visitorSnapshot.exists;
      const isNewDailyVisitor = !dailyVisitorSnapshot.exists;

      transaction.set(summaryRef, {
        totalVisitors: FieldValue.increment(isNewVisitor ? 1 : 0),
        totalPageViews: FieldValue.increment(1),
        lastVisitAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      transaction.set(dailyRef, {
        date: today,
        visitors: FieldValue.increment(isNewDailyVisitor ? 1 : 0),
        pageViews: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      transaction.set(pageRef, {
        path,
        pageViews: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      if (isNewVisitor) {
        transaction.set(visitorRef, {
          firstSeenAt: FieldValue.serverTimestamp(),
          lastSeenAt: FieldValue.serverTimestamp(),
          pageViews: 1,
        });
      } else {
        transaction.set(visitorRef, {
          lastSeenAt: FieldValue.serverTimestamp(),
          pageViews: FieldValue.increment(1),
        }, { merge: true });
      }

      if (isNewDailyVisitor) {
        transaction.set(dailyVisitorRef, {
          date: today,
          visitorId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });

    const response = NextResponse.json({ recorded: true });

    if (!existingVisitorId) {
      response.cookies.set(COOKIE_NAME, visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    console.error('Gagal mencatat kunjungan:', error);

    // Statistik tidak boleh membuat halaman publik ikut gagal.
    return NextResponse.json({ recorded: false }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 401 });
    }

    const idToken = authorization.slice(7);
    await adminAuth.verifyIdToken(idToken);

    const [summarySnapshot, dailySnapshot, pagesSnapshot] = await Promise.all([
      adminDb.collection('analytics_summary').doc('main').get(),
      adminDb.collection('analytics_daily').orderBy('date', 'desc').limit(30).get(),
      adminDb.collection('analytics_pages').orderBy('pageViews', 'desc').limit(5).get(),
    ]);

    const summary = summarySnapshot.data() || {};
    const daily = dailySnapshot.docs.map((item) => {
      const data = item.data();

      return {
        date: String(data.date || item.id),
        visitors: Number(data.visitors || 0),
        pageViews: Number(data.pageViews || 0),
      };
    });

    const last7Dates = new Set(Array.from({ length: 7 }, (_, index) => getJakartaDate(index)));
    const last30Dates = new Set(Array.from({ length: 30 }, (_, index) => getJakartaDate(index)));
    const today = getJakartaDate();

    const visitors7Days = daily
      .filter((item) => last7Dates.has(item.date))
      .reduce((total, item) => total + item.visitors, 0);

    const visitors30Days = daily
      .filter((item) => last30Dates.has(item.date))
      .reduce((total, item) => total + item.visitors, 0);

    const todayData = daily.find((item) => item.date === today);

    const popularPages = pagesSnapshot.docs.map((item) => {
      const data = item.data();

      return {
        path: String(data.path || '/'),
        pageViews: Number(data.pageViews || 0),
      };
    });

    return NextResponse.json({
      totalVisitors: Number(summary.totalVisitors || 0),
      totalPageViews: Number(summary.totalPageViews || 0),
      visitorsToday: todayData?.visitors || 0,
      visitors7Days,
      visitors30Days,
      daily: daily.reverse(),
      popularPages,
    });
  } catch (error) {
    console.error('Gagal mengambil statistik:', error);
    return NextResponse.json({ message: 'Gagal mengambil statistik.' }, { status: 500 });
  }
}
