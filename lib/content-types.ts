export type ArticleDate = { seconds: number; toDate?: () => Date } | null;

export interface AuthorProfile {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
  instagram?: string;
  linkedin?: string;
}

export interface PortfolioArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imageUrl: string;
  createdAt?: { seconds: number } | null;
  views?: number;
}
