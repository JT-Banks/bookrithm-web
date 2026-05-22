'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { SignInButton } from '@/components/features/SignInButton';

type Slot = {
  left: string;
  top: string;
  width: string;
  height: string;
};

const SLOTS = {
  plaque: { left: '27.5%', top: '5.3%', width: '45%', height: '22%' },
  shelves: { left: '16.8%', top: '42.8%', width: '18.5%', height: '17.3%' },
  browse: { left: '40.8%', top: '42.8%', width: '18.5%', height: '17.3%' },
  history: { left: '64.3%', top: '42.8%', width: '18.5%', height: '17.3%' },
  suggest: { left: '24.2%', top: '72.6%', width: '20.5%', height: '17.1%' },
  profile: { left: '54.1%', top: '72.6%', width: '20.5%', height: '17.1%' },
} satisfies Record<string, Slot>;

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-600/70" />
      <span className="h-1.5 w-1.5 rotate-45 border border-amber-500/80 bg-[#2a1307]" />
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-600/70" />
    </div>
  );
}

function CabinetSlot({
  slot,
  href,
  title,
  desc,
  icon,
  locked = false,
  priority = false,
}: {
  slot: Slot;
  href: string;
  title: string;
  desc: string;
  icon: string;
  locked?: boolean;
  priority?: boolean;
}) {
  const content = (
    <div className="flex h-full w-full flex-col items-center justify-center px-[10%] pb-[18%] pt-[4%] text-center">
      <Image
        src={icon}
        alt=""
        width={46}
        height={46}
        priority={priority}
        className="mb-[clamp(3px,0.42vw,6px)] h-[clamp(19px,2.25vw,36px)] w-[clamp(19px,2.25vw,36px)] object-contain drop-shadow-[0_6px_9px_rgba(0,0,0,0.72)]"
        aria-hidden="true"
      />
      <div className="flex w-full max-w-[15rem] flex-col items-center">
        <p className="max-w-full font-serif text-[clamp(13px,1.42vw,21px)] font-semibold leading-none text-[#f7e6c4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.78)]">
          {title}
        </p>
        <p className="mt-[clamp(3px,0.36vw,6px)] max-w-full text-[clamp(7px,0.66vw,11px)] leading-[1.1] text-[#d5ad73] drop-shadow-[0_2px_3px_rgba(0,0,0,0.75)]">
          {desc}
        </p>
      </div>
    </div>
  );

  const style = {
    left: slot.left,
    top: slot.top,
    width: slot.width,
    height: slot.height,
  };

  if (locked) {
    return (
      <div
        className="absolute z-[3] opacity-48 grayscale-[0.2]"
        style={style}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group absolute z-[3] rounded-md transition duration-200 hover:bg-amber-200/[0.045] hover:drop-shadow-[0_0_18px_rgba(224,157,68,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
      style={style}
    >
      <div className="absolute inset-0 rounded-md opacity-0 shadow-[inset_0_0_18px_rgba(255,198,105,0.18)] transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
      {content}
    </Link>
  );
}

function CabinetContent({ userName }: { userName?: string }) {
  const signedIn = Boolean(userName);

  return (
    <section className="relative mx-auto w-full max-w-6xl">
      <div className="relative aspect-[1672/941] w-full">
        <Image
          src="/images/landing_page_content_transparent.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 96vw, 1152px"
          className="pointer-events-none select-none object-contain drop-shadow-[0_34px_70px_rgba(0,0,0,0.62)]"
          aria-hidden="true"
        />

        <div
          className="absolute z-[3] flex flex-col items-center justify-center px-5 text-center"
          style={{
            left: SLOTS.plaque.left,
            top: SLOTS.plaque.top,
            width: SLOTS.plaque.width,
            height: SLOTS.plaque.height,
          }}
        >
          <p className="library-kicker mb-2 text-[clamp(9px,0.9vw,13px)] font-semibold tracking-[0.18em] text-[#c69a5d]">
            Private Library
          </p>
          <h1 className="font-serif text-[clamp(24px,3.3vw,52px)] font-bold leading-tight text-[#f7e6c4] drop-shadow-[0_4px_7px_rgba(0,0,0,0.80)]">
            {signedIn ? `Welcome back, ${userName}` : 'Bookrithm'}
          </h1>
          <div className="my-2">
            <Ornament />
          </div>
          <p className="text-[clamp(11px,1.1vw,17px)] text-[#d5ad73] drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]">
            {signedIn ? 'Your next great story is waiting.' : 'Track what you read. Discover what you will love.'}
          </p>
          {!signedIn && (
            <div className="mt-3 -translate-y-1.5 scale-90">
              <SignInButton />
            </div>
          )}
        </div>

        <CabinetSlot
          slot={SLOTS.shelves}
          href="/shelves"
          title="My Shelves"
          desc="View and manage your reading lists"
          icon="/images/books/book_stack.png"
          locked={!signedIn}
          priority
        />
        <CabinetSlot
          slot={SLOTS.browse}
          href="/books"
          title="Browse Books"
          desc="Explore the Bookrithm catalog"
          icon="/images/books/book_and_magnifyingGlass.png"
        />
        <CabinetSlot
          slot={SLOTS.history}
          href="/read-log"
          title="History"
          desc="Every book you have finished"
          icon="/images/books/scroll.png"
          locked={!signedIn}
        />
        <CabinetSlot
          slot={SLOTS.suggest}
          href="/suggestions"
          title="Suggest"
          desc="Add missing tags and categories"
          icon="/images/books/book_and_quill.png"
          locked={!signedIn}
        />
        <CabinetSlot
          slot={SLOTS.profile}
          href="/profile"
          title="My Profile"
          desc="Edit your bio and reading identity"
          icon="/images/books/bound_book.png"
          locked={!signedIn}
        />
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <main className="relative min-h-[calc(100vh-65px)] overflow-hidden px-4 pb-10 pt-6 sm:px-6">
      <Image
        src="/images/backgrounds/bg-library.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/48 backdrop-blur-[1px]" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(224,145,54,0.13),transparent_44%),linear-gradient(180deg,rgba(10,4,2,0.08),rgba(10,4,2,0.62))]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">
        <CabinetContent userName={user?.displayName} />
      </div>
    </main>
  );
}
