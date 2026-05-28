'use client';

import { useState, useEffect, useRef } from 'react';
import { suggestionsApi } from '@/lib/api/suggestions';
import { categoriesApi } from '@/lib/api/categories';
import { booksApi } from '@/lib/api/books';
import type { SuggestionType, CategoryResponse, BookResponse } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// bookId is optional — when passed from a book detail page, the book is
// pre-selected and the picker is hidden. Without it, the user must search
// for and select a book before submitting.
// ─────────────────────────────────────────────────────────────────────────────
interface SuggestionFormProps {
  bookId?: string;
}

// The three types a user can suggest — maps directly to the backend enum.
const SUGGESTION_TYPES: { value: SuggestionType; label: string; description: string }[] = [
  {
    value: 'CATEGORY',
    label: 'Category',
    description: 'A broad genre or style (e.g. "Dark Academia", "Romantasy")',
  },
  {
    value: 'TROPE',
    label: 'Trope',
    description: 'A recurring narrative device (e.g. "Enemies to Lovers", "Chosen One")',
  },
  {
    value: 'CONTENT_WARNING',
    label: 'Content Warning',
    description: 'Sensitive content readers should know about (e.g. "Graphic Violence")',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SuggestionForm — lets a logged-in user suggest a Category, Trope, or
// Content Warning. Submissions are queued for AI vetting → admin review.
//
// For the CATEGORY type we fetch the existing taxonomy from GET /categories
// and show a live combo-box. This prevents accidental duplicates like
// "darkfantasy", "dark fantasy", "Dark-Fantasy" all being submitted as
// separate suggestions for the same concept.
// ─────────────────────────────────────────────────────────────────────────────
export function SuggestionForm({ bookId }: SuggestionFormProps) {
  // ── Form field state ───────────────────────────────────────────────────────
  const [type,        setType]        = useState<SuggestionType>('CATEGORY');
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');

  // ── Category autocomplete state ────────────────────────────────────────────
  // allCategories is loaded once and cached for the lifetime of this form.
  // Think of it like a local in-memory List<Category> loaded at startup.
  const [allCategories,     setAllCategories]     = useState<CategoryResponse[]>([]);
  const [categoriesLoaded,  setCategoriesLoaded]  = useState(false);
  const [showDropdown,      setShowDropdown]       = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // ── Submission state ───────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  // ── Book picker state (only used when no bookId prop is supplied) ──────────
  const [bookQuery,        setBookQuery]        = useState('');
  const [bookResults,      setBookResults]      = useState<BookResponse[]>([]);
  const [selectedBook,     setSelectedBook]     = useState<BookResponse | null>(null);
  const [bookSearching,    setBookSearching]    = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const bookSearchRef = useRef<HTMLDivElement>(null);

  // ── Load the category taxonomy when the user switches to CATEGORY type ─────
  // We only fetch once — after that the list is already in allCategories.
  // Graceful degradation: if the fetch fails we just fall back to plain text.
  useEffect(() => {
    if (type !== 'CATEGORY' || categoriesLoaded) return;

    categoriesApi.listCategories()
      .then((page) => setAllCategories(page.content))
      .catch(() => {}) // fail silently — form still works without autocomplete
      .finally(() => setCategoriesLoaded(true));
  }, [type, categoriesLoaded]);

  // ── Close the dropdown when the user clicks outside the combo-box ──────────
  // This is the standard "click-outside" pattern — attach a listener to the
  // document and check whether the click target is inside our wrapper ref.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Close the book dropdown when the user clicks outside ──────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bookSearchRef.current && !bookSearchRef.current.contains(e.target as Node)) {
        setShowBookDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Debounced book search ─────────────────────────────────────────────────
  // Fires 300 ms after the user stops typing. Skipped when bookId is supplied
  // as a prop (the book is already known from the book detail page).
  useEffect(() => {
    if (bookId) return;
    const q = bookQuery.trim();
    if (q.length < 2) {
      setBookResults([]);
      setShowBookDropdown(false);
      return;
    }
    setBookSearching(true);
    const timer = setTimeout(() => {
      booksApi
        .searchBooks({ q, size: 8 })
        .then((page) => {
          setBookResults(page.content);
          setShowBookDropdown(true);
        })
        .catch(() => setBookResults([]))
        .finally(() => setBookSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [bookQuery, bookId]);

  // ── Derived: matching categories for the current input ────────────────────
  // Filtered live as the user types. Like a Java Stream.filter() on the list.
  // Capped at 8 results so the dropdown doesn't overflow.
  const filteredCategories =
    type === 'CATEGORY' && name.trim()
      ? allCategories
          .filter((c) => c.name.toLowerCase().includes(name.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  // ── Derived: does the typed name exactly match an existing category? ───────
  // Used to show "existing" vs "new" feedback below the input.
  const exactMatch =
    type === 'CATEGORY' &&
    name.trim() !== '' &&
    allCategories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());

  // ── Handle type toggle ─────────────────────────────────────────────────────
  const handleTypeChange = (next: SuggestionType) => {
    setType(next);
    setShowDropdown(false);
    setName('');       // clear the name so the placeholder updates correctly
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    setShowBookDropdown(false);

    const resolvedBookId = bookId ?? selectedBook?.id ?? null;
    if (!resolvedBookId) {
      setErrorMsg('Please select a book to attach this suggestion to.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a name for your suggestion.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload: Record<string, string> = { name: trimmedName };
      if (description.trim()) payload.description = description.trim();

      await suggestionsApi.submitSuggestion({
        type,
        bookId: resolvedBookId,
        payload,
      });

      setSuccessMsg('Your suggestion is pending AI review. Thank you!');
      setName('');
      setDescription('');
      setSelectedBook(null);
      setBookQuery('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not submit your suggestion. Please try again.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* ── Book picker ── */}
      {/* Hidden when bookId is supplied as a prop (e.g. from a book detail page). */}
      {!bookId && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d6a84f]/78">
            Book <span className="text-[#f3d58a]">*</span>
          </label>
          {selectedBook ? (
            <div className="flex items-center gap-3 rounded-[8px] border border-[#d6a84f]/50 bg-[rgba(104,61,5,0.36)] px-3 py-2.5">
              {selectedBook.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedBook.coverUrl}
                  alt=""
                  className="h-12 w-8 flex-shrink-0 rounded-[3px] object-cover shadow-md"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#fff4d8]">{selectedBook.title}</p>
                <p className="truncate text-xs text-[#d6a84f]/72">{selectedBook.author}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedBook(null); setBookQuery(''); }}
                className="ml-1 text-[#d6a84f]/60 transition-colors hover:text-[#f3d58a]"
                aria-label="Clear selected book"
              >
                ✕
              </button>
            </div>
          ) : (
            <div ref={bookSearchRef} className="relative">
              <input
                type="text"
                autoComplete="off"
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                onFocus={() => { if (bookResults.length > 0) setShowBookDropdown(true); }}
                onKeyDown={(e) => { if (e.key === 'Escape') setShowBookDropdown(false); }}
                placeholder="Search by title or author…"
                className="w-full rounded-[8px] border border-[#9b6b2f]/55 bg-[rgba(8,4,2,0.82)] px-3 py-2.5 text-sm text-[#fff4d8] placeholder:text-[#9b6b2f]/70 focus:border-[#f3d58a]/75 focus:outline-none"
              />
              {bookSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#d6a84f]/60">Searching…</span>
              )}
              {showBookDropdown && bookResults.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-[8px] border border-[#9b6b2f]/65 bg-[#0c0602] py-1 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
                  {bookResults.map((book) => (
                    <li key={book.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedBook(book);
                          setBookQuery('');
                          setShowBookDropdown(false);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[rgba(104,61,5,0.52)]"
                      >
                        {book.coverUrl
                          ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={book.coverUrl} alt="" className="h-10 w-7 flex-shrink-0 rounded-[3px] object-cover" />
                          ) : (
                            <div className="h-10 w-7 flex-shrink-0 rounded-[3px] bg-[#1a0d05]" />
                          )
                        }
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[#fff4d8]">{book.title}</p>
                          <p className="truncate text-xs text-[#d6a84f]/70">{book.author}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Type selector ── */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d6a84f]/78">Suggestion type</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {SUGGESTION_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
              className={`flex-1 rounded-[8px] border px-4 py-3 text-left text-sm transition-all duration-200
                ${type === option.value
                  ? 'border-[#f3d58a]/70 bg-[rgba(104,61,5,0.68)] text-[#fff4d8] shadow-[0_0_22px_rgba(214,168,79,0.18)]'
                  : 'border-[#9b6b2f]/50 bg-[rgba(12,6,2,0.72)] text-[#d6a84f]/68 hover:border-[#d6a84f]/65 hover:bg-[rgba(18,8,4,0.86)] hover:text-[#f3d58a]'
                }`}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="mt-0.5 block text-xs opacity-70">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Name field ── */}
      {/* For CATEGORY: combo-box with autocomplete against existing taxonomy */}
      {/* For TROPE / CONTENT_WARNING: plain text input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-name" className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d6a84f]/78">
          Name <span className="text-[#f3d58a]">*</span>
        </label>

        {type === 'CATEGORY' ? (
          // ── Combo-box ───────────────────────────────────────────────────────
          // The wrapper div is what we track for "click outside" detection.
          <div ref={comboboxRef} className="relative">
            <input
              id="suggestion-name"
              type="text"
              autoComplete="off"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowDropdown(true); // open dropdown as they type
              }}
              onFocus={() => { if (name.trim()) setShowDropdown(true); }}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowDropdown(false); }}
              placeholder='e.g. "Dark Fantasy", "Cosy Mystery"'
              maxLength={100}
              className="w-full rounded-[8px] border border-[#9b6b2f]/55 bg-[rgba(8,4,2,0.82)] px-3 py-2.5 text-sm text-[#fff4d8] placeholder:text-[#9b6b2f]/70 focus:border-[#f3d58a]/75 focus:outline-none"
            />

            {/* Dropdown — only shown when there are matches */}
            {showDropdown && filteredCategories.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-[8px] border border-[#9b6b2f]/65 bg-[#0c0602] py-1 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
                {filteredCategories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        // mousedown fires before the input's blur, so prevent
                        // the input from losing focus before we set the value
                        e.preventDefault();
                        setName(cat.name);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[#d6a84f]/82 transition-colors hover:bg-[rgba(104,61,5,0.52)] hover:text-[#f3d58a]"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // ── Plain text input for Trope / Content Warning ────────────────────
          <input
            id="suggestion-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'TROPE' ? 'e.g. "Enemies to Lovers"' : 'e.g. "Graphic Violence"'}
            maxLength={100}
            className="rounded-[8px] border border-[#9b6b2f]/55 bg-[rgba(8,4,2,0.82)] px-3 py-2.5 text-sm text-[#fff4d8] placeholder:text-[#9b6b2f]/70 focus:border-[#f3d58a]/75 focus:outline-none"
          />
        )}

        {/* ── Existing vs new category indicator ── */}
        {/* This is the key duplicate-prevention UX: users immediately see */}
        {/* whether their input matches something already in the taxonomy.  */}
        {type === 'CATEGORY' && name.trim() && (
          exactMatch ? (
            <p className="text-xs text-emerald-300">
              ✓ Existing category — you&apos;re suggesting this book be tagged with it
            </p>
          ) : (
            <p className="text-xs text-[#d6a84f]/60">
              + New category — you&apos;re proposing this be added to the taxonomy
            </p>
          )
        )}
      </div>

      {/* ── Description field (optional) ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="suggestion-desc" className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d6a84f]/78">
          Description <span className="text-[#9b6b2f] text-xs font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id="suggestion-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly explain what this means or why it applies to this book..."
          rows={3}
          maxLength={500}
          className="resize-none rounded-[8px] border border-[#9b6b2f]/55 bg-[rgba(8,4,2,0.82)] px-3 py-2.5 text-sm text-[#fff4d8] placeholder:text-[#9b6b2f]/70 focus:border-[#f3d58a]/75 focus:outline-none"
        />
      </div>

      {/* ── Feedback messages ── */}
      {successMsg && (
        <p className="rounded-[8px] border border-emerald-400/25 bg-emerald-950/55 px-4 py-3 text-sm text-emerald-200">
          {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="rounded-[8px] border border-red-400/25 bg-red-950/55 px-4 py-3 text-sm text-red-200">
          {errorMsg}
        </p>
      )}

      {/* ── Submit button ── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting || (!bookId && !selectedBook)}
          className="rounded-full border border-[#d6a84f]/65 bg-[rgba(104,61,5,0.72)] px-5 py-2.5 text-sm font-bold text-[#fff4d8] transition-colors hover:border-[#f3d58a]/80 hover:bg-[rgba(130,77,8,0.76)] disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
        <p className="text-xs text-[#d6a84f]/56">
          Suggestions are reviewed by AI and then our moderators.
        </p>
      </div>

    </form>
  );
}
