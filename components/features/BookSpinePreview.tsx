/* eslint-disable @next/next/no-img-element */
import type { BookArrangement } from '@/types/shelves';

/**
 * BookSpinePreview
 *
 * Renders a row of decorative book spines sitting on a shelf using actual book images.
 * No real book data is needed — spines are generated deterministically
 * from the shelf's ID so they stay consistent across renders.
 *
 * Rules:
 *  - 1–8 books  → show that many spines
 *  - 9+ books   → show 8 spines + "+X more" badge
 *  - 0 books    → gentle "empty shelf" label
 */

// ── Book Images ───────────────────────────────────────────────────────────────

/** Available book spine images (book_2.png through book_6.png) */
const BOOK_IMAGES = [
  '/images/books/book1.png',
  '/images/books/book2.png',
  '/images/books/book3.png',
  '/images/books/book4.png',
  '/images/books/book5.png',
  '/images/books/book6.png',
] as const;

/**
 * Height sequence (px). Cycling through these gives each spine a slightly
 * different height — like real books of varying sizes on a shelf.
 */
const SPINE_HEIGHTS = [108, 120, 104, 124, 112, 118, 122, 106] as const;

const MAX_VISIBLE = 8;

// ── Hash helper ───────────────────────────────────────────────────────────────

/**
 * Stable integer hash of a shelf ID.
 * Used to offset into palettes/heights so every shelf has a unique but
 * consistent arrangement that doesn't change between renders.
 */
function hashId(id: string): number {
  return id.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xfffff, 0);
}

// ── Arrangement ─────────────────────────────────────────────────────────────────

interface SpineConfig {
  rotation:   number;  // degrees; rotates around bottom-center
  gapBefore:  number;  // extra left margin (px) before this spine
  horizontal: boolean; // book is lying on its side
}

// Source image aspect ratio: 724 wide × 2172 tall
const BOOK_WIDTH_RATIO = 724 / 2172; // ≈ 0.333

function getSpineConfig(
  arrangement: BookArrangement,
  base: number,
  index: number,
  height: number,
): SpineConfig {
  const h1 = (base + index * 13) % 7;   // 0–6
  const h2 = (base + index * 17) % 11;  // 0–10
  const h3 = (base + index * 23) % 5;   // 0–4

  const bookWidth = Math.round(height * BOOK_WIDTH_RATIO);

  /**
   * Minimum gap so two books leaning TOWARD each other don't overlap.
   * Derivation: when book i leans +θ and book i+1 leans -θ (toward each other),
   * the required spacing is: w*cos(θ) + 2*h*sin(θ)
   * Since default spacing = w, the extra gap = 2*h*sin(θ) + w*(cos(θ)-1)
   */
  function safeGap(deg: number): number {
    const rad = Math.abs(deg) * Math.PI / 180;
    return Math.max(0, Math.ceil(2 * height * Math.sin(rad) + bookWidth * (Math.cos(rad) - 1)));
  }

  switch (arrangement) {
    case 'neat':
      return { rotation: 0, gapBefore: 0, horizontal: false };

    case 'messy': {
      // ~1 in 5 books lies flat on the shelf
      const isHorizontal = (base + index * 31) % 5 === 0;
      if (isHorizontal) {
        return { rotation: 0, gapBefore: bookWidth, horizontal: true };
      }
      const rotation = (h1 - 3) * 5;  // ±15°
      const extraGap  = h3 * 6;        // 0–24px random breathing room
      return { rotation, gapBefore: safeGap(rotation) + extraGap, horizontal: false };
    }

    case 'leaning': {
      // All lean the same direction — same-direction lean never overlaps (proven:
      // required spacing = w*cos(θ) < w = natural spacing, so gap = 0).
      const leanAmt = 7 + (h1 % 4); // 7–10°
      return { rotation: leanAmt, gapBefore: 0, horizontal: false };
    }

    case 'stacked':
      return { rotation: (h2 % 3) - 1, gapBefore: 0, horizontal: false };

    case 'mixed': {
      // Alternating lean — use full safeGap to prevent overlap
      const dir      = index % 2 === 0 ? 1 : -1;
      const rotation = ((h1 % 3) + 3) * dir; // ±3° to ±5°
      return { rotation, gapBefore: index === 0 ? 0 : safeGap(rotation), horizontal: false };
    }
  }
}

function AntiqueBookend({ side }: { side: 'left' | 'right' }) {
  const imagePath = side === 'left' 
    ? '/images/shelves/right_bookend_transparent.png' 
    : '/images/shelves/left_bookend_transparent.png';
  
  return (
    <div
      aria-hidden="true"
      style={{
        alignSelf: 'flex-end',
        flexShrink: 0,
        // Negative margin pulls books flush against the inner face of the post,
        // compensating for the post's own width (~20% of the image canvas)
        marginRight: side === 'left' ? '-2px' : undefined,
        marginLeft: side === 'right' ? '-2px' : undefined,
        filter: 'drop-shadow(3px 4px 6px rgba(0,0,0,0.55))',
      }}
    >
      {/* Source: 1254×1254 square — height matches tallest book */}
      <img
        src={imagePath}
        alt=""
        style={{
          height: '124px',
          width: 'auto',
          display: 'block',
        }}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BookSpinePreviewProps {
  /** Total number of books on the shelf (from the API). */
  bookCount:    number;
  /** Shelf ID — used to deterministically assign spine colors and heights. */
  shelfId:      string;
  /** Visual arrangement style for the book spines. Defaults to 'neat'. */
  arrangement?: BookArrangement;
}

export default function BookSpinePreview({ bookCount, shelfId, arrangement = 'neat' }: BookSpinePreviewProps) {
  const base     = hashId(shelfId);
  const visible  = Math.min(bookCount, MAX_VISIBLE);
  const overflow = bookCount - MAX_VISIBLE;

  // ── Empty shelf ─────────────────────────────────────────────────────────────
  if (bookCount === 0) {
    return (
      <div
        className="flex items-end px-5 pt-4"
        style={{ minHeight: '132px' }}
        aria-label="Empty shelf"
      >
        <p
          className="text-xs italic pb-6 select-none"
          style={{ color: 'rgba(216, 174, 112, 0.48)' }}
        >
          Empty shelf
        </p>
      </div>
    );
  }

  // ── Book spines ─────────────────────────────────────────────────────────────
  return (
    <div
      className="inline-flex items-end justify-start"
      style={{ minHeight: '180px', lineHeight: 0 }}
      aria-label={`${bookCount} book${bookCount === 1 ? '' : 's'} on shelf`}
    >
      <AntiqueBookend side="left" />
      <div
        className="flex items-end justify-center"
        style={{
          minWidth: visible === 1 ? '40px' : undefined,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {Array.from({ length: visible }).map((_, i) => {
          const bookImageIndex = (base + i * 3) % BOOK_IMAGES.length;
          const bookImage = BOOK_IMAGES[bookImageIndex];
          const height = SPINE_HEIGHTS[(base + i * 7) % SPINE_HEIGHTS.length];
          const config = getSpineConfig(arrangement, base, i, height);
          const bookWidth = Math.round(height * BOOK_WIDTH_RATIO);

          if (config.horizontal) {
            // Render lying on its side: container is height×bookWidth,
            // image is centered and rotated 90° to fill it exactly.
            return (
              <div
                key={i}
                aria-hidden="true"
                style={{
                  width: `${height}px`,
                  height: `${bookWidth}px`,
                  alignSelf: 'flex-end',
                  flexShrink: 0,
                  marginLeft: `${config.gapBefore}px`,
                  position: 'relative',
                  filter: 'drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.62))',
                }}
              >
                <img
                  src={bookImage}
                  alt=""
                  style={{
                    position: 'absolute',
                    width: `${bookWidth}px`,
                    height: `${height}px`,
                    // Center the image inside the container before rotating
                    left: `${(height - bookWidth) / 2}px`,
                    top: `${(bookWidth - height) / 2}px`,
                    transformOrigin: 'center',
                    transform: 'rotate(90deg)',
                    display: 'block',
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={i}
              aria-hidden="true"
              style={{
                alignSelf: 'flex-end',
                flexShrink: 0,
                marginLeft: config.gapBefore > 0 ? `${config.gapBefore}px` : undefined,
                transform: `rotate(${config.rotation}deg)`,
                transformOrigin: 'bottom center',
                filter: 'drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.62))',
              }}
            >
              {/* Source: 724×2172 — height drives display size, width scales naturally (~1:3 ratio) */}
              <img
                src={bookImage}
                alt=""
                style={{
                  height: `${height}px`,
                  width: 'auto',
                  display: 'block',
                }}
              />
            </div>
          );
        })}
      </div>
      <AntiqueBookend side="right" />

      {/* Overflow badge */}
      {overflow > 0 && (
        <span
          className="self-end pb-1 ml-1 text-xs select-none"
          style={{ color: 'rgba(160, 120, 70, 0.75)' }}
          aria-label={`${overflow} more books`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
