import { apiClient } from './client';
import type { BookPage, BookResponse, CategoryWeightResponse, MaturityRating } from '@/types/api';

// The query params we support when calling GET /books
// In Java this would be a record/DTO passed to your service layer
export interface SearchBooksParams {
  q?: string;           // search query (min 2 chars per spec)
  page?: number;        // 0-indexed page number
  size?: number;        // results per page
  maturity?: MaturityRating;
}

export const booksApi = {
  // GET /books — search/list books (public, no auth required)
  searchBooks: async (params: SearchBooksParams = {}): Promise<BookPage> => {
    // Build a query string like ?q=dune&page=0&size=20
    // URLSearchParams is the browser-native equivalent of Spring's UriComponentsBuilder
    const query = new URLSearchParams();
    if (params.q)        query.set('q',       params.q);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    if (params.maturity) query.set('maturity', params.maturity);

    const qs = query.toString();
    // false = no auth header needed (public endpoint)
    return apiClient.get<BookPage>(`/books${qs ? `?${qs}` : ''}`, false);
  },

  // GET /books/:id — get a single book by UUID
  getBook: async (id: string): Promise<BookResponse> => {
    return apiClient.get<BookResponse>(`/books/${id}`, false);
  },

  // GET /books/:id/categories — weighted category breakdown for a book
  getBookCategories: async (id: string): Promise<CategoryWeightResponse[]> => {
    return apiClient.get<CategoryWeightResponse[]>(`/books/${id}/categories`, false);
  },
};
