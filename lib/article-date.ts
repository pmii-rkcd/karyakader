type FirestoreLikeDate = { seconds?: number; toDate?: () => Date } | Date | string | null | undefined;

export function toArticleDate(value: FirestoreLikeDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function getArticlePublishedDate(article: { publishAt?: FirestoreLikeDate; createdAt?: FirestoreLikeDate; publishedAt?: FirestoreLikeDate }) {
  return toArticleDate(article.publishAt) || toArticleDate(article.publishedAt) || toArticleDate(article.createdAt);
}

export function formatArticlePublishedDate(article: { publishAt?: FirestoreLikeDate; createdAt?: FirestoreLikeDate; publishedAt?: FirestoreLikeDate }, options?: Intl.DateTimeFormatOptions) {
  const date = getArticlePublishedDate(article);
  if (!date) return 'Tanggal tidak diketahui';
  return date.toLocaleDateString('id-ID', options || { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
