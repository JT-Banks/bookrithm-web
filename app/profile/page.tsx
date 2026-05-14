'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import type { UpdateUserRequest, ReaderStatus } from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// All possible values for the ReaderStatus enum (from the API spec).
// We hardcode these for the <select> since they're stable enum values.
// In Java you'd call MyEnum.values() — here we just define an array.
// ─────────────────────────────────────────────────────────────────────────────
const READER_STATUSES: { value: ReaderStatus; label: string }[] = [
  { value: 'READING',        label: 'Currently Reading' },
  { value: 'COZY_READING',   label: 'Cozy Reading' },
  { value: 'BETWEEN_BOOKS',  label: 'Between Books' },
  { value: 'SEARCHING',      label: 'Searching for Next Read' },
  { value: 'REREADING',      label: 'Rereading' },
  { value: 'ON_HIATUS',      label: 'On Hiatus' },
  { value: 'BUSY',           label: 'Too Busy to Read' },
];

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();

  // ── Editing state ──────────────────────────────────────────────────────────
  // isEditing toggles between the read view and the edit form.
  // Think of it like switching between @GetMapping and @PatchMapping on the same route.
  const [isEditing,    setIsEditing]    = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);

  // The form fields mirror the fields we allow editing in UpdateUserRequest
  const [form, setForm] = useState({
    displayName: '',
    bio:         '',
    readerStatus: '' as ReaderStatus | '',
    isPrivate:   false,
  });

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) router.push('/');
  }, [user, isLoading, router]);

  // Seed the form with the current user values when entering edit mode
  // This runs whenever `user` changes (e.g. after a successful save)
  useEffect(() => {
    if (user) {
      setForm({
        displayName:  user.displayName,
        bio:          user.bio          ?? '',
        readerStatus: user.readerStatus ?? '',
        isPrivate:    user.isPrivate,
      });
    }
  }, [user]);

  if (isLoading || !user) return null;

  // ── Handle save ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    // Build the request body — only include readerStatus if one is selected.
    // The API uses PATCH semantics: only fields you send get updated.
    const body: UpdateUserRequest = {
      displayName:  form.displayName,
      bio:          form.bio || null,
      isPrivate:    form.isPrivate,
      ...(form.readerStatus ? { readerStatus: form.readerStatus } : {}),
    };

    try {
      const updated = await authApi.updateProfile(body);
      // Push the fresh user data back into the auth context so the
      // header and other components see the updated displayName immediately
      updateUser(updated);
      setIsEditing(false);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Shared avatar element ──────────────────────────────────────────────────
  const avatar = user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.displayName} className="w-16 h-16 rounded-full object-cover" />
  ) : (
    <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold text-white">
      {user.displayName.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">

        {/* Avatar row — always shown */}
        <div className="flex items-center gap-5">
          {avatar}
          <div>
            <p className="text-xl font-semibold text-white">{user.displayName}</p>
            <p className="text-zinc-400 text-sm">@{user.username}</p>
          </div>
        </div>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            {user.bio && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Bio</p>
                <p className="text-zinc-300">{user.bio}</p>
              </div>
            )}

            {user.readerStatus && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Reader Status</p>
                <span className="inline-block text-sm px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                  {READER_STATUSES.find(s => s.value === user.readerStatus)?.label ?? user.readerStatus}
                </span>
              </div>
            )}

            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Account</p>
              <span className="inline-block text-sm px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                {user.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="self-start mt-2 px-5 py-2.5 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Edit Profile
            </button>
          </>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <div className="flex flex-col gap-5">

            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-500 uppercase tracking-wide">
                Display Name
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                maxLength={80}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-zinc-500 text-sm"
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-500 uppercase tracking-wide">
                Bio
              </label>
              {/* textarea is a multi-line text input — no equivalent in HTML for single-line */}
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                maxLength={500}
                rows={3}
                placeholder="Tell us about yourself..."
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-zinc-500 text-sm resize-none placeholder-zinc-600"
              />
              <p className="text-xs text-zinc-600 text-right">{form.bio.length}/500</p>
            </div>

            {/* Reader Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-500 uppercase tracking-wide">
                Reader Status
              </label>
              <select
                value={form.readerStatus}
                onChange={(e) => setForm({ ...form, readerStatus: e.target.value as ReaderStatus })}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-zinc-500 text-sm"
              >
                <option value="">— None —</option>
                {READER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Private toggle — checkbox with a label */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                className="w-4 h-4 accent-white"
              />
              <label htmlFor="isPrivate" className="text-sm text-zinc-300 cursor-pointer">
                Private account
              </label>
            </div>

            {/* Error */}
            {saveError && <p className="text-red-400 text-sm">{saveError}</p>}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !form.displayName.trim()}
                className="px-5 py-2.5 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => { setIsEditing(false); setSaveError(null); }}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}

