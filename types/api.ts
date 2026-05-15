/**
 * API Types — re-exported from the auto-generated types/generated.ts
 *
 * DO NOT hand-edit types here. Instead:
 *   1. Update specifications/backend_api_specification.yml
 *   2. Run: npm run generate:types
 *
 * This file is a thin re-export layer so the rest of the codebase
 * can import cleanly (e.g. `import type { UserResponse } from '@/types/api'`)
 * without knowing about the generated file's internal structure.
 */

import type { components } from './generated';

// Shorthand alias — all our types live under components['schemas']
type S = components['schemas'];

// ── Enums ────────────────────────────────────────────────────────────────────
export type BookSource       = S['BookSource'];
export type MaturityRating   = S['MaturityRating'];
export type SuggestionStatus = S['SuggestionStatus'];
export type SuggestionType   = S['SuggestionType'];
export type TrustLevel       = S['TrustLevel'];
export type ReaderStatus     = S['ReaderStatus'];

// ── Shared ───────────────────────────────────────────────────────────────────
export type ErrorResponse = S['ErrorResponse'];
export type PageMeta      = S['PageMeta'];

// ── Books ────────────────────────────────────────────────────────────────────
export type BookResponse = S['BookResponse'];
export type BookPage     = S['BookPage'];

// ── Categories ───────────────────────────────────────────────────────────────
export type CategoryResponse       = S['CategoryResponse'];
export type CategoryWeightResponse = S['CategoryWeightResponse'];
export type CategoryPage           = S['CategoryPage'];

// ── Users ────────────────────────────────────────────────────────────────────
export type UserResponse        = S['UserResponse'];
export type RegisterUserRequest = S['RegisterUserRequest'];
export type UpdateUserRequest   = S['UpdateUserRequest'];

// ── Shelves ──────────────────────────────────────────────────────────────────
export type ShelfResponse         = S['ShelfResponse'];
export type CreateShelfRequest    = S['CreateShelfRequest'];
export type UpdateShelfRequest    = S['UpdateShelfRequest'];
export type SetBookStateRequest   = S['SetBookStateRequest'];
export type UserBookStateResponse = S['UserBookStateResponse'];
export type UserBookStatePage     = S['UserBookStatePage'];
export type ReadLogEntry          = S['ReadLogEntry'];
export type ReadLogPage           = S['ReadLogPage'];
export type ReadStats             = S['ReadStats'];
export type CategoryReadCount     = S['CategoryReadCount'];

// ── Reviews ──────────────────────────────────────────────────────────────────
export type ReviewRequest  = S['ReviewRequest'];
export type ReviewResponse = S['ReviewResponse'];
export type ReviewPage     = S['ReviewPage'];

// ── Suggestions ──────────────────────────────────────────────────────────────
export type SuggestionRequest         = S['SuggestionRequest'];
export type SuggestionResponse        = S['SuggestionResponse'];
export type SuggestionPage            = S['SuggestionPage'];
export type SuggestionDecisionRequest = S['SuggestionDecisionRequest'];

// ── Generic page wrapper (convenience) ───────────────────────────────────────
export interface Page<T> {
  content: T[];
  page: PageMeta;
}
