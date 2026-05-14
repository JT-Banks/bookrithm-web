/**
 * Base API Client
 * 
 * This is the foundation for making HTTP requests to the backend.
 * Think of it like a helper class in Java that handles all the common stuff:
 * - Setting the base URL
 * - Adding authentication headers
 * - Converting responses to JSON
 * - Handling errors consistently
 * 
 * We'll use the native `fetch` API (built into browsers/Node.js)
 * instead of a library like Axios to keep things simple.
 */

import type { ErrorResponse } from '@/types/api';

/**
 * Custom error class for API errors
 * This extends the standard Error class (like Java's Exception)
 * and adds the ErrorResponse from our backend
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponse
  ) {
    super(errorResponse?.message ?? 'An unknown API error occurred');
    this.name = 'ApiError';
  }
}

/**
 * Configuration for API requests
 */
interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;  // Does this request need a JWT token?
}

/**
 * Base API client class
 * 
 * This handles all the common functionality for API requests.
 * Individual API modules (auth, books, reviews, etc.) will use this.
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    // Get the base URL from environment variables
    // NEXT_PUBLIC_ prefix makes it available in the browser
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    
    if (!this.baseUrl) {
      console.warn('NEXT_PUBLIC_API_BASE_URL is not set in environment variables');
    }
  }

  /**
   * Get the stored JWT token from localStorage
   * 
   * In Java terms, think of localStorage as a simple key-value store
   * that persists in the browser (similar to SharedPreferences on Android)
   * 
   * @returns JWT token string or null if not found
   */
  private getToken(): string | null {
    // Check if we're in the browser (not during server-side rendering)
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('auth_token');
  }

  /**
   * Store JWT token in localStorage
   * We'll call this after successful Google Sign-In
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Remove JWT token from localStorage
   * Called when user logs out
   */
  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Make an HTTP request to the API
   * 
   * This is the core method that all API calls use.
   * It handles:
   * - Adding the base URL
   * - Adding authentication headers
   * - Converting responses to JSON
   * - Throwing errors for bad responses
   * 
   * @param endpoint - API endpoint (e.g., '/users/me')
   * @param config - Request configuration (method, body, headers, etc.)
   * @returns Promise with the response data
   * @throws ApiError if the request fails
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, headers = {}, ...restConfig } = config;

    // Build the full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authentication header if required
    if (requiresAuth) {
      const token = this.getToken();
      if (!token) {
        throw new Error('Authentication required but no token found');
      }
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Make the HTTP request
      const response = await fetch(url, {
        ...restConfig,
        headers: requestHeaders,
      });

      // Handle different response status codes
      
      // 204 No Content - success with no body
      if (response.status === 204) {
        return undefined as T;
      }

      // Try to parse JSON response
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // Check if request was successful (2xx status codes)
      if (!response.ok) {
        // Backend returned an error - throw ApiError
        throw new ApiError(response.status, data as ErrorResponse);
      }

      // Success - return the data
      return data as T;
      
    } catch (error) {
      // If it's already an ApiError, re-throw it
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error or other issue
      console.error('API request failed:', error);
      throw new Error('Failed to connect to the API. Please check your connection.');
    }
  }

  /**
   * Convenience methods for different HTTP methods
   * These make it easier to call the API with the right method
   * 
   * In Java terms, these are like overloaded methods
   */

  /**
   * Make a GET request
   * Used for retrieving data
   */
  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      requiresAuth,
    });
  }

  /**
   * Make a POST request
   * Used for creating new resources
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  /**
   * Make a PUT request
   * Used for updating resources (replacing entirely)
   */
  async put<T>(
    endpoint: string,
    body: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  /**
   * Make a PATCH request
   * Used for partial updates (updating some fields)
   */
  async patch<T>(
    endpoint: string,
    body: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  /**
   * Make a DELETE request
   * Used for deleting resources
   */
  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      requiresAuth,
    });
  }
}

// Create and export a single instance (singleton pattern - like Spring beans!)
export const apiClient = new ApiClient();
