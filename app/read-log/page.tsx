'use client';

/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { shelvesApi } from '@/lib/api/shelves';
import type { ReadLogEntry, ReadStats } from '@/types/api';

type GroupedEntries = Array<{
  label: string;
  entries: ReadLogEntry[];
}>;

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        d="M5 5.5c2.7-.8 5-.3 7 1.4 2-1.7 4.3-2.2 7-1.4v12.6c-2.7-.8-5-.3-7 1.4-2-1.7-4.3-2.2-7-1.4V5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 6.9v12.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        d="M7 3.5v3M17 3.5v3M4.5 9.5h15M6 5.5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        d="m12 3.4 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrnateDivider() {
  return (
    <div className="flex items-center justify-center gap-3 text-amber-300/70" aria-hidden="true">
      <span className="h-px w-36 max-w-[32vw] bg-gradient-to-r from-transparent via-amber-700/70 to-amber-300/70" />
      <span className="h-4 w-4 rotate-45 rounded-[2px] border border-amber-400/70 bg-amber-950/70 shadow-[0_0_18px_rgba(245,158,11,0.35)]" />
      <span className="h-px w-36 max-w-[32vw] bg-gradient-to-l from-transparent via-amber-700/70 to-amber-300/70" />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-[8px] border border-amber-800/65 bg-black/42 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-amber-900/55 bg-amber-200/10 text-amber-200">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-amber-200/72">{label}</p>
        <p className="font-serif text-3xl font-bold leading-tight text-amber-50">{value}</p>
      </div>
    </div>
  );
}

function formatMonth(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatFinishedDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function groupEntriesByMonth(entries: ReadLogEntry[]): GroupedEntries {
  const groups = new Map<string, ReadLogEntry[]>();

  entries.forEach((entry) => {
    const label = formatMonth(entry.completedAt);
    groups.set(label, [...(groups.get(label) ?? []), entry]);
  });

  return Array.from(groups.entries()).map(([label, groupEntries]) => ({
    label,
    entries: groupEntries,
  }));
}

function ReadLogCard({ entry }: { entry: ReadLogEntry }) {
  const completedDate = formatFinishedDate(entry.completedAt);
  const displayCategories = entry.categories.slice(0, 3);
  const hiddenCategoryCount = Math.max(0, entry.categories.length - displayCategories.length);

  return (
    <Link
      href={`/books/${entry.book.id}`}
      className="group relative grid gap-4 rounded-[8px] border border-amber-900/55 bg-[#120b07]/82 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/65 hover:bg-[#170d08]/88 sm:grid-cols-[96px_1fr_auto] sm:items-center"
    >
      <div className="relative aspect-[2/3] w-24 overflow-hidden rounded-[4px] border border-amber-800/60 bg-[#26140a] shadow-[0_16px_32px_rgba(0,0,0,0.5)]">
        {entry.book.coverUrl ? (
          <img src={entry.book.coverUrl} alt={entry.book.title} className="h-full w-full object-cover" />
        ) : (
          <Image src="/images/books/no_cover.png" alt="" fill sizes="96px" className="object-cover" />
        )}
      </div>

      <div className="min-w-0">
        <h3 className="font-serif text-2xl font-bold leading-tight text-amber-50 group-hover:text-white">
          {entry.book.title}
        </h3>
        <p className="mt-1 text-sm text-amber-200/62">{entry.book.author}</p>
        <p className="mt-2 text-sm text-amber-200/75">Finished {completedDate}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {displayCategories.length > 0 ? (
            <>
              {displayCategories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-[4px] border border-amber-900/55 bg-black/28 px-2.5 py-1 text-xs font-medium text-amber-200/72"
                >
                  {category.name}
                </span>
              ))}
              {hiddenCategoryCount > 0 && (
                <span className="rounded-[4px] border border-amber-900/55 bg-black/28 px-2.5 py-1 text-xs font-medium text-amber-200/58">
                  +{hiddenCategoryCount}
                </span>
              )}
            </>
          ) : (
            <span className="rounded-[4px] border border-amber-900/55 bg-black/28 px-2.5 py-1 text-xs font-medium text-amber-200/58">
              Uncategorized
            </span>
          )}
        </div>
      </div>

      <div className="hidden text-amber-300/72 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-amber-100 sm:block">
        <ArrowIcon />
      </div>
    </Link>
  );
}

function TimelineGroup({ label, entries }: { label: string; entries: ReadLogEntry[] }) {
  return (
    <section className="relative pl-10">
      <div className="absolute left-[3px] top-1 h-full w-px bg-gradient-to-b from-amber-400/70 via-amber-800/70 to-amber-950/20" />
      <div className="absolute left-[-8px] top-20 h-6 w-6 rounded-full border border-amber-300/80 bg-[#2a1709] shadow-[0_0_0_6px_rgba(120,72,24,0.24),0_0_28px_rgba(245,158,11,0.38)]" />

      <div className="mb-4 flex items-center gap-4">
        <h2 className="font-serif text-xl font-bold text-amber-300">{label}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-amber-700/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <ReadLogCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[8px] border border-amber-950/60 bg-black/38 p-4">
      <div className="grid animate-pulse gap-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
        <div className="aspect-[2/3] w-24 rounded-[4px] bg-amber-950/45" />
        <div>
          <div className="h-6 w-56 max-w-full rounded bg-amber-950/45" />
          <div className="mt-3 h-4 w-40 rounded bg-amber-950/35" />
          <div className="mt-5 h-7 w-32 rounded bg-amber-950/30" />
        </div>
      </div>
    </div>
  );
}

export default function ReadLogPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<ReadLogEntry[]>([]);
  const [stats, setStats] = useState<ReadStats | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    setIsLoading(true);
    setError(null);

    Promise.allSettled([shelvesApi.getReadLog(currentPage), shelvesApi.getStats()])
      .then(([logResult, statsResult]) => {
        if (logResult.status === 'rejected') {
          throw logResult.reason;
        }

        setEntries(logResult.value.content);
        setTotalPages(logResult.value.page.totalPages);
        setTotalElements(logResult.value.page.totalElements);

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
        }
      })
      .catch(() => setError('Failed to load reading history. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [user, authLoading, currentPage]);

  const groupedEntries = useMemo(() => groupEntriesByMonth(entries), [entries]);
  const topCategory = stats?.topCategories?.[0];

  if (authLoading) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080503] text-amber-50">
      <Image
        src="/images/backgrounds/bg-library.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-64"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,228,177,0.12),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.74)_55%,rgba(0,0,0,0.96))]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <section className="text-center">
          <OrnateDivider />
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none text-amber-50 drop-shadow-[0_4px_20px_rgba(0,0,0,0.72)] sm:text-6xl">
            Reading History
          </h1>
          <p className="mt-5 text-base text-amber-200/72 sm:text-lg">Every book you&apos;ve marked as finished.</p>
        </section>

        <section className="mx-auto mt-9 grid max-w-5xl gap-4 md:grid-cols-3">
          <StatCard icon={<BookIcon />} label="Books finished" value={(stats?.totalReads ?? totalElements).toLocaleString()} />
          <StatCard icon={<CalendarIcon />} label="Unique books" value={(stats?.uniqueBooksRead ?? entries.length).toLocaleString()} />
          <StatCard icon={<StarIcon />} label="Top category" value={topCategory?.category.name ?? 'Unsorted'} />
        </section>

        <section className="mx-auto mt-10 max-w-5xl">
          {error && (
            <div className="mb-6 rounded-[8px] border border-red-500/35 bg-red-950/40 px-5 py-4 text-red-100">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="pl-10">
              <div className="mb-4 h-6 w-40 animate-pulse rounded bg-amber-950/45" />
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && entries.length === 0 && (
            <div className="rounded-[8px] border border-amber-950/65 bg-black/45 px-6 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <p className="font-serif text-3xl font-bold text-amber-50">No reading history yet.</p>
              <p className="mx-auto mt-3 max-w-xl text-amber-200/58">
                Open any shelf and mark a book as read to start filling this archive.
              </p>
            </div>
          )}

          {!isLoading && groupedEntries.length > 0 && (
            <>
              <div className="flex flex-col gap-7">
                {groupedEntries.map((group) => (
                  <TimelineGroup key={group.label} label={group.label} entries={group.entries} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                    disabled={currentPage === 0}
                    className="rounded-full border border-amber-900/55 bg-black/45 px-5 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-400/65 hover:bg-amber-950/35 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-amber-200/58">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-full border border-amber-900/55 bg-black/45 px-5 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-400/65 hover:bg-amber-950/35 disabled:cursor-not-allowed disabled:opacity-40"
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
