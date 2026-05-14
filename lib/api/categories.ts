import { apiClient } from './client';
import type { CategoryPage } from '@/types/api';

// Categories API service — like a Spring @Service for the category taxonomy.
//
// Categories are the approved taxonomy entries (e.g. "Dark Fantasy", "Horror").
// They are public (no auth needed) and relatively stable — the list grows
// only when an admin approves a CATEGORY suggestion.
export const categoriesApi = {

  // GET /categories — list all approved categories.
  //
  // We request a large page size so the full taxonomy arrives in one shot,
  // which powers client-side autocomplete without extra round-trips.
  // Think of it like loading a Java Enum's values() into a local cache.
  listCategories: async (page = 0, size = 200): Promise<CategoryPage> => {
    return apiClient.get<CategoryPage>(
      `/categories?page=${page}&size=${size}`,
      false, // public endpoint — no auth header needed
    );
  },
};
