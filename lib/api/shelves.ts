import { apiClient } from './client';
import type {
  ShelfResponse, CreateShelfRequest, UpdateShelfRequest, ReorderShelvesRequest,
  SetBookStateRequest, UserBookStateResponse, UserBookStatePage,
  ReadLogEntry, ReadLogPage, ReadStats,
} from '@/types/api';

// Shelves API service - like a Spring @Service for shelf-related endpoints
export const shelvesApi = {
  getShelves: async (): Promise<ShelfResponse[]> => {
    return apiClient.get<ShelfResponse[]>('/users/me/shelves', true);
  },

  createShelf: async (body: CreateShelfRequest): Promise<ShelfResponse> => {
    return apiClient.post<ShelfResponse>('/users/me/shelves', body, true);
  },

  updateShelf: async (shelfId: string, body: UpdateShelfRequest): Promise<ShelfResponse> => {
    return apiClient.patch<ShelfResponse>(`/users/me/shelves/${shelfId}`, body, true);
  },

  reorderShelves: async (body: ReorderShelvesRequest): Promise<ShelfResponse[]> => {
    return apiClient.put<ShelfResponse[]>('/users/me/shelves/order', body, true);
  },

  deleteShelf: async (shelfId: string): Promise<void> => {
    return apiClient.delete<void>(`/users/me/shelves/${shelfId}`, true);
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

  // POST /users/me/books/:bookId/read-log — mark a book as read
  markAsRead: async (bookId: string): Promise<ReadLogEntry> => {
    return apiClient.post<ReadLogEntry>(`/users/me/books/${bookId}/read-log`, {}, true);
  },

  // GET /users/me/read-log — paginated reading history
  getReadLog: async (page = 0, size = 20): Promise<ReadLogPage> => {
    return apiClient.get<ReadLogPage>(`/users/me/read-log?page=${page}&size=${size}`, true);
  },

  // GET /users/me/stats — aggregate reading statistics
  getStats: async (): Promise<ReadStats> => {
    return apiClient.get<ReadStats>('/users/me/stats', true);
  },
};
