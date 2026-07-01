/**
 * Authentication API Service
 * 
 * This module handles all user authentication and profile management:
 * - User registration (first login)
 * - Getting current user profile
 * - Updating user profile
 * 
 * Each function corresponds to a backend API endpoint.
 */

import { apiClient } from './client';
import type {
  UserResponse,
  RegisterUserRequest,
  UpdateUserRequest,
} from '@/types/api';

/**
 * User Authentication Service
 * 
 * This is a collection of functions that call the user-related endpoints.
 * Think of it like a service class in Java Spring.
 */
export const authApi = {
  /**
   * Register a new user (first login only)
   * 
   * Called after Google Sign-In when the user doesn't have a profile yet.
   * The backend creates a user profile and three system shelves.
   * 
   * Endpoint: POST /users/me
   * Auth: Required (Google JWT)
   * 
   * @param data - User registration data (username, displayName, email)
   * @returns Promise with the created user profile
   * @throws ApiError if registration fails (e.g., username taken)
   */
  register: async (data: RegisterUserRequest): Promise<UserResponse> => {
    return apiClient.post<UserResponse>('/users/me', data, true);
  },

  /**
   * Get the current user's profile
   * 
   * Called to check if a user has registered and to load their profile.
   * Returns 404 if the user hasn't registered yet.
   * 
   * Endpoint: GET /users/me
   * Auth: Required (Google JWT)
   * 
   * @returns Promise with the user profile
   * @throws ApiError with status 404 if user hasn't registered
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    return apiClient.get<UserResponse>('/users/me', true);
  },

  /**
   * Update the current user's profile
   * 
   * Partial update - only fields provided in the data object are updated.
   * All fields are optional.
   * 
   * Endpoint: PATCH /users/me
   * Auth: Required (Google JWT)
   * 
   * @param data - Fields to update (all optional)
   * @returns Promise with the updated user profile
   * @throws ApiError if update fails (e.g., username taken)
   */
  updateProfile: async (data: UpdateUserRequest): Promise<UserResponse> => {
    return apiClient.patch<UserResponse>('/users/me', data, true);
  },
};
