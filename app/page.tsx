'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { SignInButton } from '@/components/features/SignInButton';

// ─────────────────────────────────────────────────────────────────────────────
// NavTile — a clickable card that links to a section of the app.
// Props:
//   href    = where the tile links to
//   title   = big label
//   desc    = subtitle
//   icon    = path to a PNG illustration (preferred)
//   emoji   = fallback text emoji when no icon image is provided
//   locked  = if true, renders a disabled-looking tile instead of a link
//             (used for features that require sign-in)
// ─────────────────────────────────────────────────────────────────────────────
function NavTile({
  href,
  title,
  desc,
  icon,
  emoji,
  locked = false,
}: {
  href: string;
  title: string;
  desc: string;
  icon?: string;
  emoji?: string;
  locked?: boolean;
}) {
  const baseStyle =
    'library-panel-soft flex min-h-[172px] flex-col gap-3 rounded-lg p-6 transition-all duration-200';

  // Render the icon — image takes priority over emoji
  const iconEl = icon
    ? <Image src={icon} alt="" aria-hidden="true" width={48} height={48} className="h-12 w-12 object-contain drop-shadow-[0_5px_8px_rgba(0,0,0,0.55)]" />
    : emoji
    ? <span className="text-3xl">{emoji}</span>
    : null;

  if (locked) {
    return (
      <div className={`${baseStyle} opacity-40 cursor-not-allowed`}>
        {iconEl}
        <div>
          <p className="font-serif text-lg font-semibold text-zinc-200">{title}</p>
          <p className="text-sm text-zinc-500 mt-1">{desc}</p>
        </div>
        <span className="text-xs text-zinc-600 mt-auto">Sign in to access</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseStyle} hover:-translate-y-1 hover:border-amber-700/55 hover:bg-zinc-900/75 hover:shadow-xl hover:shadow-zinc-950/50 cursor-pointer`}
    >
      {iconEl}
      <div>
        <p className="font-serif text-lg font-semibold text-zinc-100">{title}</p>
        <p className="text-sm text-zinc-400 mt-1">{desc}</p>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomePage — renders differently based on whether the user is signed in.
// Think of this like a @GetMapping that returns different views based on
// whether the request has a valid auth token.
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  // useAuth gives us the current user (null if not signed in) and a loading flag
  const { user, isLoading } = useAuth();

  // While checking auth state, render nothing to avoid a flash of the wrong view
  if (isLoading) return null;

  // ── Logged-in: Dashboard view ─────────────────────────────────────────────
  if (user) {
    return (
      <main className="max-w-4xl mx-auto px-6 pt-10 pb-16">
        <div className="library-panel mb-10 rounded-lg px-7 py-6">
          <p className="library-kicker mb-2 text-xs font-semibold">Private Library</p>
          <h1 className="text-3xl font-bold text-zinc-50">
            Welcome back, {user.displayName}
          </h1>
          <div className="library-divider my-4 max-w-sm" />
          <p className="text-zinc-300">Where would you like to go?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NavTile href="/shelves"     title="My Shelves"   desc="View and manage your reading lists"   icon="/images/book_stack.png" />
          <NavTile href="/books"       title="Browse Books" desc="Explore the Bookrithm catalog"         icon="/images/book_and_magnifyingGlass.png" />
          <NavTile href="/read-log"    title="History"      desc="Every book you've finished"            icon="/images/scroll.png" />
          <NavTile href="/suggestions" title="Suggest"      desc="Add missing tags and categories"       icon="/images/book_and_quill.png" />
          <NavTile href="/profile"     title="My Profile"   desc="Edit your bio and reading identity"    icon="/images/bound_book.png" />
        </div>
      </main>
    );
  }

  // ── Logged-out: Marketing / hero view ────────────────────────────────────
  return (
    <main className="max-w-4xl mx-auto px-6 pt-16 pb-12 flex flex-col items-center text-center">

      {/* Hero */}
      <div className="text-6xl mb-6 select-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.75)]">📚</div>
      <p className="library-kicker mb-3 text-xs font-semibold">Old Library Reading Companion</p>
      <h1 className="text-5xl font-bold tracking-tight text-zinc-50">
        Bookrithm
      </h1>
      <div className="library-divider my-5 w-full max-w-sm" />
      <p className="text-xl text-zinc-300 max-w-md">
        Track what you read. Discover what you&apos;ll love.
      </p>

      {/* Sign-in CTA */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-sm text-zinc-500">Sign in with Google to get started</p>
        <SignInButton />
      </div>

      {/* Feature teaser tiles */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
        <NavTile href="/books"   title="Browse Books"    desc="Explore the catalog — no account needed" icon="/images/book_and_magnifyingGlass.png" />
        <NavTile href="/shelves" title="Reading Shelves" desc="Organise Want to Read, Reading, and more" icon="/images/book_stack.png" locked />
        <NavTile href="/profile" title="Your Profile"    desc="Build your reading identity"              icon="/images/bound_book.png" locked />
      </div>
    </main>
  );
}
