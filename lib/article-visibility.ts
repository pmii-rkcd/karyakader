// Older published articles may predate the published flag.
export function isPublicArticle(article: { published?: boolean; status?: string }): boolean {
  return article.published !== false && article.status !== 'Draft';
}
