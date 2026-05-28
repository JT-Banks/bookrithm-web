'use client';

/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { shelvesApi } from '@/lib/api/shelves';
import type { UpdateUserRequest, ReaderStatus, ReadStats } from '@/types/api';

const READER_STATUSES: { value: ReaderStatus; label: string }[] = [
  { value: 'READING', label: 'Currently Reading' },
  { value: 'COZY_READING', label: 'Cozy Reading' },
  { value: 'BETWEEN_BOOKS', label: 'Between Books' },
  { value: 'SEARCHING', label: 'Searching for Next Read' },
  { value: 'REREADING', label: 'Rereading' },
  { value: 'ON_HIATUS', label: 'On Hiatus' },
  { value: 'BUSY', label: 'Too Busy to Read' },
];

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

function StackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        d="M7 5.5h10v13H7v-13ZM4.5 8h2.5M17 8h2.5M4.5 16h2.5M17 16h2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 8.5h4M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function PersonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path
        d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.8 20c.8-3.6 3.4-5.4 7.2-5.4s6.4 1.8 7.2 5.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeatherIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
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

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path
        d="M12 7.5v5l3.3 2M21 12a9 9 0 1 1-3-6.7M18 3.5v4h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.8 9h16.4M3.8 15h16.4M12 3c2.3 2.3 3.4 5.3 3.4 9S14.3 18.7 12 21c-2.3-2.3-3.4-5.3-3.4-9S9.7 5.3 12 3Z"
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
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrnateDivider() {
  return (
    <div className="flex items-center gap-3 text-[#d6a84f]" aria-hidden="true">
      <span className="h-px w-20 bg-gradient-to-r from-[#d6a84f]/85 via-[#9b6b2f]/60 to-transparent" />
      <span className="h-1.5 w-1.5 rotate-45 border border-[#d6a84f]/80 bg-[#120804]" />
      <span className="h-px w-24 bg-gradient-to-l from-[#d6a84f]/85 via-[#9b6b2f]/60 to-transparent" />
    </div>
  );
}

function getReaderStatusLabel(status?: ReaderStatus) {
  if (!status) return 'Not set';
  return READER_STATUSES.find((item) => item.value === status)?.label ?? status;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="relative min-h-24 overflow-hidden rounded-[8px] border border-[#9b6b2f]/52 bg-[rgba(8,4,2,0.82)] p-4 shadow-[0_18px_58px_rgba(0,0,0,0.48)] backdrop-blur-[1px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(214,168,79,0.12),transparent_42%)]" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d6a84f]/42 bg-[rgba(18,8,4,0.9)] text-[#f3d58a] shadow-[inset_0_0_14px_rgba(214,168,79,0.08),0_0_18px_rgba(214,168,79,0.1)] [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d6a84f]/72">{label}</p>
          <p className="mt-1 truncate font-serif text-2xl font-bold leading-tight text-[#fff4d8]" title={String(value)}>
            {value}
          </p>
        </div>
      </div>
      <div className="relative mt-3 h-px w-20 bg-gradient-to-r from-[#d6a84f]/60 via-[#9b6b2f]/38 to-transparent" />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[22px_1fr_auto] items-center gap-3 border-b border-[#9b6b2f]/20 py-3 last:border-b-0">
      <span className="text-[#d6a84f]">{icon}</span>
      <span className="text-sm font-medium text-[#d6a84f]/78">{label}</span>
      <span className="max-w-[48vw] truncate text-right text-sm font-semibold text-[#fff4d8]" title={value}>
        {value}
      </span>
    </div>
  );
}

function PanelTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 border-b border-[#9b6b2f]/25 pb-3">
      <span className="text-[#d6a84f]">{icon}</span>
      <h2 className="font-serif text-xl font-bold text-[#fff4d8]">{children}</h2>
    </div>
  );
}

function ActivityRow({
  cover,
  title,
  eyebrow,
  meta,
  icon,
}: {
  cover?: string | null;
  title: string;
  eyebrow: string;
  meta: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-[#9b6b2f]/18 py-2.5 last:border-b-0">
      <div className="relative aspect-[2/3] w-[42px] overflow-hidden rounded-[4px] border border-[#9b6b2f]/55 bg-[#120804]">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image
            src="/images/bookrithm_profile_assets/no_cover_placeholder.png"
            alt=""
            fill
            sizes="42px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#d6a84f]/72">{eyebrow}</p>
        <p className="mt-0.5 truncate font-serif text-base font-bold text-[#fff4d8]">{title}</p>
      </div>
      <div className="flex flex-col items-end gap-2 text-right">
        <span className="text-xs text-[#d6a84f]/58">{meta}</span>
        <span className="text-[#d6a84f]">{icon}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReadStats | null>(null);
  const editSectionRef = useRef<HTMLElement | null>(null);

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    readerStatus: '' as ReaderStatus | '',
    isPrivate: false,
  });

  useEffect(() => {
    if (!isLoading && !user) router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName,
        bio: user.bio ?? '',
        readerStatus: user.readerStatus ?? '',
        isPrivate: user.isPrivate,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    shelvesApi
      .getStats()
      .then(setStats)
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!isEditing) return;

    editSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [isEditing]);

  if (isLoading || !user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const body: UpdateUserRequest = {
      displayName: form.displayName,
      bio: form.bio || null,
      isPrivate: form.isPrivate,
      ...(form.readerStatus ? { readerStatus: form.readerStatus } : {}),
    };

    try {
      const updated = await authApi.updateProfile(body);
      updateUser(updated);
      setIsEditing(false);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const topCategory = stats?.topCategories?.[0];
  const readerStatusLabel = getReaderStatusLabel(user.readerStatus);
  const avatarInitial = user.displayName.charAt(0).toUpperCase();
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080503] text-amber-50">
      <Image
        src="/images/bookrithm_profile_assets/library_background.png"
        alt=""
        fill
        priority
        loading="eager"
        sizes="100vw"
        className="object-cover opacity-48"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_14%,rgba(214,168,79,0.1),transparent_24%),radial-gradient(circle_at_12%_54%,rgba(155,107,47,0.08),transparent_34%),linear-gradient(180deg,rgba(3,2,1,0.68),rgba(5,3,2,0.9)_46%,rgba(0,0,0,0.98))]" />
      <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black to-transparent" />

      <div className="relative mx-auto w-full max-w-[1150px] px-5 py-9 sm:px-8 lg:px-10">
        <section>
          <h1 className="font-serif text-5xl font-bold leading-none text-[#fff4d8] drop-shadow-[0_5px_24px_rgba(0,0,0,0.8)] sm:text-6xl">
            My Profile
          </h1>
          <div className="mt-2">
            <OrnateDivider />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f3d58a]/82 sm:text-base">
            Your reading journey, your way.
          </p>
        </section>

        <section className="relative mt-5 overflow-hidden rounded-[8px] border border-[#b98332]/62 bg-[rgba(8,4,2,0.84)] p-5 shadow-[0_22px_78px_rgba(0,0,0,0.62),inset_0_0_0_1px_rgba(243,213,138,0.05)] backdrop-blur-[1px] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(214,168,79,0.1),transparent_35%),radial-gradient(circle_at_8%_8%,rgba(243,213,138,0.1),transparent_26%)]" />
          <div className="pointer-events-none absolute bottom-2 right-2 h-10 w-10 border-b border-r border-[#d6a84f]/46" />
          <div className="relative grid gap-6 lg:grid-cols-[1.35fr_1px_0.9fr] lg:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-32 w-32 shrink-0 rounded-full border border-[#d6a84f]/76 bg-[rgba(18,8,4,0.92)] p-2 shadow-[0_0_0_5px_rgba(155,107,47,0.14),0_0_32px_rgba(214,168,79,0.2)] sm:h-36 sm:w-36">
                <div className="absolute inset-3 rounded-full border border-[#9b6b2f]/55" />
                <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-[#f3d58a]/80 bg-[#120804] shadow-[0_0_14px_rgba(214,168,79,0.35)]" />
                <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-[#d6a84f]/70 bg-[#120804]" />
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="relative h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(214,168,79,0.16),rgba(12,6,2,0.98))] font-serif text-5xl font-bold text-[#fff4d8] sm:text-6xl">
                    {avatarInitial}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-serif text-3xl font-bold text-[#fff4d8] sm:text-4xl">{user.displayName}</h2>
                <p className="mt-1.5 text-lg font-semibold text-[#d6a84f]">@{user.username}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/64">Bio</p>
                  <p className="mt-1.5 max-w-xl text-base leading-7 text-[#fff4d8]/88">
                    {user.bio || 'No bio yet. Add a few lines about your reading life.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden h-40 w-px bg-gradient-to-b from-transparent via-[#9b6b2f]/65 to-transparent lg:block" />

            <div className="grid gap-4">
              <div className="flex gap-3">
                <span className="mt-0.5 text-[#d6a84f] [&>svg]:h-5 [&>svg]:w-5">
                  <PersonIcon />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/64">Reader Status</p>
                  <span className="mt-1.5 inline-flex rounded-full border border-[#9b6b2f]/62 bg-[rgba(18,8,4,0.86)] px-3 py-1.5 text-sm font-semibold text-[#f3d58a]">
                    {readerStatusLabel}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 text-[#d6a84f]">
                  <GlobeIcon />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/64">Account</p>
                  <p className="mt-1 text-base font-semibold text-[#fff4d8]">{user.isPrivate ? 'Private' : 'Public'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 text-[#d6a84f] [&>svg]:h-5 [&>svg]:w-5">
                  <ClockIcon />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/64">Member Since</p>
                  <p className="mt-1 text-base font-semibold text-[#fff4d8]">{joinedDate}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<BookIcon />} label="Total Reads" value={stats?.totalReads ?? 0} />
          <StatCard icon={<StackIcon />} label="Unique Books" value={stats?.uniqueBooksRead ?? 0} />
          <StatCard icon={<StarIcon />} label="Top Category" value={topCategory?.category.name ?? 'Unsorted'} />
          <StatCard icon={<PersonIcon />} label="Account Type" value={user.isPrivate ? 'Private' : 'Public'} />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[8px] border border-[#9b6b2f]/52 bg-[rgba(8,4,2,0.82)] p-5 shadow-[0_20px_68px_rgba(0,0,0,0.5)] backdrop-blur-[1px]">
            <PanelTitle icon={<FeatherIcon />}>Reading Identity</PanelTitle>
            <div>
              <DetailRow icon={<PersonIcon />} label="Reader Status" value={readerStatusLabel} />
              <DetailRow icon={<BookIcon />} label="Favorite Category" value={topCategory?.category.name ?? 'Not enough data'} />
              <DetailRow icon={<StackIcon />} label="Books Finished" value={`${stats?.totalReads ?? 0}`} />
              <DetailRow icon={<GlobeIcon />} label="Profile Visibility" value={user.isPrivate ? 'Private' : 'Public'} />
            </div>
          </div>

          <div className="rounded-[8px] border border-[#9b6b2f]/52 bg-[rgba(8,4,2,0.82)] p-5 shadow-[0_20px_68px_rgba(0,0,0,0.5)] backdrop-blur-[1px]">
            <PanelTitle icon={<ClockIcon />}>Recent Activity</PanelTitle>
            <div>
              <ActivityRow
                cover={null}
                eyebrow="Finished"
                title={`${stats?.totalReads ?? 0} total reads`}
                meta="Archive"
                icon={<BookIcon />}
              />
              <ActivityRow
                cover={null}
                eyebrow="Favorite Category"
                title={topCategory?.category.name ?? 'Still discovering'}
                meta={topCategory ? `${topCategory.readCount} reads` : 'No data'}
                icon={<StarIcon />}
              />
              <ActivityRow
                cover={user.avatarUrl}
                eyebrow="Profile"
                title={readerStatusLabel}
                meta={user.isPrivate ? 'Private' : 'Public'}
                icon={<PersonIcon />}
              />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.9fr]">
          <div className="relative flex min-h-40 items-center overflow-hidden rounded-[8px] border border-[#9b6b2f]/52 bg-[rgba(8,4,2,0.82)] px-6 py-5 shadow-[0_20px_68px_rgba(0,0,0,0.5)] sm:px-8">
            <div className="absolute inset-0 opacity-24">
              <Image
                src="/images/bookrithm_profile_assets/library_background.png"
                alt=""
                fill
                sizes="600px"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(8,4,2,0.96)] via-[rgba(8,4,2,0.84)] to-[rgba(8,4,2,0.48)]" />
            <div className="relative max-w-2xl">
              <p className="mt-1 max-w-[54rem] font-serif text-xl italic leading-8 text-[#fff4d8] sm:text-2xl sm:leading-9">
                <span className="text-[#d6a84f]" aria-hidden="true">“</span>
                A reader lives a thousand lives before he dies.
                <span className="text-[#d6a84f]" aria-hidden="true">”</span>
              </p>
              <p className="mt-4 text-lg text-[#d6a84f]/78">— George R. R. Martin</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditing(true);
              window.setTimeout(() => {
                editSectionRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }, 0);
            }}
            className="group relative overflow-hidden rounded-[8px] border border-[#d6a84f]/58 bg-[rgba(12,6,2,0.84)] p-5 text-left shadow-[0_20px_68px_rgba(0,0,0,0.5),0_0_24px_rgba(214,168,79,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#f3d58a]/75 hover:bg-[rgba(18,8,4,0.94)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(214,168,79,0.18),transparent_36%)]" />
            <div className="relative flex items-center justify-between gap-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d6a84f]/50 bg-[rgba(18,8,4,0.9)] text-[#f3d58a] [&>svg]:h-6 [&>svg]:w-6">
                <PersonIcon />
              </span>
              <span className="text-[#d6a84f]/78 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#f3d58a]">
                <ArrowIcon />
              </span>
            </div>
            <h2 className="relative mt-4 font-serif text-2xl font-bold text-[#f3d58a]">Edit Profile</h2>
            <p className="relative mt-2 text-sm leading-6 text-[#d6a84f]/72">Update your information and reading preferences.</p>
          </button>
        </section>

        {isEditing && (
          <section
            ref={editSectionRef}
            className="scroll-mt-24 mt-6 rounded-[8px] border border-[#9b6b2f]/62 bg-[rgba(8,4,2,0.86)] p-6 shadow-[0_26px_90px_rgba(0,0,0,0.58)] backdrop-blur-[1px]"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl font-bold text-[#fff4d8]">Edit Profile</h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                }}
                disabled={isSaving}
                className="rounded-full border border-[#9b6b2f]/55 bg-[rgba(18,8,4,0.76)] px-4 py-2 text-sm font-semibold text-[#d6a84f] hover:border-[#f3d58a]/70 hover:text-[#f3d58a]"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/72">Display Name</span>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  maxLength={80}
                  className="rounded-[8px] border border-[#9b6b2f]/55 bg-[rgba(8,4,2,0.82)] px-4 py-3 text-sm text-[#fff4d8] outline-none placeholder:text-[#9b6b2f]/70 focus:border-[#f3d58a]/75"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/72">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="resize-none rounded-[8px] border border-[#9b6b2f]/55 bg-[rgba(8,4,2,0.82)] px-4 py-3 text-sm text-[#fff4d8] outline-none placeholder:text-[#9b6b2f]/70 focus:border-[#f3d58a]/75"
                />
                <span className="text-right text-xs text-[#d6a84f]/48">{form.bio.length}/500</span>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a84f]/72">Reader Status</span>
                <select
                  value={form.readerStatus}
                  onChange={(event) => setForm({ ...form, readerStatus: event.target.value as ReaderStatus })}
                  className="rounded-[8px] border border-[#9b6b2f]/55 bg-[rgba(8,4,2,0.82)] px-4 py-3 text-sm text-[#fff4d8] outline-none focus:border-[#f3d58a]/75"
                >
                  <option value="">None</option>
                  {READER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-[8px] border border-[#9b6b2f]/40 bg-[rgba(12,6,2,0.62)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(event) => setForm({ ...form, isPrivate: event.target.checked })}
                  className="h-4 w-4 accent-[#d6a84f]"
                />
                <span className="text-sm font-medium text-[#fff4d8]">Private account</span>
              </label>

              {saveError && <p className="rounded-[8px] border border-red-400/25 bg-red-950/55 px-4 py-3 text-sm text-red-200">{saveError}</p>}

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !form.displayName.trim()}
                  className="rounded-full border border-[#d6a84f]/65 bg-[rgba(104,61,5,0.72)] px-5 py-2.5 text-sm font-bold text-[#fff4d8] transition-colors hover:border-[#f3d58a]/80 hover:bg-[rgba(130,77,8,0.76)] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
