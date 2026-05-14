import { apiClient } from './client';
import type { ShelfResponse, SetBookStateRequest, UserBookStateResponse, UserBookStatePage } from '@/types/api';

// Shelves API service - like a Spring @Service for shelf-related endpoints
export const shelvesApi = {
  getShelves: async (): Promise<ShelfResponse[]> => {
    return apiClient.get<ShelfResponse[]>('/users/me/shelves', true);
  },

  // GET /users/me/shelves/:shelfId/books — paginated list of books on a shelf
  getShelfBooks: async (shelfId: string, page = 0, size = 20): Promise<UserBookStatePage> => {
    return apiClient.get<UserBookStatePage>(
      `/users/me/shelves/${shelfId}/books?page=${page}&size=${size}`,
      true
    );
  },

  // PUT /users/me/books/:bookId/state — add or move a book to a shelf
  setBookState: async (bookId: string, body: SetBookStateRequest): Promise<UserBookStateResponse> => {
    return apiClient.put<UserBookStateResponse>(`/users/me/books/${bookId}/state`, body, true);
  },

  // DELETE /users/me/books/:bookId/state — remove a book from all shelves
  removeBookState: async (bookId: string): Promise<void> => {
    return apiClient.delete<void>(`/users/me/books/${bookId}/state`, true);
  },
};