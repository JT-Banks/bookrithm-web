import type { BookArrangement } from '@/types/shelves';

/**
 * BookSpinePreview
 *
 * Renders a row of decorative book spines sitting on a shelf.
 * No real book data is needed — spines are generated deterministically
 * from the shelf's ID so they stay consistent across renders.
 *
 * Rules:
 *  - 1–8 books  → show that many spines
 *  - 9+ books   → show 8 spines + "+X more" badge
 *  - 0 books    → gentle "empty shelf" label
 */

// ── Palettes ──────────────────────────────────────────────────────────────────

/** Warm, old-library spine gradients with matching gold/jewel-tone borders. */
const SPINE_PALETTES = [
  { bg: 'linear-gradient(90deg, #2a0c06 0%, #7a2818 17%, #5d1c10 48%, #2b0b06 100%)', border: 'rgba(184, 91, 48, 0.72)', band: '#c69a45', label: '#4b160e' },
  { bg: 'linear-gradient(90deg, #09101d 0%, #233f61 18%, #172f4d 52%, #07101f 100%)', border: 'rgba(97, 135, 176, 0.64)', band: '#b6a060', label: '#10213b' },
  { bg: 'linear-gradient(90deg, #071007 0%, #243f1d 18%, #183314 52%, #050b04 100%)', border: 'rgba(99, 138, 69, 0.68)', band: '#b99a4b', label: '#10230f' },
  { bg: 'linear-gradient(90deg, #150a03 0%, #5b3713 18%, #3a2109 52%, #0b0502 100%)', border: 'rgba(178, 126, 55, 0.70)', band: '#d0a151', label: '#2b1706' },
  { bg: 'linear-gradient(90deg, #160817 0%, #4b214f 18%, #321339 52%, #0b030c 100%)', border: 'rgba(139, 86, 153, 0.66)', band: '#c3a15a', label: '#29112e' },
  { bg: 'linear-gradient(90deg, #06110e 0%, #1f4a39 18%, #153225 52%, #030908 100%)', border: 'rgba(76, 138, 111, 0.66)', band: '#bda968', label: '#0e251c' },
  { bg: 'linear-gradient(90deg, #171205 0%, #5c4a10 18%, #3b2d08 52%, #0c0902 100%)', border: 'rgba(189, 147, 48, 0.70)', band: '#e2c46f', label: '#332606' },
  { bg: 'linear-gradient(90deg, #120603 0%, #512113 18%, #321108 52%, #080302 100%)', border: 'rgba(166, 86, 51, 0.68)', band: '#c98a55', label: '#2a1008' },
] as const;

/**
 * Height sequence (px). Cycling through these gives each spine a slightly
 * different height — like real books of varying sizes on a shelf.
 */
const SPINE_HEIGHTS = [92, 104, 88, 112, 96, 101, 108, 90] as const;

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
  rotation:  number;  // degrees; rotates around bottom-center
  gapBefore: number;  // extra left margin (px) before this spine
}

function getSpineConfig(
  arrangement: BookArrangement,
  base: number,
  index: number,
): SpineConfig {
  // Three independent pseudo-random streams derived from shelf hash + position
  const h1 = (base + index * 13) % 7;   // 0–6
  const h3 = (base + index * 17) % 11;  // 0–10

  switch (arrangement) {
    case 'neat':
      return { rotation: 0, gapBefore: 0 };

    case 'messy': {
      const rotation = (h1 - 3) * 0.55; // slight variation without breaking the shelf baseline
      return { rotation, gapBefore: 0 };
    }

    case 'leaning': {
      // Books lean in pairs; direction alternates per pair-group
      const groupIdx = Math.floor(index / 2);
      const groupDir = ((base + groupIdx * 19) % 3) - 1;  // −1, 0, or +1
      const leanAmt  = (h1 + 2) * 0.9 * groupDir;         // up to ±7°
      return { rotation: leanAmt, gapBefore: 0 };
    }

    case 'stacked': {
      // Keep the display as an upright run so every book rests on the shelf.
      return { rotation: (h3 % 3) - 1, gapBefore: 0 };
    }

    case 'mixed': {
      const rotation = (h1 - 3) * 0.45;
      return { rotation, gapBefore: 0 };
    }
  }
}

function AntiqueBookend({ side }: { side: 'left' | 'right' }) {
  const scaleX = side === 'left' ? 1 : -1;
  return (
    <div
      aria-hidden="true"
      style={{
        position:     'relative',
        alignSelf:    'flex-end',
        flexShrink:   0,
        width:        '25px',
        height:       '62px',
        marginRight:  side === 'left' ? '4px' : undefined,
        marginLeft:   side === 'right' ? '4px' : undefined,
        transform:    `scaleX(${scaleX}) translateY(1px)`,
        filter:       'drop-shadow(3px 4px 5px rgba(0,0,0,0.50))',
      }}
    >
      <div
        style={{
          position:     'absolute',
          left:         0,
          bottom:       0,
          width:        '24px',
          height:       '8px',
          borderRadius: '2px',
          background:   'linear-gradient(180deg, #c29a4d 0%, #62400f 55%, #241303 100%)',
          border:       '1px solid rgba(224, 175, 77, 0.68)',
          boxShadow:    'inset 0 1px 0 rgba(255,234,160,0.24)',
        }}
      />
      <div
        style={{
          position:     'absolute',
          left:         '3px',
          bottom:       '4px',
          width:        '8px',
          height:       '54px',
          borderRadius: '5px 5px 2px 2px',
          background:   'linear-gradient(90deg, #1a0e04 0%, #8b641e 44%, #d5a84e 58%, #3b2408 100%)',
          border:       '1px solid rgba(221, 168, 73, 0.62)',
          boxShadow:    'inset -2px 0 3px rgba(0,0,0,0.38), inset 1px 0 1px rgba(255,236,170,0.20)',
        }}
      />
      <div
        style={{
          position:     'absolute',
          left:         '8px',
          bottom:       '18px',
          width:        '13px',
          height:       '13px',
          borderLeft:   '2px solid rgba(220, 172, 79, 0.72)',
          borderBottom: '2px solid rgba(220, 172, 79, 0.72)',
          borderRadius: '0 0 0 10px',
          transform:    'rotate(-8deg)',
        }}
      />
      <div
        style={{
          position:     'absolute',
          left:         '10px',
          bottom:       '33px',
          width:        '9px',
          height:       '9px',
          border:       '1px solid rgba(236, 189, 95, 0.66)',
          borderRadius: '999px',
          background:   'radial-gradient(circle, rgba(255,225,144,0.36), rgba(84,48,10,0.30) 62%, transparent 64%)',
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
      className="flex items-end justify-start gap-1 pt-4"
      style={{ minHeight: '132px', lineHeight: 0 }}
      aria-label={`${bookCount} book${bookCount === 1 ? '' : 's'} on shelf`}
    >
      <AntiqueBookend side="left" />
      {Array.from({ length: visible }).map((_, i) => {
        const config  = getSpineConfig(arrangement, base, i);
        const palette = SPINE_PALETTES[(base + i * 3) % SPINE_PALETTES.length];
        const height  = SPINE_HEIGHTS[ (base + i * 7) % SPINE_HEIGHTS.length ];

        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position:        'relative',
              width:           '30px',
              height:          `${height}px`,
              background:      palette.bg,
              backgroundImage:  [
                'radial-gradient(circle at 35% 24%, rgba(255,218,145,0.12), transparent 18%)',
                'radial-gradient(circle at 68% 72%, rgba(255,218,145,0.07), transparent 15%)',
                'repeating-linear-gradient(0deg, transparent 0 14px, rgba(255,255,255,0.035) 14px 15px)',
                'linear-gradient(90deg, rgba(255,230,168,0.10), transparent 16%, transparent 72%, rgba(0,0,0,0.38))',
                palette.bg,
              ].join(', '),
              border:          `1px solid ${palette.border}`,
              borderRadius:    '4px 5px 2px 2px',
              flexShrink:      0,
              marginLeft:      config.gapBefore > 0 ? `${config.gapBefore}px` : undefined,
              transform:       `rotate(${config.rotation}deg)`,
              transformOrigin: 'bottom center',
              overflow:        'hidden',
              boxShadow: [
                'inset 3px 0 4px rgba(255,232,170,0.10)',
                'inset -7px 0 7px rgba(0,0,0,0.42)',
                'inset 0 0 12px rgba(0,0,0,0.20)',
                '3px 3px 7px rgba(0, 0, 0, 0.54)',
              ].join(', '),
            }}
          >
            <div
              style={{
                position:   'absolute',
                inset:      0,
                background: [
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 8px)',
                  'repeating-linear-gradient(0deg, transparent 0 20px, rgba(0,0,0,0.11) 20px 21px)',
                ].join(', '),
                opacity:    0.62,
                mixBlendMode: 'screen',
              }}
            />
            {[12, 30, height - 22].map((top, bandIndex) => (
              <div
                key={bandIndex}
                style={{
                  position:     'absolute',
                  top:          `${top}px`,
                  left:         '4px',
                  right:        '5px',
                  height:       bandIndex === 1 ? '3px' : '5px',
                  borderRadius: '999px',
                  background:   `linear-gradient(90deg, transparent, ${palette.band}, transparent)`,
                  opacity:      bandIndex === 1 ? 0.46 : 0.76,
                  boxShadow:    '0 1px 2px rgba(0,0,0,0.42)',
                }}
              />
            ))}
            <div
              style={{
                position:     'absolute',
                top:          `${Math.max(38, height * 0.42)}px`,
                left:         '7px',
                right:        '8px',
                height:       '22px',
                borderRadius: '3px',
                background:   `linear-gradient(180deg, rgba(255,230,170,0.10), transparent), ${palette.label}`,
                border:       `1px solid ${palette.band}66`,
                boxShadow:    'inset 0 0 4px rgba(0,0,0,0.42)',
              }}
            />
            <div
              style={{
                position:   'absolute',
                top:        `${Math.max(64, height * 0.68)}px`,
                left:       '50%',
                width:      '8px',
                height:     '8px',
                transform:  'translateX(-50%) rotate(45deg)',
                border:     `1px solid ${palette.band}99`,
                background: 'rgba(255,216,132,0.08)',
                boxShadow:  `0 0 7px ${palette.band}40`,
              }}
            />
          </div>
        );
      })}
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
