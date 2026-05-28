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

function CalendarSmallIcon() {
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
    <div className="flex items-center justify-center gap-3 text-[#f3d58a]" aria-hidden="true">
      <span className="h-px w-32 max-w-[30vw] bg-gradient-to-r from-transparent via-[#9b6b2f]/80 to-[#f3d58a]/85" />
      <span className="relative h-4 w-4 rotate-45 rounded-[2px] border border-[#f3d58a]/80 bg-[#120804] shadow-[0_0_18px_rgba(214,168,79,0.42)]">
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d6a84f]" />
      </span>
      <span className="h-px w-32 max-w-[30vw] bg-gradient-to-l from-transparent via-[#9b6b2f]/80 to-[#f3d58a]/85" />
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
    <div className="relative flex min-h-28 items-center gap-5 overflow-hidden rounded-[8px] border border-[#9b6b2f]/70 bg-[rgba(8,4,2,0.82)] px-5 py-5 shadow-[0_22px_70px_rgba(0,0,0,0.52)] backdrop-blur-[1px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(214,168,79,0.12),transparent_42%)]" />
      <div className="relative flex h-15 w-15 shrink-0 items-center justify-center rounded-full border border-[#d6a84f]/55 bg-[rgba(18,8,4,0.9)] text-[#f3d58a] shadow-[inset_0_0_18px_rgba(214,168,79,0.1),0_0_26px_rgba(214,168,79,0.12)]">
        {icon}
      </div>
      <div className="relative min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/72">{label}</p>
        <p className="mt-1 font-serif text-4xl font-bold leading-none text-[#fff4d8] drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]">
          {value}
        </p>
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
      className="group relative grid gap-5 overflow-hidden rounded-[8px] border border-[#9b6b2f]/58 bg-[rgba(12,6,2,0.92)] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.54)] transition-all duration-300 hover:-translate-y-1 hover:border-[#f3d58a]/70 hover:bg-[rgba(18,8,4,0.96)] hover:shadow-[0_32px_95px_rgba(0,0,0,0.64)] sm:grid-cols-[104px_1fr_auto] sm:items-center sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(214,168,79,0.06),transparent_32%),radial-gradient(circle_at_20%_0%,rgba(243,213,138,0.08),transparent_35%)]" />
      <div className="relative aspect-[2/3] w-24 overflow-hidden rounded-[5px] border border-[#9b6b2f]/70 bg-[#120804] shadow-[0_18px_38px_rgba(0,0,0,0.58)] sm:w-[104px]">
        {entry.book.coverUrl ? (
          <img src={entry.book.coverUrl} alt={entry.book.title} className="h-full w-full object-cover" />
        ) : (
          <Image src="/images/books/no_cover.png" alt="" fill sizes="96px" className="object-cover" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      <div className="relative min-w-0">
        <h3 className="font-serif text-2xl font-bold leading-tight text-[#fff4d8] group-hover:text-white">
          {entry.book.title}
        </h3>
        <p className="mt-1 text-sm font-medium text-[#d6a84f]/76">{entry.book.author}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-[#f3d58a]/70">
          <CalendarSmallIcon />
          <span>Finished {completedDate}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {displayCategories.length > 0 ? (
            <>
              {displayCategories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full border border-[#9b6b2f]/70 bg-[rgba(18,8,4,0.88)] px-3 py-1 text-xs font-semibold text-[#d6a84f]/88 shadow-[inset_0_0_10px_rgba(214,168,79,0.06)]"
                >
                  {category.name}
                </span>
              ))}
              {hiddenCategoryCount > 0 && (
                <span className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(18,8,4,0.82)] px-3 py-1 text-xs font-semibold text-[#d6a84f]/66">
                  +{hiddenCategoryCount}
                </span>
              )}
            </>
          ) : (
            <span className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(18,8,4,0.82)] px-3 py-1 text-xs font-semibold text-[#d6a84f]/66">
              Uncategorized
            </span>
          )}
        </div>
      </div>

      <div className="relative hidden text-[#d6a84f]/78 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#f3d58a] sm:block">
        <ArrowIcon />
      </div>
    </Link>
  );
}

function TimelineGroup({ label, entries }: { label: string; entries: ReadLogEntry[] }) {
  return (
    <section className="relative pl-8 sm:pl-11">
      <div className="absolute left-[5px] top-9 h-[calc(100%+1.75rem)] w-px bg-gradient-to-b from-transparent via-[#d6a84f]/70 to-[#9b6b2f]/20" />
      <div className="absolute left-[-3px] top-[4.65rem] h-4 w-4 rounded-full border border-[#f3d58a]/90 bg-[#120804] shadow-[0_0_0_5px_rgba(155,107,47,0.18),0_0_24px_rgba(214,168,79,0.48)]">
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f3d58a]" />
      </div>

      <div className="mb-4 flex items-center gap-4">
        <h2 className="font-serif text-xl font-bold text-[#d6a84f] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">{label}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#9b6b2f]/80 via-[#d6a84f]/35 to-transparent" />
        <span className="hidden h-1.5 w-1.5 rotate-45 border border-[#9b6b2f]/80 sm:block" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        {entries.map((entry) => (
          <ReadLogCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[8px] border border-[#9b6b2f]/40 bg-[rgba(8,4,2,0.82)] p-4">
      <div className="grid animate-pulse gap-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
        <div className="aspect-[2/3] w-24 rounded-[4px] bg-[#120804]" />
        <div>
          <div className="h-6 w-56 max-w-full rounded bg-[#2a1608]" />
          <div className="mt-3 h-4 w-40 rounded bg-[#211006]" />
          <div className="mt-5 h-7 w-32 rounded-full bg-[#1a0d05]" />
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
        className="object-cover opacity-54"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(214,168,79,0.14),transparent_26%),radial-gradient(circle_at_18%_50%,rgba(155,107,47,0.1),transparent_34%),linear-gradient(180deg,rgba(5,3,2,0.56),rgba(5,3,2,0.86)_50%,rgba(0,0,0,0.98))]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
        <section className="mx-auto max-w-4xl text-center">
          <OrnateDivider />
          <h1 className="mt-5 font-serif text-6xl font-bold leading-none text-[#fff4d8] drop-shadow-[0_5px_24px_rgba(0,0,0,0.8)] sm:text-7xl">
            Reading History
          </h1>
          <div className="mx-auto mt-4 h-px w-56 max-w-[70vw] bg-gradient-to-r from-transparent via-[#d6a84f]/70 to-transparent" />
          <p className="mt-5 text-base text-[#d6a84f]/74 sm:text-lg">Every book you&apos;ve marked as finished.</p>
        </section>

        <section className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          <StatCard icon={<BookIcon />} label="Books finished" value={(stats?.totalReads ?? totalElements).toLocaleString()} />
          <StatCard icon={<CalendarIcon />} label="Unique books" value={(stats?.uniqueBooksRead ?? entries.length).toLocaleString()} />
          <StatCard icon={<StarIcon />} label="Top category" value={topCategory?.category.name ?? 'Unsorted'} />
        </section>

        <section className="mx-auto mt-11 max-w-5xl">
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
            <div className="rounded-[8px] border border-[#9b6b2f]/58 bg-[rgba(8,4,2,0.82)] px-6 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,0.56)] backdrop-blur-[1px]">
              <p className="font-serif text-3xl font-bold text-[#fff4d8]">No reading history yet.</p>
              <p className="mx-auto mt-3 max-w-xl text-[#d6a84f]/66">
                Open any shelf and mark a book as read to start filling this archive.
              </p>
            </div>
          )}

          {!isLoading && groupedEntries.length > 0 && (
            <>
              <div className="flex flex-col gap-8">
                {groupedEntries.map((group) => (
                  <TimelineGroup key={group.label} label={group.label} entries={group.entries} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                    disabled={currentPage === 0}
                    className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(8,4,2,0.76)] px-5 py-2.5 text-sm font-semibold text-[#f3d58a] transition-colors hover:border-[#f3d58a]/70 hover:bg-[rgba(18,9,4,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-[#d6a84f]/66">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-full border border-[#9b6b2f]/60 bg-[rgba(8,4,2,0.76)] px-5 py-2.5 text-sm font-semibold text-[#f3d58a] transition-colors hover:border-[#f3d58a]/70 hover:bg-[rgba(18,9,4,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
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
