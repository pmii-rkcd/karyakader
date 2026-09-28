// Older published articles may predate the published flag.
type PublishDate = { seconds?: number; toDate?: () => Date } | Date | string | null | undefined;

function publishTime(value: PublishDate): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return null;
}

export function isPublicArticle(article: { published?: boolean; status?: string; publishAt?: PublishDate }, now = new Date()): boolean {
  const scheduledTime = publishTime(article.publishAt);
  const scheduleIsDue = scheduledTime !== null && scheduledTime <= now.getTime();
  if (article.status === 'Terjadwal') return scheduleIsDue;
  if (article.status === 'Draft') return scheduleIsDue;
  if (article.published === false) return scheduleIsDue;
  return true;
}
