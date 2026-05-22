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

const SHELF_ORDER_STORAGE_PREFIX = 'bookrithm:shelf-order:';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

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

function chunkShelves(shelves: ShelfResponse[]): ShelfResponse[][] {
  const chunks: ShelfResponse[][] = [];
  for (let i = 0; i < shelves.length; i += 3) {
    chunks.push(shelves.slice(i, i + 3));
  }
  return chunks;
}

function orderShelvesByIds(shelves: ShelfResponse[], orderedIds: string[]): ShelfResponse[] {
  const byId = new Map(shelves.map(shelf => [shelf.id, shelf]));
  const ordered = orderedIds
    .map(id => byId.get(id))
    .filter((shelf): shelf is ShelfResponse => Boolean(shelf));
  const orderedIdSet = new Set(ordered.map(shelf => shelf.id));
  const missing = shelves.filter(shelf => !orderedIdSet.has(shelf.id));

  return [...ordered, ...missing];
}

function getShelfOrderStorageKey(userId?: string): string | null {
  return userId ? `${SHELF_ORDER_STORAGE_PREFIX}${userId}` : null;
}

function DecorationSpot({ item, side }: { item: DecorationItem; side: 'left' | 'right' }) {
  const { emoji, label, imagePath } = DECORATION_DISPLAY[item];

  return (
    <div
      title={label}
      className="absolute z-[6] pointer-events-none select-none"
      style={{
        bottom:     '9%',
        [side]:     side === 'left' ? '17.5%' : '16.5%',
        fontSize:   'clamp(18px, 2.8vw, 34px)',
        lineHeight: 1,
        filter:     'drop-shadow(0 6px 8px rgba(0,0,0,0.72))',
      }}
    >
      {imagePath ? (
        <Image src={imagePath} alt={label} width={34} height={34} style={{ display: 'block' }} />
      ) : (
        <span role="img" aria-label={label}>{emoji}</span>
      )}
    </div>
  );
}

const ROW_FRAMES = [
  { top: '8.4%',  height: '27.2%' },
  { top: '39.6%', height: '26.9%' },
  { top: '70.3%', height: '26.9%' },
] as const;

function ShelfRow({
  shelf,
  settings,
  rowIndex,
  isCustomizing,
  onToggleCustomize,
  onSettingsChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragTarget,
}: {
  shelf:             ShelfResponse;
  settings:          ShelfCustomizationState;
  rowIndex:          number;
  isCustomizing:     boolean;
  onToggleCustomize: () => void;
  onSettingsChange:  (next: ShelfCustomizationState) => void;
  onDragStart:       () => void;
  onDragOver:        () => void;
  onDrop:            () => void;
  onDragEnd:         () => void;
  isDragging:        boolean;
  isDragTarget:      boolean;
}) {
  const {
    woodStyle,
    lightEnabled,
    lightColor,
    lightIntensity,
    shadowEnabled,
    bookArrangement,
    decorationLeft,
    decorationRight,
  } = settings;
  const frame = ROW_FRAMES[rowIndex];

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', shelf.id);
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={`absolute left-[4.4%] right-[4.4%] z-[4] cursor-grab transition duration-150 active:cursor-grabbing ${
        isDragging ? 'scale-[0.985]' : ''
      }`}
      style={{
        top:    frame.top,
        height: frame.height,
        filter: [
          shadowEnabled ? 'drop-shadow(0 12px 18px rgba(0,0,0,0.34))' : undefined,
          isDragTarget ? 'drop-shadow(0 0 18px rgba(224,157,68,0.34))' : undefined,
        ].filter(Boolean).join(' ') || undefined,
        opacity: isDragging ? 0.58 : 1,
      }}
    >
      {isDragTarget && (
        <div className="pointer-events-none absolute inset-0 z-[9] rounded-sm border-2 border-amber-400/75 bg-amber-300/[0.07] shadow-[0_0_28px_rgba(245,180,72,0.34),inset_0_0_22px_rgba(245,180,72,0.12)]">
          <span
            className="absolute right-[6%] top-[8%] rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'rgba(32, 14, 4, 0.86)',
              border:     '1px solid rgba(245, 180, 72, 0.68)',
              color:      '#f9dda5',
            }}
          >
            Drop here
          </span>
        </div>
      )}

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-[9] rounded-sm bg-black/18 ring-2 ring-amber-500/60">
          <span
            className="absolute left-[5.8%] top-[8%] rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'rgba(32, 14, 4, 0.86)',
              border:     '1px solid rgba(245, 180, 72, 0.58)',
              color:      '#f9dda5',
            }}
          >
            Moving shelf
          </span>
        </div>
      )}

      <Link
        href={`/shelves/${shelf.id}`}
        className="group absolute inset-0 block rounded-sm transition-all duration-200 hover:bg-amber-200/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        style={{
          '--shelf-light-color':     lightColor,
          '--shelf-light-intensity': lightIntensity,
          '--shelf-wood-style':      woodStyle,
        } as React.CSSProperties}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-[8%] inset-y-0 z-[2] transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, ${hexToRgba(lightColor, 0.32)} 0%, ${hexToRgba(lightColor, 0.12)} 38%, transparent 74%)`,
            opacity:    lightEnabled ? Math.min(0.64, lightIntensity * 0.88) : 0,
            mixBlendMode: 'screen',
          }}
        />

        <div className="absolute left-[5.8%] top-[22%] z-[6] max-w-[34%]">
          <h3
            className="truncate font-semibold leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]"
            style={{ color: '#f8e8c8', fontSize: 'clamp(15px, 2.1vw, 26px)' }}
          >
            {shelf.name}
          </h3>
          <p
            className="mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]"
            style={{ color: 'rgba(244, 188, 93, 0.92)', fontSize: 'clamp(12px, 1.45vw, 18px)' }}
          >
            {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
          </p>
        </div>

        <div
          className="absolute bottom-[2%] left-[19%] right-[21%] z-[4]"
          style={{
            transform:       'scale(0.78)',
            transformOrigin: 'left bottom',
          }}
        >
          <BookSpinePreview
            bookCount={shelf.bookCount}
            shelfId={shelf.id}
            arrangement={bookArrangement}
          />
        </div>

        {decorationLeft  && <DecorationSpot item={decorationLeft}  side="left"  />}
        {decorationRight && <DecorationSpot item={decorationRight} side="right" />}
      </Link>

      <div className="absolute right-[5.8%] top-[22%] z-[8] flex items-center gap-2">
        <span
          title="Drag to reorder shelf"
          className="flex h-7 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{
            background: 'rgba(20, 10, 4, 0.46)',
            border:     '1px solid rgba(202, 140, 64, 0.28)',
            color:      'rgba(242, 198, 128, 0.70)',
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M7 4.5A1.5 1.5 0 1 1 4 4.5a1.5 1.5 0 0 1 3 0ZM7 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5.5 17A1.5 1.5 0 1 0 5.5 14a1.5 1.5 0 0 0 0 3ZM16 4.5A1.5 1.5 0 1 1 13 4.5a1.5 1.5 0 0 1 3 0ZM14.5 11.5A1.5 1.5 0 1 0 14.5 8.5a1.5 1.5 0 0 0 0 3ZM16 15.5A1.5 1.5 0 1 1 13 15.5a1.5 1.5 0 0 1 3 0Z" />
          </svg>
          Drag
        </span>
        {shelf.isPrivate && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            style={{ color: 'rgba(226, 175, 93, 0.72)' }}
            aria-label="Private shelf"
          >
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
        )}
        {shelf.isSystem && (
          <span
            className="rounded-full px-3 py-1 text-xs"
            style={{
              background: 'rgba(20, 10, 4, 0.58)',
              border:     '1px solid rgba(202, 140, 64, 0.38)',
              color:      'rgba(242, 198, 128, 0.92)',
            }}
          >
            default
          </span>
        )}
        <button
          type="button"
          draggable={false}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleCustomize();
          }}
          aria-label="Customize shelf appearance"
          aria-haspopup="menu"
          aria-pressed={isCustomizing}
          className="rounded-full px-3 py-1 text-sm transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          style={{
            background: isCustomizing ? 'rgba(180, 83, 9, 0.62)' : 'rgba(20, 10, 4, 0.58)',
            border:     `1px solid ${isCustomizing ? 'rgba(217, 119, 6, 0.72)' : 'rgba(202, 140, 64, 0.38)'}`,
            color:      isCustomizing ? '#fcd888' : 'rgba(242, 198, 128, 0.92)',
          }}
        >
          ...
        </button>

        {isCustomizing && (
          <div
            className="absolute right-0 top-full mt-2 z-30"
            onClick={(event) => event.stopPropagation()}
          >
            <ShelfCustomizationPanel value={settings} onChange={onSettingsChange} />
          </div>
        )}
      </div>
    </div>
  );
}

function BookcaseSection({
  shelves,
  customizations,
  openPanelId,
  draggedShelfId,
  dragTargetShelfId,
  onToggleCustomize,
  onSettingsChange,
  onShelfDragStart,
  onShelfDragOver,
  onShelfDrop,
  onShelfDragEnd,
}: {
  shelves:            ShelfResponse[];
  customizations:     Record<string, ShelfCustomizationState>;
  openPanelId:        string | null;
  draggedShelfId:     string | null;
  dragTargetShelfId:  string | null;
  onToggleCustomize:  (id: string) => void;
  onSettingsChange:   (id: string, next: ShelfCustomizationState) => void;
  onShelfDragStart:   (id: string) => void;
  onShelfDragOver:    (id: string) => void;
  onShelfDrop:        (id: string) => void;
  onShelfDragEnd:     () => void;
}) {
  return (
    <div>
      <div
        className="relative overflow-visible"
        style={{
          aspectRatio: '1456 / 1087',
          minHeight:   '240px',
        }}
      >
        <Image
          src="/images/multi_realistic_bookshelf_transparent.png"
          alt=""
          fill
          priority={false}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="pointer-events-none select-none object-contain drop-shadow-[0_24px_42px_rgba(0,0,0,0.55)]"
          aria-hidden="true"
        />

        {shelves.map((shelf, index) => {
          const settings = customizations[shelf.id] ?? defaultSettingsFor(shelf);
          return (
            <ShelfRow
              key={shelf.id}
              shelf={shelf}
              settings={settings}
              rowIndex={index}
              isCustomizing={openPanelId === shelf.id}
              isDragging={draggedShelfId === shelf.id}
              isDragTarget={dragTargetShelfId === shelf.id && draggedShelfId !== shelf.id}
              onToggleCustomize={() => onToggleCustomize(shelf.id)}
              onSettingsChange={next => onSettingsChange(shelf.id, next)}
              onDragStart={() => onShelfDragStart(shelf.id)}
              onDragOver={() => onShelfDragOver(shelf.id)}
              onDrop={() => onShelfDrop(shelf.id)}
              onDragEnd={onShelfDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div
      className="relative overflow-hidden animate-pulse"
      style={{
        aspectRatio: '1456 / 1087',
        minHeight:   '240px',
      }}
    >
      <Image
        src="/images/multi_realistic_bookshelf_transparent.png"
        alt=""
        fill
        priority={false}
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="pointer-events-none select-none object-contain opacity-40"
        aria-hidden="true"
      />
    </div>
  );
}

export default function ShelvesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [shelves,        setShelves]        = useState<ShelfResponse[]>([]);
  const [customizations, setCustomizations] = useState<Record<string, ShelfCustomizationState>>({});
  const [openPanelId,    setOpenPanelId]    = useState<string | null>(null);
  const [draggedShelfId, setDraggedShelfId] = useState<string | null>(null);
  const [dragTargetShelfId, setDragTargetShelfId] = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState<string | null>(null);

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
        const storageKey = getShelfOrderStorageKey(user.id);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(data.map(shelf => shelf.id)));
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
      setShelves(prev => {
        const next = [...prev, created];
        const storageKey = getShelfOrderStorageKey(user?.id);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next.map(shelf => shelf.id)));
        return next;
      });
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

  function handleShelfDrop(targetShelfId: string) {
    if (!draggedShelfId || draggedShelfId === targetShelfId) {
      setDraggedShelfId(null);
      setDragTargetShelfId(null);
      return;
    }

    const draggedIndex = shelves.findIndex(shelf => shelf.id === draggedShelfId);
    const targetIndex = shelves.findIndex(shelf => shelf.id === targetShelfId);

    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedShelfId(null);
      setDragTargetShelfId(null);
      return;
    }

    const previousShelves = shelves;
    const nextShelves = [...shelves];
    const [draggedShelf] = nextShelves.splice(draggedIndex, 1);
    nextShelves.splice(targetIndex, 0, draggedShelf);

    setShelves(nextShelves);
    setDraggedShelfId(null);
    setDragTargetShelfId(null);
    setOpenPanelId(null);

    const nextShelfIds = nextShelves.map(shelf => shelf.id);
    const storageKey = getShelfOrderStorageKey(user?.id);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(nextShelfIds));

    shelvesApi.reorderShelves({ shelfIds: nextShelfIds })
      .then(updatedShelves => {
        setError(null);
        if (updatedShelves.length > 0) {
          setShelves(orderShelvesByIds(updatedShelves, nextShelfIds));
        }
      })
      .catch(() => {
        setShelves(previousShelves);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(previousShelves.map(shelf => shelf.id)));
        setError('Shelf order could not be saved. Please try again.');
      });
  }

  if (authLoading) return null;

  const bookcases = chunkShelves(shelves);
  const draggedShelfName = draggedShelfId
    ? shelves.find(shelf => shelf.id === draggedShelfId)?.name
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: '#f0dfc4' }}>
            My Shelves
          </h1>
          <div className="mt-3 h-px w-44" style={{ background: 'linear-gradient(90deg, rgba(202, 140, 64, 0.76), transparent)' }} />
          <p className="mt-3 text-lg" style={{ color: '#a87947' }}>
            {user?.displayName}&rsquo;s reading collection
          </p>
          <p className="mt-2 text-sm" style={{ color: 'rgba(226, 175, 93, 0.76)' }}>
            Use the Drag handle on any shelf to reorder your collection.
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex shrink-0 items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all duration-200 border border-amber-800/65 hover:border-amber-600/80"
            style={{ background: 'rgba(55, 32, 12, 0.66)', color: '#e4bf84' }}
          >
            <span aria-hidden="true">+</span> New Shelf
          </button>
        )}
      </div>

      {draggedShelfName && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-3 z-40 mb-5 rounded-lg px-4 py-3 text-sm font-medium shadow-[0_14px_28px_rgba(0,0,0,0.34)]"
          style={{
            background: 'rgba(32, 14, 4, 0.92)',
            border:     '1px solid rgba(226, 175, 93, 0.48)',
            color:      '#f4d6a0',
          }}
        >
          Moving &ldquo;{draggedShelfName}&rdquo;. Drop it over another shelf to place it there.
        </div>
      )}

      {isCreating && (
        <div
          className="mb-5 flex flex-col gap-3 rounded-lg border border-amber-900/40 px-5 py-5"
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
            placeholder="Shelf name..."
            maxLength={80}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none border border-amber-900/35 focus:border-amber-700/55 placeholder-zinc-700"
            style={{ background: 'rgba(30, 15, 6, 0.70)', color: '#f0dfc4' }}
          />
          {createError && <p className="text-xs text-red-400">{createError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isSavingNew || !newName.trim()}
              className="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: '#c8a472', color: '#1a0c04' }}
            >
              {isSavingNew ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { setIsCreating(false); setNewName(''); setCreateError(null); }}
              className="rounded-lg px-4 py-1.5 text-sm transition-colors border border-amber-900/30 hover:border-amber-800/50"
              style={{ background: 'rgba(40, 22, 8, 0.60)', color: '#8a6040' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 2 }).map((_, i) => <ShelfSkeleton key={i} />)}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!isLoading && !error && (
        <div className="flex flex-col gap-8">
          {bookcases.map((group, index) => (
            <BookcaseSection
              key={group.map(shelf => shelf.id).join('-') || index}
              shelves={group}
              customizations={customizations}
              openPanelId={openPanelId}
              draggedShelfId={draggedShelfId}
              dragTargetShelfId={dragTargetShelfId}
              onToggleCustomize={togglePanel}
              onSettingsChange={updateSettings}
              onShelfDragStart={setDraggedShelfId}
              onShelfDragOver={setDragTargetShelfId}
              onShelfDrop={handleShelfDrop}
              onShelfDragEnd={() => {
                setDraggedShelfId(null);
                setDragTargetShelfId(null);
              }}
            />
          ))}
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
