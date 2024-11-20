// src/types/news.types.ts

export interface Article {
  id: number;
  title: string;
  content: string;
  description: string | null;
  state: string;
  topic: string;
  published_date: Date;
  source_url: string;
  created_at: Date;
  updated_at: Date;
}

export interface NewsFilters {
  state?: string;
  topic?: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface NewsResponse {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
