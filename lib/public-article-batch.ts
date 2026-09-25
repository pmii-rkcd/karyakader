import { getDocs, query, startAfter, type Query, type DocumentData } from 'firebase/firestore';
import { isPublicArticle } from './article-visibility';

// Advance past batches containing only drafts so older public articles remain reachable.
export async function getPublicArticleBatch(initialQuery: Query<DocumentData>) {
  let currentQuery = initialQuery;
  while (true) {
    const snapshot = await getDocs(currentQuery);
    if (snapshot.empty || snapshot.docs.some(item => isPublicArticle(item.data()))) return snapshot;
    currentQuery = query(initialQuery, startAfter(snapshot.docs[snapshot.docs.length - 1]));
  }
}
