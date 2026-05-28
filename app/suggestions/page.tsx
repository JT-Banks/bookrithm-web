'use client';

/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { suggestionsApi } from '@/lib/api/suggestions';
import { SuggestionForm } from '@/components/features/SuggestionForm';
import type { SuggestionResponse, SuggestionType, SuggestionStatus } from '@/types/api';

type SuggestionFilter = 'ALL' | 'SUBMISSIONS' | 'CONTENT_WARNING';

const STATUS_STYLES: Record<SuggestionStatus, string> = {
  PENDING: 'border-[#d6a84f]/50 bg-[rgba(104,61,5,0.72)] text-[#f3d58a]',
  APPROVED: 'border-emerald-400/35 bg-emerald-950/70 text-emerald-200',
  REJECTED: 'border-red-400/35 bg-red-950/70 text-red-200',
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  CATEGORY: 'Category',
  TROPE: 'Trope',
  CONTENT_WARNING: 'Content Warning',
};

const FILTERS: Array<{ value: SuggestionFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMISSIONS', label: 'Submissions' },
  { value: 'CONTENT_WARNING', label: 'Content Warnings' },
];

function SearchLineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M4 6.5h12M4 10h12M4 13.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 4.5v11M13 4.5v11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".72" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path
        d="M10 3.2 17.2 16H2.8L10 3.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M10 7.5v3.8M10 14h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path
        d="m10 2.8 1.6 4.5 4.7 1.7-4.7 1.7L10 15.2l-1.6-4.5L3.7 9l4.7-1.7L10 2.8Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatherIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        d="M20.5 3.5c-6 .2-11.8 4.4-13.7 10.1L5.5 17.5l3.9-1.3c5.7-1.9 9.9-7.7 11.1-12.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M13.5 10.5 4 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M6 2.8v2.4M14 2.8v2.4M4.2 7.2h11.6M5.2 4.4h9.6a1.7 1.7 0 0 1 1.7 1.7v8.7a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V6.1a1.7 1.7 0 0 1 1.7-1.7Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrnateDivider() {
  return (
    <div className="flex items-center gap-3 text-[#f3d58a]" aria-hidden="true">
      <span className="h-px w-36 max-w-[30vw] bg-gradient-to-r from-[#d6a84f]/90 via-[#9b6b2f]/70 to-transparent" />
      <span className="h-2 w-2 rotate-45 border border-[#d6a84f]/80 bg-[#120804] shadow-[0_0_14px_rgba(214,168,79,0.38)]" />
      <span className="h-px w-36 max-w-[30vw] bg-gradient-to-l from-[#d6a84f]/90 via-[#9b6b2f]/70 to-transparent" />
    </div>
  );
}

function getSuggestionName(suggestion: SuggestionResponse) {
  return (suggestion.payload?.name as string | undefined) ?? 'Untitled suggestion';
}

function getSuggestionDescription(suggestion: SuggestionResponse) {
  return suggestion.payload?.description as string | undefined;
}

function getTypeIcon(type: SuggestionType) {
  if (type === 'CONTENT_WARNING') return <WarningIcon />;
  if (type === 'TROPE') return <SearchLineIcon />;
  return <SparkIcon />;
}

function matchesFilter(suggestion: SuggestionResponse, filter: SuggestionFilter) {
  if (filter === 'ALL') return true;
  if (filter === 'CONTENT_WARNING') return suggestion.type === 'CONTENT_WARNING';
  return suggestion.type !== 'CONTENT_WARNING';
}

function SuggestionCard({ suggestion }: { suggestion: SuggestionResponse }) {
  const name = getSuggestionName(suggestion);
  const description = getSuggestionDescription(suggestion);
  const submittedAt = new Date(suggestion.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const cardContent = (
    <div className="group relative grid gap-5 overflow-hidden rounded-[8px] border border-[#9b6b2f]/58 bg-[rgba(12,6,2,0.9)] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.52)] transition-all duration-300 hover:-translate-y-1 hover:border-[#f3d58a]/70 hover:bg-[rgba(18,8,4,0.96)] hover:shadow-[0_32px_95px_rgba(0,0,0,0.64)] sm:grid-cols-[96px_1fr_auto] sm:items-center sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(214,168,79,0.07),transparent_32%),radial-gradient(circle_at_20%_0%,rgba(243,213,138,0.08),transparent_34%)]" />

      <div className="relative aspect-[2/3] w-24 overflow-hidden rounded-[5px] border border-[#9b6b2f]/70 bg-[#120804] shadow-[0_18px_38px_rgba(0,0,0,0.58)]">
        {suggestion.book?.coverUrl ? (
          <img src={suggestion.book.coverUrl} alt={suggestion.book.title} className="h-full w-full object-cover" />
        ) : (
          <Image src="/images/books/no_cover.png" alt="" fill sizes="96px" className="object-cover" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9b6b2f]/60 bg-[rgba(18,8,4,0.86)] px-3 py-1 text-xs font-semibold text-[#d6a84f]/88">
            {getTypeIcon(suggestion.type)}
            {TYPE_LABELS[suggestion.type]}
          </span>
          <span className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(80,45,6,0.56)] px-3 py-1 text-xs font-semibold text-[#f3d58a]">
            {name}
          </span>
        </div>

        <h3 className="font-serif text-2xl font-bold leading-tight text-[#fff4d8] group-hover:text-white">
          {suggestion.book?.title ?? name}
        </h3>
        {description && <p className="mt-2 text-sm leading-6 text-[#d6a84f]/74">{description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#f3d58a]/64">
          <CalendarIcon />
          <span>{submittedAt}</span>
          <span className="text-[#9b6b2f]">•</span>
          <span>{TYPE_LABELS[suggestion.type]}</span>
        </div>
      </div>

      <div className="relative flex items-center gap-4 sm:justify-end">
        <span className={`rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] ${STATUS_STYLES[suggestion.status]}`}>
          {suggestion.status}
        </span>
        {suggestion.book && (
          <span className="hidden text-[#d6a84f]/78 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#f3d58a] sm:block">
            <ArrowIcon />
          </span>
        )}
      </div>
    </div>
  );

  if (suggestion.book) {
    return (
      <Link href={`/books/${suggestion.book.id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

function SectionHeading({ count }: { count: number }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d6a84f]/70 bg-[rgba(18,8,4,0.9)] text-[#f3d58a] shadow-[0_0_24px_rgba(214,168,79,0.2)]">
        <FeatherIcon />
      </span>
      <h2 className="font-serif text-2xl font-bold text-[#fff4d8]">Submission History</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-[#9b6b2f]/80 via-[#d6a84f]/35 to-transparent" />
      <span className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(80,45,6,0.72)] px-3 py-1 text-sm font-bold text-[#f3d58a]">
        {count}
      </span>
    </div>
  );
}

export default function SuggestionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SuggestionFilter>('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    setIsLoading(true);
    setError(null);

    suggestionsApi
      .getSuggestions(page)
      .then((data) => {
        setSuggestions(data.content);
        setTotalPages(data.page.totalPages);
      })
      .catch(() => setError('Failed to load suggestions. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [user, authLoading, page]);

  const filteredSuggestions = useMemo(
    () => suggestions.filter((suggestion) => matchesFilter(suggestion, activeFilter)),
    [suggestions, activeFilter],
  );

  if (authLoading) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080503] text-amber-50">
      <Image
        src="/images/backgrounds/bg-library.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-56"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(214,168,79,0.17),transparent_26%),radial-gradient(circle_at_16%_48%,rgba(155,107,47,0.11),transparent_34%),linear-gradient(180deg,rgba(5,3,2,0.52),rgba(5,3,2,0.86)_52%,rgba(0,0,0,0.98))]" />
      <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h1 className="font-serif text-6xl font-bold leading-none text-[#fff4d8] drop-shadow-[0_5px_24px_rgba(0,0,0,0.8)] sm:text-7xl">
              My Suggestions
            </h1>
            <div className="mt-5">
              <OrnateDivider />
            </div>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#d6a84f]/78 sm:text-lg">
              Track your submitted ideas, content warnings, and taxonomy requests.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex min-h-16 items-center justify-center gap-4 rounded-[8px] border border-[#d6a84f]/70 bg-[rgba(12,6,2,0.82)] px-7 py-4 text-base font-bold text-[#fff4d8] shadow-[0_20px_70px_rgba(0,0,0,0.52),0_0_24px_rgba(214,168,79,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f3d58a] hover:bg-[rgba(18,8,4,0.94)]"
          >
            <span>{showForm ? 'Close Form' : '+ New Suggestion'}</span>
            <span className="text-[#f3d58a]">
              <FeatherIcon />
            </span>
          </button>
        </section>

        <section className="mt-9">
          <div className="inline-flex max-w-full flex-wrap overflow-hidden rounded-[8px] border border-[#9b6b2f]/58 bg-[rgba(8,4,2,0.78)] p-1 shadow-[0_18px_60px_rgba(0,0,0,0.48)] backdrop-blur-[1px]">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`inline-flex min-h-12 items-center gap-2 rounded-[6px] px-5 text-sm font-bold transition-all duration-200 ${
                  activeFilter === filter.value
                    ? 'bg-[rgba(104,61,5,0.78)] text-[#f3d58a] shadow-[inset_0_0_0_1px_rgba(243,213,138,0.32),0_0_22px_rgba(214,168,79,0.24)]'
                    : 'text-[#d6a84f]/76 hover:bg-[rgba(18,8,4,0.76)] hover:text-[#f3d58a]'
                }`}
              >
                {filter.value === 'ALL' ? <SparkIcon /> : filter.value === 'CONTENT_WARNING' ? <WarningIcon /> : <SearchLineIcon />}
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {showForm && (
          <section className="mt-7 rounded-[8px] border border-[#9b6b2f]/58 bg-[rgba(8,4,2,0.82)] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.54)] backdrop-blur-[1px] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6a84f]/60 bg-[rgba(18,8,4,0.9)] text-[#f3d58a]">
                <FeatherIcon />
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#fff4d8]">Submit a Suggestion</h2>
            </div>
            <SuggestionForm />
          </section>
        )}

        <section className="mt-10">
          <SectionHeading count={filteredSuggestions.length} />

          {isLoading && (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[8px] border border-[#9b6b2f]/40 bg-[rgba(8,4,2,0.82)] p-5">
                  <div className="grid animate-pulse gap-5 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                    <div className="aspect-[2/3] w-24 rounded-[5px] bg-[#120804]" />
                    <div>
                      <div className="h-6 w-56 max-w-full rounded bg-[#2a1608]" />
                      <div className="mt-3 h-4 w-72 max-w-full rounded bg-[#211006]" />
                      <div className="mt-5 h-7 w-32 rounded-full bg-[#1a0d05]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-[8px] border border-red-500/35 bg-red-950/45 px-5 py-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && (
            <div className="rounded-[8px] border border-[#9b6b2f]/58 bg-[rgba(8,4,2,0.82)] px-6 py-14 text-center shadow-[0_24px_80px_rgba(0,0,0,0.56)] backdrop-blur-[1px]">
              <p className="font-serif text-3xl font-bold text-[#fff4d8]">No suggestions yet.</p>
              <p className="mx-auto mt-3 max-w-xl text-[#d6a84f]/66">
                Submit an idea to help shape the library taxonomy.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-full border border-[#9b6b2f]/60 bg-[rgba(18,8,4,0.88)] px-5 py-2.5 text-sm font-bold text-[#f3d58a] hover:border-[#f3d58a]/70"
              >
                Submit your first suggestion
              </button>
            </div>
          )}

          {!isLoading && !error && suggestions.length > 0 && filteredSuggestions.length === 0 && (
            <div className="rounded-[8px] border border-[#9b6b2f]/58 bg-[rgba(8,4,2,0.82)] px-6 py-12 text-center text-[#d6a84f]/66">
              No suggestions match this filter.
            </div>
          )}

          {!isLoading && !error && filteredSuggestions.length > 0 && (
            <div className="flex flex-col gap-5">
              {filteredSuggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                disabled={page === 0}
                className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(8,4,2,0.76)] px-5 py-2.5 text-sm font-semibold text-[#f3d58a] transition-colors hover:border-[#f3d58a]/70 hover:bg-[rgba(18,9,4,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[#d6a84f]/66">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((currentPage) => Math.min(totalPages - 1, currentPage + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(8,4,2,0.76)] px-5 py-2.5 text-sm font-semibold text-[#f3d58a] transition-colors hover:border-[#f3d58a]/70 hover:bg-[rgba(18,9,4,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
