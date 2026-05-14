import { apiClient } from './client';
import type { ReviewRequest, ReviewResponse, ReviewPage } from '@/types/api';

export const reviewsApi = {
  // GET /books/:bookId/reviews — public, no auth needed
  getReviews: async (bookId: string, page = 0, size = 10): Promise<ReviewPage> => {
    return apiClient.get<ReviewPage>(
      `/books/${bookId}/reviews?page=${page}&size=${size}`,
      false
    );
  },

  // POST /books/:bookId/reviews — create a new review (auth required)
  createReview: async (bookId: string, body: ReviewRequest): Promise<ReviewResponse> => {
    return apiClient.post<ReviewResponse>(`/books/${bookId}/reviews`, body, true);
  },

  // PUT /books/:bookId/reviews/:reviewId — update your own review (auth required)
  updateReview: async (bookId: string, reviewId: string, body: ReviewRequest): Promise<ReviewResponse> => {
    return apiClient.put<ReviewResponse>(`/books/${bookId}/reviews/${reviewId}`, body, true);
  },

  // DELETE /books/:bookId/reviews/:reviewId — delete your own review (auth required)
  deleteReview: async (bookId: string, reviewId: string): Promise<void> => {
    return apiClient.delete<void>(`/books/${bookId}/reviews/${reviewId}`, true);
  },
};
