'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { shelvesApi } from '@/lib/api/shelves';
import type { ShelfResponse } from '@/types/api';
import BookSpinePreview from '@/components/features/BookSpinePreview';
import { ShelfCustomizationPanel } from '@/components/features/ShelfCustomizationPanel';
import type { DecorationItem, ShelfCustomizationState } from '@/types/shelves';
import {
  DECORATION_DISPLAY,
  SYSTEM_SHELF_LIGHT,       DEFAULT_SHELF_LIGHT,
  SYSTEM_SHELF_WOOD,        DEFAULT_WOOD_STYLE,
  SYSTEM_SHELF_ARRANGEMENT, DEFAULT_BOOK_ARRANGEMENT,
  SYSTEM_SHELF_DECORATIONS, DEFAULT_SHELF_DECORATIONS,
} from '@/types/shelves';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Convert a 6-digit hex color to rgba() with the given alpha (0–1). */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

/** Build the initial customization state for a shelf from system defaults. */
function defaultSettingsFor(shelf: ShelfResponse): ShelfCustomizationState {
  const light = SYSTEM_SHELF_LIGHT[shelf.name]       ?? DEFAULT_SHELF_LIGHT;
  const decs  = SYSTEM_SHELF_DECORATIONS[shelf.name] ?? DEFAULT_SHELF_DECORATIONS;
  return {
    woodStyle:       SYSTEM_SHELF_WOOD[shelf.name]        ?? DEFAULT_WOOD_STYLE,
    lightEnabled:    light.lightEnabled,
    lightColor:      light.lightColor,
    lightIntensity:  light.lightIntensity,
    shadowEnabled:   true,
    bookArrangement: SYSTEM_SHELF_ARRANGEMENT[shelf.name] ?? DEFAULT_BOOK_ARRANGEMENT,
    decorationLeft:  decs.decorationLeft,
    decorationRight: decs.decorationRight,
  };
}

// ── Decoration spot ───────────────────────────────────────────────────────────

/**
 * Single decoration sitting on the shelf board (left or right end).
 * Asset swap: set `imagePath` in DECORATION_DISPLAY and the <img> renders
 * automatically — no changes needed here.
 */
function DecorationSpot({ item, side }: { item: DecorationItem; side: 'left' | 'right' }) {
  const { emoji, label, imagePath } = DECORATION_DISPLAY[item];
  return (
    <div
      title={label}
      style={{
        position:      'absolute',
        bottom:        '21.5%',
        [side]:        side === 'left' ? '9%' : '9.5%',
        pointerEvents: 'none',
        userSelect:    'none',
        zIndex:        5,
        fontSize:      'clamp(20px, 3vw, 32px)',
        lineHeight:    1,
        filter:        'drop-shadow(0 6px 8px rgba(0,0,0,0.72))',
      }}
    >
      {imagePath
        ? <Image src={imagePath} alt={label} width={30} height={30} style={{ display: 'block' }} />
        : <span role="img" aria-label={label}>{emoji}</span>
      }
    </div>
  );
}

// ── Shelf card ─────────────────────────────────────────────────────────────────

function ShelfCard({
  shelf,
  settings,
  isCustomizing,
  onToggleCustomize,
  onSettingsChange,
}: {
  shelf:             ShelfResponse;
  settings:          ShelfCustomizationState;
  isCustomizing:     boolean;
  onToggleCustomize: () => void;
  onSettingsChange:  (next: ShelfCustomizationState) => void;
}) {
  const {
    woodStyle, lightEnabled, lightColor, lightIntensity,
    shadowEnabled, bookArrangement, decorationLeft, decorationRight,
  } = settings;

  const glowBlur   = Math.round(28 * lightIntensity);
  const glowSpread = Math.round(4  * lightIntensity);
  const dropShadow = shadowEnabled ? '0 18px 36px rgba(0,0,0,0.45)' : '0 5px 12px rgba(0,0,0,0.22)';
  const cardShadow = lightEnabled
    ? `0 0 ${glowBlur}px ${glowSpread}px ${hexToRgba(lightColor, lightIntensity * 0.18)}, ${dropShadow}`
    : dropShadow;

  return (
    <div>
      {/* Visual shelf — clicking the card navigates to the shelf detail page */}
      <Link
        href={`/shelves/${shelf.id}`}
        className="group block relative transition-all duration-200 hover:-translate-y-[3px]"
        style={{
          '--shelf-light-color':     lightColor,
          '--shelf-light-intensity': lightIntensity,
          '--shelf-wood-style':      woodStyle,
          aspectRatio: '2172 / 724',
          minHeight:   '220px',
          border:      '1px solid transparent',
          boxShadow:  cardShadow,
          transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        } as React.CSSProperties}
      >
        <Image
          src="/images/single_realistic_bookshelf_clean.png"
          alt=""
          fill
          priority={false}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="pointer-events-none select-none object-fill"
          aria-hidden="true"
        />

        {/* Lamp glow */}
        <div
          aria-hidden="true"
          style={{
            position:      'absolute',
            top:           '11%',
            left:          '50%',
            width:         '58%',
            height:        '52%',
            transform:     'translateX(-50%)',
            pointerEvents: 'none',
            background:    `radial-gradient(ellipse at top, ${hexToRgba(lightColor, 0.75)} 0%, ${hexToRgba(lightColor, 0.24)} 34%, transparent 72%)`,
            opacity:       lightEnabled ? Math.min(0.72, lightIntensity * 0.95) : 0,
            transition:    'opacity 0.4s ease',
            mixBlendMode:   'screen',
            zIndex:         2,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position:      'absolute',
            top:           '13.5%',
            left:          '50%',
            width:         '7%',
            minWidth:      '42px',
            height:        '3%',
            minHeight:     '7px',
            borderRadius:  '999px',
            transform:     'translateX(-50%)',
            background:    lightEnabled
              ? `linear-gradient(90deg, transparent, ${hexToRgba(lightColor, 0.88)}, transparent)`
              : 'linear-gradient(90deg, transparent, rgba(80,55,32,0.45), transparent)',
            boxShadow:     lightEnabled ? `0 0 18px ${hexToRgba(lightColor, 0.46)}` : 'none',
            zIndex:        5,
          }}
        />

        {/* Header row */}
        <div
          className="absolute z-[6] flex items-start justify-between"
          style={{
            top:    '34%',
            left:   '7%',
            right:  '7%',
          }}
        >
          <div>
            <h3
              className="font-semibold leading-snug"
              style={{ color: '#f0dfc4', fontSize: 'clamp(16px, 2.15vw, 25px)' }}
            >
              {shelf.name}
            </h3>
            <p
              className="mt-0.5"
              style={{ color: 'rgba(231, 190, 126, 0.78)', fontSize: 'clamp(12px, 1.5vw, 17px)' }}
            >
              {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            {shelf.isPrivate && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
                style={{ color: 'rgba(130, 95, 55, 0.65)' }}
                aria-label="Private shelf"
              >
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            )}
            {shelf.isSystem && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{
                  background: 'rgba(20, 10, 4, 0.48)',
                  border:     '1px solid rgba(202, 140, 64, 0.36)',
                  color:      'rgba(232, 190, 126, 0.88)',
                }}
              >
                default
              </span>
            )}
            {/* Customize button — stopPropagation prevents the Link from navigating */}
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleCustomize(); }}
              aria-label="Customize shelf appearance"
              aria-pressed={isCustomizing}
              className="p-1.5 rounded-lg transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              style={{
                background: isCustomizing ? 'rgba(180, 83, 9, 0.62)' : 'rgba(20, 10, 4, 0.52)',
                border:     `1px solid ${isCustomizing ? 'rgba(217, 119, 6, 0.72)' : 'rgba(202, 140, 64, 0.32)'}`,
                color:      isCustomizing ? '#fcd888' : 'rgba(160, 120, 60, 0.70)',
              }}
            >
              {/* Heroicons: adjustments-horizontal */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                <path d="M10 3.75a2 2 0 10-4 0 2 2 0 004 0zM17.25 4.5a.75.75 0 000-1.5h-5.5a.75.75 0 000 1.5h5.5zM5 3.75a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM4.25 17a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zM17.25 17a.75.75 0 000-1.5h-5.5a.75.75 0 000 1.5h5.5zM9 10a.75.75 0 01-.75.75h-5.5a.75.75 0 010-1.5h5.5A.75.75 0 019 10zM17.25 10.75a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zM14 10a2 2 0 10-4 0 2 2 0 004 0zM10 16.25a2 2 0 10-4 0 2 2 0 004 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Book spines */}
        <div
          className="absolute z-[4]"
          style={{
            left:   '17.5%',
            right:  '22%',
            bottom: '21.5%',
          }}
        >
          <BookSpinePreview bookCount={shelf.bookCount} shelfId={shelf.id} arrangement={bookArrangement} />
        </div>

        {/* Shelf decorations */}
        {decorationLeft  && <DecorationSpot item={decorationLeft}  side="left"  />}
        {decorationRight && <DecorationSpot item={decorationRight} side="right" />}
      </Link>

      {/* Customization panel — expands below the card when active */}
      {isCustomizing && (
        <div className="mt-2">
          <ShelfCustomizationPanel value={settings} onChange={onSettingsChange} />
        </div>
      )}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function ShelfSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse border border-amber-900/20"
      style={{ background: 'rgba(18, 9, 4, 0.70)' }}
    >
      <div className="px-5 pt-5">
        <div className="h-4 w-40 rounded bg-zinc-800 mb-2" />
        <div className="h-3 w-20 rounded bg-zinc-800" />
        <div className="flex items-end gap-1.5 mt-4" style={{ minHeight: '84px' }}>
          {[64, 72, 60, 76].map((h, i) => (
            <div key={i} className="w-5 rounded-t bg-zinc-800" style={{ height: `${h}px` }} />
          ))}
        </div>
      </div>
      <div className="h-3.5 bg-zinc-800/60" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ShelvesPage() {

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [shelves,        setShelves]        = useState<ShelfResponse[]>([]);
  const [customizations, setCustomizations] = useState<Record<string, ShelfCustomizationState>>({});
  const [openPanelId,    setOpenPanelId]    = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  // New shelf inline form
  const [isCreating,  setIsCreating]  = useState(false);
  const [newName,     setNewName]     = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    shelvesApi.getShelves()
      .then(data => {
        setShelves(data);
        const initial: Record<string, ShelfCustomizationState> = {};
        for (const shelf of data) initial[shelf.id] = defaultSettingsFor(shelf);
        setCustomizations(initial);
      })
      .catch(() => setError('Failed to load shelves. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [user, authLoading]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSavingNew(true);
    setCreateError(null);
    try {
      const created = await shelvesApi.createShelf({ name: newName.trim() });
      setShelves(prev => [...prev, created]);
      setCustomizations(prev => ({ ...prev, [created.id]: defaultSettingsFor(created) }));
      setNewName('');
      setIsCreating(false);
    } catch {
      setCreateError('Failed to create shelf. Please try again.');
    } finally {
      setIsSavingNew(false);
    }
  };

  function togglePanel(id: string) {
    setOpenPanelId(prev => prev === id ? null : id);
  }

  function updateSettings(id: string, next: ShelfCustomizationState) {
    setCustomizations(prev => ({ ...prev, [id]: next }));
  }

  if (authLoading) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0dfc4' }}>My Shelves</h1>
          <p className="mt-1 text-sm" style={{ color: '#6b4726' }}>
            {user?.displayName}&rsquo;s reading collection
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-amber-900/45 hover:border-amber-700/65"
            style={{ background: 'rgba(55, 32, 12, 0.60)', color: '#c8a472' }}
          >
            <span aria-hidden="true">+</span> New Shelf
          </button>
        )}
      </div>

      {/* New shelf inline form */}
      {isCreating && (
        <div
          className="mb-5 rounded-2xl border border-amber-900/40 flex flex-col gap-3 px-5 py-5"
          style={{ background: 'rgba(18, 9, 4, 0.80)' }}
        >
          <p className="text-sm font-medium" style={{ color: '#c8a472' }}>New shelf</p>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  handleCreate();
              if (e.key === 'Escape') { setIsCreating(false); setNewName(''); setCreateError(null); }
            }}
            placeholder="Shelf name…"
            maxLength={80}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none border border-amber-900/35 focus:border-amber-700/55 placeholder-zinc-700"
            style={{ background: 'rgba(30, 15, 6, 0.70)', color: '#f0dfc4' }}
          />
          {createError && <p className="text-xs text-red-400">{createError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isSavingNew || !newName.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: '#c8a472', color: '#1a0c04' }}
            >
              {isSavingNew ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setIsCreating(false); setNewName(''); setCreateError(null); }}
              className="px-4 py-1.5 rounded-lg text-sm transition-colors border border-amber-900/30 hover:border-amber-800/50"
              style={{ background: 'rgba(40, 22, 8, 0.60)', color: '#8a6040' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => <ShelfSkeleton key={i} />)}
        </div>
      )}

      {/* Error state */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Shelf list */}
      {!isLoading && !error && (
        <div className="flex flex-col gap-4">
          {shelves.map(shelf => {
            const settings = customizations[shelf.id] ?? defaultSettingsFor(shelf);
            return (
              <ShelfCard
                key={shelf.id}
                shelf={shelf}
                settings={settings}
                isCustomizing={openPanelId === shelf.id}
                onToggleCustomize={() => togglePanel(shelf.id)}
                onSettingsChange={next => updateSettings(shelf.id, next)}
              />
            );
          })}
          {shelves.length === 0 && (
            <p className="text-sm italic" style={{ color: 'rgba(130, 95, 55, 0.60)' }}>
              No shelves yet.
            </p>
          )}
        </div>
      )}

    </main>
  );
}
