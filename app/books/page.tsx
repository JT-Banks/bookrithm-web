'use client';

/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { booksApi } from '@/lib/api/books';
import { categoriesApi } from '@/lib/api/categories';
import { logger } from '@/lib/utils/logger';
import type { BookResponse, BookPage, CategoryResponse, BookSortBy } from '@/types/api';

const SORT_OPTIONS: Array<{ value: BookSortBy; label: string; helper: string }> = [
  { value: 'READS', label: 'Most Read', helper: 'popular reads' },
  { value: 'SHELVED', label: 'Most Shelved', helper: 'reader shelves' },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M12 3.5 13.9 9l5.6 2-5.6 2L12 18.5 10.1 13l-5.6-2 5.6-2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m19 16 .7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16Z" fill="currentColor" />
    </svg>
  );
}

function OrnateDivider() {
  return (
    <div className="flex items-center justify-center gap-4 text-amber-300/70" aria-hidden="true">
      <span className="h-px w-24 max-w-[28vw] bg-gradient-to-r from-transparent via-amber-700/70 to-amber-300/80" />
      <span className="relative h-3 w-3 rotate-45 border border-amber-400/70 bg-amber-950/70 shadow-[0_0_18px_rgba(245,158,11,0.35)]" />
      <span className="h-px w-24 max-w-[28vw] bg-gradient-to-l from-transparent via-amber-700/70 to-amber-300/80" />
    </div>
  );
}

function CategoryButton({
  isActive,
  children,
  onClick,
}: {
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'border-amber-300/80 bg-amber-300/15 text-amber-100 shadow-[0_0_24px_rgba(180,117,40,0.25)]'
          : 'border-amber-900/45 bg-[rgba(8,4,2,0.68)] text-amber-200/75 hover:border-amber-500/70 hover:bg-[rgba(18,9,4,0.82)] hover:text-amber-100'
      }`}
    >
      {children}
    </button>
  );
}

function BookCard({ book }: { book: BookResponse }) {
  const hasCover = Boolean(book.coverUrl);

  return (
    <Link
      href={`/books/${book.id}`}
      className="group relative flex min-h-[28rem] flex-col overflow-hidden rounded-[8px] border border-amber-950/70 bg-[rgba(13,7,4,0.9)] shadow-[0_24px_60px_rgba(0,0,0,0.42)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/65 hover:bg-[rgba(18,9,4,0.94)] hover:shadow-[0_28px_75px_rgba(0,0,0,0.62)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12),transparent_38%),linear-gradient(180deg,rgba(80,38,12,0.08),transparent_42%)] opacity-80" />
      <div className="relative mx-4 mt-4 aspect-[2/3] overflow-hidden rounded-[4px] border border-amber-900/55 bg-[#27150b] shadow-[0_18px_32px_rgba(0,0,0,0.5)]">
        {hasCover ? (
          <img
            src={book.coverUrl ?? undefined}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <Image
            src="/images/books/no_cover.png"
            alt=""
            fill
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 210px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />
      </div>

      <div className="relative flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-serif text-lg font-bold leading-snug text-amber-50 line-clamp-2 group-hover:text-white">
            {book.title}
          </h3>
          <p className="mt-1 text-sm text-amber-200/62 line-clamp-1">{book.author}</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-900/50 bg-[rgba(0,0,0,0.72)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200/70">
            {book.maturity}
          </span>
          {book.isFanfiction && (
            <span className="rounded-full border border-purple-400/35 bg-purple-950/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-purple-100/80">
              Fanfiction
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function BookSkeleton() {
  return (
    <div className="min-h-[28rem] animate-pulse rounded-[8px] border border-amber-950/55 bg-[rgba(8,4,2,0.78)] p-4">
      <div className="aspect-[2/3] rounded-[4px] bg-amber-950/35" />
      <div className="mt-5 h-5 w-3/4 rounded bg-amber-950/40" />
      <div className="mt-3 h-4 w-1/2 rounded bg-amber-950/30" />
      <div className="mt-8 h-7 w-24 rounded-full bg-amber-950/30" />
    </div>
  );
}

function getShelfCopy(debouncedQuery: string, activeCategoryId: string | null, sortBy: BookSortBy) {
  if (debouncedQuery.length >= 2) {
    return `Results for "${debouncedQuery}"`;
  }

  if (activeCategoryId) {
    return 'Filtered by category';
  }

  return sortBy === 'READS' ? 'Most read in the catalog' : 'Most shelved in the catalog';
}

export default function BooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [page, setPage] = useState<BookPage | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryResponse[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(searchParams.get('categoryId'));
  const [sortBy, setSortBy] = useState<BookSortBy>('READS');

  useEffect(() => {
    categoriesApi
      .listCategories()
      .then((data) => setAllCategories(data.content))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(0);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await booksApi.searchBooks({
        q: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
        page: currentPage,
        size: 20,
        categoryId: activeCategoryId ?? undefined,
        sortBy,
      });
      setBooks(result.content);
      setPage(result);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      logger.error('Failed to load books', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, currentPage, activeCategoryId, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const shelfCopy = getShelfCopy(debouncedQuery, activeCategoryId, sortBy);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080503] text-amber-50">
      <Image
        src="/images/backgrounds/browse_page_background"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_9%,rgba(255,221,158,0.12),transparent_28%),linear-gradient(180deg,rgba(5,3,2,0.44),rgba(5,3,2,0.84)_56%,rgba(5,3,2,0.96))]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-5 py-10 sm:px-8 lg:px-10">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.34em] text-amber-300/70">
            Bookrithm Archives
          </p>
          <h1 className="font-serif text-5xl font-bold leading-none text-amber-50 drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)] sm:text-6xl lg:text-7xl">
            Browse Books
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-amber-100/72 sm:text-lg">
            Search the catalog, wander through reader-favorite shelves, and uncover the stories tucked into the stacks.
          </p>
          <div className="mt-7">
            <OrnateDivider />
          </div>
        </section>

        <section className="mx-auto mt-9 w-full max-w-6xl rounded-[8px] border border-amber-950/65 bg-[rgba(8,4,2,0.78)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.56)] backdrop-blur-[2px] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <span className="sr-only">Search by title or author</span>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-200/55">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title or author..."
                className="h-14 w-full rounded-[8px] border border-amber-900/55 bg-[rgba(8,4,2,0.86)] px-12 pr-5 text-base text-amber-50 outline-none transition-colors placeholder:text-amber-200/35 focus:border-amber-400/75 focus:bg-[rgba(0,0,0,0.72)]"
              />
            </label>

            {debouncedQuery.length < 2 && (
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setCurrentPage(0);
                    }}
                    className={`min-h-14 rounded-[8px] border px-4 text-left transition-all duration-200 ${
                      sortBy === option.value
                        ? 'border-amber-300/75 bg-amber-300/14 text-amber-50 shadow-[0_0_28px_rgba(217,119,6,0.22)]'
                        : 'border-amber-950/65 bg-[rgba(8,4,2,0.72)] text-amber-200/68 hover:border-amber-500/65 hover:bg-[rgba(18,9,4,0.86)] hover:text-amber-100'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="block text-xs text-amber-200/45">{option.helper}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {query.length === 1 && (
            <p className="mt-3 text-sm text-amber-200/55">Type at least 2 characters to search</p>
          )}

          {allCategories.length > 0 && (
            <div className="mt-5 border-t border-amber-950/55 pt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300/58">
                <SparkleIcon />
                Categories
              </div>
              <div className="flex flex-wrap gap-2.5">
                <CategoryButton
                  isActive={activeCategoryId === null}
                  onClick={() => {
                    setActiveCategoryId(null);
                    setCurrentPage(0);
                    router.replace('/books');
                  }}
                >
                  All
                </CategoryButton>

                {allCategories.map((category) => (
                  <CategoryButton
                    key={category.id}
                    isActive={activeCategoryId === category.id}
                    onClick={() => {
                      setActiveCategoryId(category.id);
                      setCurrentPage(0);
                      router.replace(`/books?categoryId=${category.id}`);
                    }}
                  >
                    {category.name}
                  </CategoryButton>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mx-auto mt-10 w-full max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300/60">Catalog Selection</p>
              <h2 className="mt-2 font-serif text-4xl font-bold text-amber-50">Trending Now</h2>
              <p className="mt-2 text-amber-200/60">{shelfCopy}</p>
            </div>
            {page && page.page.totalElements > 0 && (
              <p className="text-sm text-amber-200/52">
                {page.page.totalElements.toLocaleString()} volumes found
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-[8px] border border-red-500/35 bg-red-950/40 px-5 py-4 text-red-100">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <BookSkeleton key={index} />
              ))}
            </div>
          )}

          {!isLoading && books.length === 0 && !error && (
            <div className="rounded-[8px] border border-amber-950/65 bg-[rgba(8,4,2,0.78)] px-6 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-[2px]">
              <p className="font-serif text-3xl font-bold text-amber-50">
                {debouncedQuery.length >= 2 && activeCategoryId
                  ? `No books found for "${debouncedQuery}" in this category`
                  : debouncedQuery.length >= 2
                    ? `No books found for "${debouncedQuery}"`
                    : activeCategoryId
                      ? 'No books tagged with this category yet.'
                      : 'No books in the catalog yet.'}
              </p>
              <p className="mx-auto mt-3 max-w-xl text-amber-200/58">
                {activeCategoryId
                  ? 'Try clearing the category filter or searching with different terms.'
                  : debouncedQuery.length >= 2
                    ? 'Try a different title or author name.'
                    : 'Once books are added, this room will start to fill up.'}
              </p>
            </div>
          )}

          {!isLoading && books.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {books.map((book, index) => (
                  <BookCard key={`${book.id}-${index}`} book={book} />
                ))}
              </div>

              {page && page.page.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage((previousPage) => Math.max(0, previousPage - 1))}
                    disabled={currentPage === 0}
                    className="rounded-full border border-amber-900/55 bg-[rgba(8,4,2,0.72)] px-5 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-400/65 hover:bg-[rgba(18,9,4,0.86)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-amber-200/58">
                    Page {currentPage + 1} of {page.page.totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((previousPage) => Math.min(page.page.totalPages - 1, previousPage + 1))}
                    disabled={currentPage >= page.page.totalPages - 1}
                    className="rounded-full border border-amber-900/55 bg-[rgba(8,4,2,0.72)] px-5 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-400/65 hover:bg-[rgba(18,9,4,0.86)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
