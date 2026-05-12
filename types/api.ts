/**
 * TypeScript type definitions for the Bookrithm API
 * These match the backend API specification
 * 
 * Think of these as contracts between frontend and backend -
 * they ensure we're sending and receiving the correct data shape
 */

// ============================================================================
// ENUMS - Think of these like Java enums, but in TypeScript they're string literals
// ============================================================================

/**
 * Where a book comes from
 * Currently only Google Books is supported
 */
export type BookSource = 'GOOGLE_BOOKS';

/**
 * Content maturity rating for books
 * Similar to movie ratings (G, PG, PG-13, R)
 */
export type MaturityRating = 'UNKNOWN' | 'EVERYONE' | 'TEEN' | 'MATURE';

/**
 * Status of a user suggestion (category, trope, or content warning)
 */
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Type of suggestion a user can submit
 */
export type SuggestionType = 'CATEGORY' | 'TROPE' | 'CONTENT_WARNING';

/**
 * User's permission level
 * NORMAL = regular user
 * TRUSTED = vetted contributor
 * MODERATOR = can approve suggestions
 * ADMIN = full access
 */
export type TrustLevel = 'NORMAL' | 'TRUSTED' | 'MODERATOR' | 'ADMIN';

/**
 * User's current reading status (displayed on profile)
 */
export type ReaderStatus = 
  | 'READING' 
  | 'COZY_READING' 
  | 'BETWEEN_BOOKS' 
  | 'SEARCHING' 
  | 'REREADING' 
  | 'ON_HIATUS' 
  | 'BUSY';

// ============================================================================
// API RESPONSE TYPES - Data we receive from the backend
// ============================================================================

/**
 * Pagination metadata
 * Tells us which page we're on and how many total pages/items exist
 */
export interface PageMeta {
  page: number;           // Current page number (0-indexed, like Java)
  size: number;           // Number of items per page
  totalElements: number;  // Total number of items across all pages
  totalPages: number;     // Total number of pages
}

/**
 * Generic paginated response wrapper
 * Many API endpoints return data in this format
 * 
 * Example: BookPage = Page<BookResponse>
 */
export interface Page<T> {
  content: T[];    // Array of items for this page
  page: PageMeta;  // Pagination info
}

/**
 * Standard error response from the API
 * All errors follow this format, making them easy to handle
 */
export interface ErrorResponse {
  status: number;      // HTTP status code (404, 400, 500, etc.)
  code: string;        // Error code like 'RESOURCE_NOT_FOUND'
  message: string;     // Human-readable error message
  path?: string;       // API endpoint that caused the error
  timestamp: string;   // When the error occurred (ISO date-time)
}

// ============================================================================
// BOOK TYPES
// ============================================================================

/**
 * Book information returned by the API
 * Represents a single book in the system
 */
export interface BookResponse {
  id: string;                      // UUID
  source: BookSource;              // Where we got this book from
  title: string;                   // Book title
  author: string;                  // Author name
  description?: string;            // Book description/summary (optional)
  coverUrl?: string;               // URL to cover image (optional)
  isFanfiction: boolean;           // Is this fanfiction?
  maturity: MaturityRating;        // Content rating
  isbn10?: string;                 // ISBN-10 if available
  isbn13?: string;                 // ISBN-13 if available
}

/**
 * Paginated list of books
 */
export type BookPage = Page<BookResponse>;

/**
 * A category (genre/sub-genre)
 */
export interface CategoryResponse {
  id: string;                   // UUID
  name: string;                 // Category name (e.g., "Dark Romance")
  parentId?: string;            // Parent category ID if this is a sub-category
  maturity: MaturityRating;     // Minimum maturity for this category
}

/**
 * Weighted category for a book
 * Shows how much of a book belongs to a specific category
 * 
 * Example: Dark Romance (62%), Tragedy (24%), Horror (14%)
 */
export interface CategoryWeightResponse {
  category: CategoryResponse;   // The category
  weight: number;               // 0-100: percentage of book in this category
  computedAt: string;           // When this was calculated (ISO date-time)
}

/**
 * Paginated list of categories
 */
export type CategoryPage = Page<CategoryResponse>;

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User profile information
 * Some fields are only visible to the user themselves or when profile is public
 */
export interface UserResponse {
  id: string;                              // UUID
  username: string;                        // Unique username
  displayName: string;                     // Display name (can have spaces)
  avatarUrl?: string;                      // Profile picture URL
  bio?: string;                            // User bio
  readerStatus?: ReaderStatus;             // Current reading status
  isPrivate: boolean;                      // Is profile private?
  
  // These fields only visible if profile is public or you're the owner
  firstName?: string;
  lastName?: string;
  location?: string;
  
  // Social links
  websiteUrl?: string;
  goodreadsUrl?: string;
  storyGraphUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  
  // Privacy settings
  allowAnonymousPublicReviews: boolean;    // Can others see reviews without login?
  allowPublicCredibilityStats: boolean;    // Show credibility score publicly?
  
  trustLevel: TrustLevel;                  // Permission level
  createdAt: string;                       // Account creation date (ISO date-time)
}

/**
 * Request body for user registration (first login)
 */
export interface RegisterUserRequest {
  username: string;     // 3-40 chars, alphanumeric + underscores only
  displayName: string;  // 1-80 chars
  email: string;        // Valid email address
}

/**
 * Request body for updating user profile
 * All fields are optional - only include what you want to change
 * This is called a "partial update" or "patch"
 */
export interface UpdateUserRequest {
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  goodreadsUrl?: string;
  storyGraphUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  readerStatus?: ReaderStatus;
  isPrivate?: boolean;
  allowAnonymousPublicReviews?: boolean;
  allowPublicCredibilityStats?: boolean;
}

// ============================================================================
// SHELF TYPES - User's reading lists
// ============================================================================

/**
 * A reading shelf (like "Want to Read", "Currently Reading", etc.)
 */
export interface ShelfResponse {
  id: string;           // UUID
  name: string;         // Shelf name
  isSystem: boolean;    // System shelves can't be renamed/deleted
  maxItems?: number;    // Optional limit on shelf size
  bookCount: number;    // How many books are on this shelf
}

/**
 * Request to add/move a book to a shelf
 */
export interface SetBookStateRequest {
  shelfId: string;  // UUID of target shelf
}

/**
 * Information about a book on a user's shelf
 */
export interface UserBookStateResponse {
  bookId: string;       // UUID of the book
  bookTitle?: string;   // Book title (for convenience)
  shelfId: string;      // UUID of the shelf it's on
  shelfName: string;    // Shelf name (for convenience)
  position: number;     // Position in shelf (for ordering)
  addedAt: string;      // When book was added (ISO date-time)
}

/**
 * Paginated list of books on a shelf
 */
export type UserBookStatePage = Page<UserBookStateResponse>;

// ============================================================================
// REVIEW TYPES - Multi-dimensional book reviews
// ============================================================================

/**
 * Request body for creating or updating a review
 * All fields are optional - you can leave text-only reviews or score-only reviews
 */
export interface ReviewRequest {
  overall?: number;       // 0-10 overall rating
  grammar?: number;       // 0-10 grammar/writing quality
  storytelling?: number;  // 0-10 story quality
  worldbuilding?: number; // 0-10 world/setting quality
  characters?: number;    // 0-10 character quality
  pacing?: number;        // 0-10 pacing
  reviewText?: string;    // Written review text
}

/**
 * Review data returned by the API
 */
export interface ReviewResponse {
  id: string;              // UUID
  userId: string;          // UUID of reviewer
  bookId: string;          // UUID of book
  overall?: number;        // 0-10 (all scores are optional)
  grammar?: number;
  storytelling?: number;
  worldbuilding?: number;
  characters?: number;
  pacing?: number;
  reviewText?: string;
  createdAt: string;       // ISO date-time
  updatedAt: string;       // ISO date-time
}

/**
 * Paginated list of reviews
 */
export type ReviewPage = Page<ReviewResponse>;

// ============================================================================
// SUGGESTION TYPES - User-submitted categories/tropes/warnings
// ============================================================================

/**
 * Request to submit a suggestion
 */
export interface SuggestionRequest {
  type: SuggestionType;           // What are you suggesting?
  bookId?: string;                // Optional: link to a specific book
  payload: Record<string, unknown>; // Free-form data (usually has a 'name' field)
}

/**
 * Suggestion data returned by the API
 */
export interface SuggestionResponse {
  id: string;                     // UUID
  type: SuggestionType;
  status: SuggestionStatus;
  payload: Record<string, unknown>;
  aiConfidence?: number;          // 0-100: AI's confidence score
  aiReason?: string;              // AI's reasoning
  createdAt: string;              // ISO date-time
  decidedAt?: string;             // When approved/rejected (ISO date-time)
}

/**
 * Paginated list of suggestions
 */
export type SuggestionPage = Page<SuggestionResponse>;

/**
 * Admin decision on a suggestion
 */
export interface SuggestionDecisionRequest {
  approved: boolean;    // Approve or reject
  reason?: string;      // Optional reason for decision
}
