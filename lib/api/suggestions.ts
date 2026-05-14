import { apiClient } from './client';
import type { SuggestionRequest, SuggestionResponse, SuggestionPage } from '@/types/api';

// Suggestions API service — like a Spring @Service for the suggestions domain.
//
// The suggestions system lets logged-in users propose new Categories, Tropes,
// or Content Warnings. Each submission goes through an AI vetting pipeline and
// then admin review before becoming part of the official taxonomy.
export const suggestionsApi = {

  // POST /suggestions — submit a new suggestion.
  //
  // The payload is a free JSON object; the backend uses payload.name for
  // duplicate checking. type must be one of: CATEGORY, TROPE, CONTENT_WARNING.
  // bookId is optional — supply it to link the suggestion to a specific book.
  //
  // Returns 202 Accepted with status: PENDING (not 201 — the item isn't
  // created yet, it's queued for review).
  submitSuggestion: async (body: SuggestionRequest): Promise<SuggestionResponse> => {
    return apiClient.post<SuggestionResponse>('/suggestions', body, true);
  },

  // GET /suggestions — list the current user's own submissions.
  //
  // Paginated. page is zero-indexed (page 0 = first page).
  getSuggestions: async (page = 0, size = 20): Promise<SuggestionPage> => {
    return apiClient.get<SuggestionPage>(`/suggestions?page=${page}&size=${size}`, true);
  },
};
