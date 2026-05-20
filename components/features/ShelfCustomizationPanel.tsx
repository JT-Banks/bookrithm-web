'use client';

import type {
  WoodStyle,
  BookArrangement,
  DecorationItem,
  ShelfThemeName,
  ShelfCustomizationState,
} from '@/types/shelves';
import {
  SHELF_THEME_PRESETS,
  WOOD_STYLES,
  DECORATION_DISPLAY,
  themeToState,
} from '@/types/shelves';

// ── Static display maps ───────────────────────────────────────────────────────

const WOOD_LABELS: Record<WoodStyle, string> = {
  oak:       'Oak',
  walnut:    'Walnut',
  mahogany:  'Mahogany',
  blackwood: 'Blackwood',
  cherry:    'Cherry',
};

/** Representative board colour used for the swatch circle. */
const WOOD_SWATCHES: Record<WoodStyle, string> = {
  oak:       '#c4882a',
  walnut:    '#9a6030',
  mahogany:  '#8b2a20',
  blackwood: '#3c2816',
  cherry:    '#a04a28',
};

const ARRANGEMENT_LABELS: Record<BookArrangement, string> = {
  neat:    'Neat',
  messy:   'Messy',
  leaning: 'Leaning',
  stacked: 'Stacked',
  mixed:   'Mixed',
};

// ── Palette (warm library theme) ──────────────────────────────────────────────

const C = {
  panelBg:    'rgba(12, 6, 2, 0.94)',
  border:     'rgba(90, 58, 26, 0.50)',
  inputBg:    'rgba(30, 15, 5, 0.80)',
  label:      'rgba(210, 175, 110, 0.85)',
  muted:      'rgba(160, 120, 60, 0.65)',
  activeBg:   'rgba(180, 83, 9, 0.70)',
  activeBdr:  'rgba(217, 119, 6, 0.80)',
  activeText: '#fcd888',
  toggleOn:   '#b45309',
  toggleOff:  'rgba(60, 40, 20, 0.80)',
} as const;

// ── Primitive sub-components ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] uppercase tracking-widest font-semibold mb-2.5"
      style={{ color: C.muted }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return <div className="border-b" style={{ borderColor: C.border }} />;
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label:    string;
  checked:  boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: C.label }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        style={{ background: checked ? C.toggleOn : C.toggleOff }}
      >
        <span
          className="inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface ShelfCustomizationPanelProps {
  value:    ShelfCustomizationState;
  onChange: (next: ShelfCustomizationState) => void;
}

export function ShelfCustomizationPanel({ value, onChange }: ShelfCustomizationPanelProps) {
  /** Update a single key in state. */
  function set<K extends keyof ShelfCustomizationState>(
    key: K,
    val: ShelfCustomizationState[K],
  ) {
    onChange({ ...value, [key]: val });
  }

  /** Apply all fields from a named theme preset. */
  function applyPreset(name: ShelfThemeName) {
    onChange(themeToState(SHELF_THEME_PRESETS[name]));
  }

  /** Identify which preset (if any) exactly matches the current state. */
  const activePreset = (Object.keys(SHELF_THEME_PRESETS) as ShelfThemeName[]).find(name => {
    const p = SHELF_THEME_PRESETS[name];
    return (
      p.woodStyle                          === value.woodStyle       &&
      p.lightEnabled                       === value.lightEnabled    &&
      p.lightColor                         === value.lightColor      &&
      p.lightIntensity                     === value.lightIntensity  &&
      p.shadowEnabled                      === value.shadowEnabled   &&
      p.bookArrangement                    === value.bookArrangement &&
      (p.decorations?.decorationLeft  ?? undefined) === value.decorationLeft  &&
      (p.decorations?.decorationRight ?? undefined) === value.decorationRight
    );
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? C.activeBg  : C.inputBg,
    border:     `1px solid ${active ? C.activeBdr : C.border}`,
    color:      active ? C.activeText : C.label,
    fontWeight: active ? 600 : 400,
  });

  return (
    <div
      className="rounded-2xl overflow-hidden text-sm"
      style={{ background: C.panelBg, border: `1px solid ${C.border}`, minWidth: '260px' }}
    >
      {/* ── Theme Presets ── */}
      <section className="p-4">
        <SectionLabel>Theme Preset</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SHELF_THEME_PRESETS) as ShelfThemeName[]).map(name => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(name)}
              className="px-2.5 py-1 rounded-full text-xs transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              style={pillStyle(activePreset === name)}
            >
              {SHELF_THEME_PRESETS[name].label}
            </button>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Wood Style ── */}
      <section className="p-4">
        <SectionLabel>Wood Style</SectionLabel>
        <div className="flex items-center gap-3">
          {(Object.keys(WOOD_STYLES) as WoodStyle[]).map(style => {
            const active = value.woodStyle === style;
            return (
              <button
                key={style}
                type="button"
                title={WOOD_LABELS[style]}
                aria-label={WOOD_LABELS[style]}
                onClick={() => set('woodStyle', style)}
                className="rounded-full transition-all duration-150 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                style={{
                  width:      active ? '28px' : '22px',
                  height:     active ? '28px' : '22px',
                  background: WOOD_SWATCHES[style],
                  border:     `2px solid ${active ? '#fcd888' : 'rgba(0,0,0,0.40)'}`,
                  boxShadow:  active ? `0 0 8px 1px ${WOOD_SWATCHES[style]}99` : 'none',
                }}
              />
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
          {WOOD_LABELS[value.woodStyle]}
        </p>
      </section>

      <Divider />

      {/* ── Lighting ── */}
      <section className="p-4 space-y-3">
        <SectionLabel>Lighting</SectionLabel>

        <Toggle
          label="Ambient light"
          checked={value.lightEnabled}
          onChange={v => set('lightEnabled', v)}
        />

        {/* Color + intensity — dimmed when light is off */}
        <div
          className="space-y-3 transition-opacity duration-200"
          style={{
            opacity:       value.lightEnabled ? 1 : 0.30,
            pointerEvents: value.lightEnabled ? 'auto' : 'none',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: C.label }}>Color</span>
            <input
              type="color"
              value={value.lightColor}
              onChange={e => set('lightColor', e.target.value)}
              className="h-6 w-12 cursor-pointer rounded-md border-0 p-0.5"
              style={{ background: 'transparent' }}
              aria-label="Light color"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: C.label }}>Intensity</span>
              <span className="text-[11px] tabular-nums" style={{ color: C.muted }}>
                {Math.round(value.lightIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(value.lightIntensity * 100)}
              onChange={e => set('lightIntensity', Number(e.target.value) / 100)}
              className="w-full h-1.5 rounded-full cursor-pointer"
              style={{ accentColor: '#b45309' }}
              aria-label="Light intensity"
            />
          </div>
        </div>

        <Toggle
          label="Drop shadow"
          checked={value.shadowEnabled}
          onChange={v => set('shadowEnabled', v)}
        />
      </section>

      <Divider />

      {/* ── Book Arrangement ── */}
      <section className="p-4">
        <SectionLabel>Book Arrangement</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(ARRANGEMENT_LABELS) as BookArrangement[]).map(arr => (
            <button
              key={arr}
              type="button"
              onClick={() => set('bookArrangement', arr)}
              className="px-2.5 py-1 rounded-full text-xs transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              style={pillStyle(value.bookArrangement === arr)}
            >
              {ARRANGEMENT_LABELS[arr]}
            </button>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Decorations ── */}
      <section className="p-4">
        <SectionLabel>Decorations</SectionLabel>
        <div className="space-y-2">
          {(['decorationLeft', 'decorationRight'] as const).map(side => {
            const sideLabel = side === 'decorationLeft' ? 'Left' : 'Right';
            const current   = value[side] ?? '';
            return (
              <div key={side} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-xs" style={{ color: C.muted }}>
                  {sideLabel}
                </span>
                <select
                  value={current}
                  onChange={e => {
                    const v = e.target.value;
                    set(side, v === '' ? undefined : (v as DecorationItem));
                  }}
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  style={{
                    background: C.inputBg,
                    border:     `1px solid ${C.border}`,
                    color:      C.label,
                  }}
                  aria-label={`${sideLabel} decoration`}
                >
                  <option value="">— None —</option>
                  {(Object.keys(DECORATION_DISPLAY) as DecorationItem[]).map(item => (
                    <option key={item} value={item}>
                      {DECORATION_DISPLAY[item].emoji}  {DECORATION_DISPLAY[item].label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
