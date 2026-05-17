'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { SignInButton } from '@/components/features/SignInButton';

// ─────────────────────────────────────────────────────────────────────────────
// NavTile — a clickable card that links to a section of the app.
// Props:
//   href    = where the tile links to
//   title   = big label
//   desc    = subtitle
//   emoji   = decorative icon (no icon library needed)
//   locked  = if true, renders a disabled-looking tile instead of a link
//             (used for features that require sign-in)
// ─────────────────────────────────────────────────────────────────────────────
function NavTile({
  href,
  title,
  desc,
  emoji,
  locked = false,
}: {
  href: string;
  title: string;
  desc: string;
  emoji: string;
  locked?: boolean;
}) {
  const baseStyle =
    'flex flex-col gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm p-6 transition-all duration-200';

  if (locked) {
    return (
      <div className={`${baseStyle} opacity-40 cursor-not-allowed`}>
        <span className="text-3xl">{emoji}</span>
        <div>
          <p className="font-semibold text-zinc-300">{title}</p>
          <p className="text-sm text-zinc-500 mt-1">{desc}</p>
        </div>
        <span className="text-xs text-zinc-600 mt-auto">Sign in to access</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseStyle} hover:border-amber-900/60 hover:bg-zinc-900/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/50 cursor-pointer`}
    >
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="font-semibold text-zinc-200">{title}</p>
        <p className="text-sm text-zinc-500 mt-1">{desc}</p>
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
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.displayName} 📖
          </h1>
          <p className="text-zinc-400 mt-2">Where would you like to go?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NavTile href="/shelves"     title="My Shelves"   desc="View and manage your reading lists"     emoji="📚" />
          <NavTile href="/books"       title="Browse Books" desc="Explore the Bookrithm catalog"           emoji="🔎" />
          <NavTile href="/read-log"    title="History"      desc="Every book you've finished"              emoji="📜" />
          <NavTile href="/suggestions" title="Suggest"      desc="Add missing tags and categories"         emoji="✍️" />
          <NavTile href="/profile"     title="My Profile"   desc="Edit your bio and reading identity"      emoji="🪪" />
        </div>
      </main>
    );
  }

  // ── Logged-out: Marketing / hero view ────────────────────────────────────
  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-12 flex flex-col items-center text-center">

      {/* Hero */}
      <div className="text-6xl mb-6 select-none">📚</div>
      <h1 className="text-5xl font-bold tracking-tight text-white">
        Bookrithm
      </h1>
      <p className="mt-4 text-xl text-zinc-400 max-w-md">
        Track what you read. Discover what you'll love.
      </p>

      {/* Sign-in CTA */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-sm text-zinc-500">Sign in with Google to get started</p>
        <SignInButton />
      </div>

      {/* Feature teaser tiles */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
        <NavTile href="/books"   title="Browse Books"    desc="Explore the catalog — no account needed" emoji="🔎" />
        <NavTile href="/shelves" title="Reading Shelves" desc="Organise Want to Read, Reading, and more" emoji="📚" locked />
        <NavTile href="/profile" title="Your Profile"    desc="Build your reading identity"              emoji="🪪" locked />
      </div>
    </main>
  );
}