// Visual customization settings for a shelf card.
// Stored client-side (localStorage) — not yet persisted to the backend.

export interface ShelfLightSettings {
  lightEnabled:   boolean;
  lightColor:     string;  // hex color, e.g. '#ffb347'
  lightIntensity: number;  // 0.0 – 1.0
}

// ── Built-in presets ──────────────────────────────────────────────────────────

export const LIGHT_PRESETS = {
  warmCandlelight: { lightEnabled: true,  lightColor: '#ffb347', lightIntensity: 0.60 },
  goldenLamp:      { lightEnabled: true,  lightColor: '#f5c518', lightIntensity: 0.50 },
  coolMoonlight:   { lightEnabled: true,  lightColor: '#a8d8ea', lightIntensity: 0.40 },
  arcanBlue:       { lightEnabled: true,  lightColor: '#7eb8f7', lightIntensity: 0.45 },
  off:             { lightEnabled: false, lightColor: '#ffca50', lightIntensity: 0.50 },
} satisfies Record<string, ShelfLightSettings>;

// ── Per-shelf personality defaults for system shelves ─────────────────────────
// Keys match the shelf names returned by the API.

export const SYSTEM_SHELF_LIGHT: Record<string, ShelfLightSettings> = {
  'Currently Reading': LIGHT_PRESETS.warmCandlelight,
  'Favorites':         LIGHT_PRESETS.goldenLamp,
};

export const DEFAULT_SHELF_LIGHT: ShelfLightSettings = LIGHT_PRESETS.off;

// ── Wood styles ───────────────────────────────────────────────────────────────

export type WoodStyle = 'oak' | 'walnut' | 'mahogany' | 'blackwood' | 'cherry';

export interface WoodStyleConfig {
  boardGradient: string;
  cardBg:        string;
  borderDefault: string;
  borderHover:   string;
}

export const WOOD_STYLES: Record<WoodStyle, WoodStyleConfig> = {
  oak: {
    boardGradient: 'linear-gradient(180deg, #c4882a 0%, #8a5820 100%)',
    cardBg:        'rgba(22, 11, 3, 0.80)',
    borderDefault: 'rgba(196, 140, 42, 0.42)',
    borderHover:   'rgba(220, 172, 60, 0.72)',
  },
  walnut: {
    boardGradient: 'linear-gradient(180deg, #9a6030 0%, #4b2812 100%)',
    cardBg:        'rgba(18, 9, 4, 0.80)',
    borderDefault: 'rgba(154, 96, 48, 0.40)',
    borderHover:   'rgba(190, 130, 70, 0.68)',
  },
  mahogany: {
    boardGradient: 'linear-gradient(180deg, #8b2a20 0%, #3d1010 100%)',
    cardBg:        'rgba(20, 6, 5, 0.82)',
    borderDefault: 'rgba(139, 42, 32, 0.45)',
    borderHover:   'rgba(185, 62, 48, 0.70)',
  },
  blackwood: {
    boardGradient: 'linear-gradient(180deg, #2e1e10 0%, #0f0806 100%)',
    cardBg:        'rgba(8, 4, 2, 0.88)',
    borderDefault: 'rgba(60, 40, 22, 0.50)',
    borderHover:   'rgba(100, 70, 40, 0.72)',
  },
  cherry: {
    boardGradient: 'linear-gradient(180deg, #a04a28 0%, #5a2010 100%)',
    cardBg:        'rgba(20, 8, 5, 0.80)',
    borderDefault: 'rgba(160, 74, 40, 0.44)',
    borderHover:   'rgba(205, 105, 60, 0.70)',
  },
};

export const DEFAULT_WOOD_STYLE: WoodStyle = 'walnut';

/** System shelf name → default wood style */
export const SYSTEM_SHELF_WOOD: Record<string, WoodStyle> = {
  'Currently Reading': 'walnut',
  'Favorites':         'cherry',
  'Want to Read':      'oak',
  'Read':              'mahogany',
  'DNF':               'blackwood',
};

// ── Book arrangement ──────────────────────────────────────────────────────────

export type BookArrangement = 'neat' | 'messy' | 'leaning' | 'stacked' | 'mixed';

export const DEFAULT_BOOK_ARRANGEMENT: BookArrangement = 'neat';

/** System shelf name → default book arrangement */
export const SYSTEM_SHELF_ARRANGEMENT: Record<string, BookArrangement> = {
  'Currently Reading': 'neat',
  'Want to Read':      'messy',
  'Read':              'neat',
  'Favorites':         'mixed',
  'DNF':               'leaning',
};

// ── Decorations ───────────────────────────────────────────────────────────────

export type DecorationItem =
  | 'candle' | 'plant' | 'quill' | 'coffee'
  | 'crystalBall' | 'skull' | 'dragon' | 'lantern';

export interface ShelfDecorations {
  decorationLeft?:  DecorationItem;
  decorationRight?: DecorationItem;
}

/**
 * Display info per decoration.
 * To swap in a real asset: add `imagePath` to the entry — the DecorationSpot
 * component renders an <img> automatically when imagePath is present.
 */
export const DECORATION_DISPLAY: Record<
  DecorationItem,
  { emoji: string; label: string; imagePath?: string }
> = {
  candle:      { emoji: '🕯️', label: 'Candle' },
  plant:       { emoji: '🌿', label: 'Plant' },
  quill:       { emoji: '🪶', label: 'Quill' },
  coffee:      { emoji: '☕',  label: 'Coffee' },
  crystalBall: { emoji: '🔮', label: 'Crystal Ball' },
  skull:       { emoji: '💀', label: 'Skull' },
  dragon:      { emoji: '🐉', label: 'Dragon' },
  lantern:     { emoji: '🏮', label: 'Lantern' },
};

/** System shelf name → default decoration placement */
export const SYSTEM_SHELF_DECORATIONS: Record<string, ShelfDecorations> = {
  'Currently Reading': { decorationLeft: 'candle' },
  'Favorites':         { decorationRight: 'dragon' },
  'Want to Read':      { decorationRight: 'quill' },
  'DNF':               { decorationLeft: 'skull' },
};

export const DEFAULT_SHELF_DECORATIONS: ShelfDecorations = {};

// ── Theme presets ─────────────────────────────────────────────────────────────

export type ShelfThemeName =
  | 'cozyCandlelit'
  | 'darkAcademia'
  | 'wizardArchive'
  | 'royalLibrary'
  | 'moonlitStudy'
  | 'hauntedShelf'
  | 'forestReader';

/**
 * A named theme preset that fully describes the visual personality of a shelf.
 * `shadowEnabled` controls the drop-shadow under the shelf board (distinct from
 * the ambient light glow which is driven by `lightEnabled` + `lightIntensity`).
 */
export interface ShelfThemeConfig {
  /** Human-readable display name for the preset picker. */
  label:           string;
  woodStyle:       WoodStyle;
  lightEnabled:    boolean;
  lightColor:      string;
  lightIntensity:  number;
  shadowEnabled:   boolean;
  bookArrangement: BookArrangement;
  decorations?:    ShelfDecorations;
}

export const SHELF_THEME_PRESETS: Record<ShelfThemeName, ShelfThemeConfig> = {
  cozyCandlelit: {
    label:           'Cozy Candlelit',
    woodStyle:       'oak',
    lightEnabled:    true,
    lightColor:      '#ffb347',
    lightIntensity:  0.65,
    shadowEnabled:   true,
    bookArrangement: 'neat',
    decorations:     { decorationLeft: 'candle', decorationRight: 'coffee' },
  },
  darkAcademia: {
    label:           'Dark Academia',
    woodStyle:       'mahogany',
    lightEnabled:    true,
    lightColor:      '#c4a35a',
    lightIntensity:  0.35,
    shadowEnabled:   true,
    bookArrangement: 'messy',
    decorations:     { decorationLeft: 'quill' },
  },
  wizardArchive: {
    label:           'Wizard Archive',
    woodStyle:       'blackwood',
    lightEnabled:    true,
    lightColor:      '#7eb8f7',
    lightIntensity:  0.55,
    shadowEnabled:   true,
    bookArrangement: 'mixed',
    decorations:     { decorationLeft: 'crystalBall', decorationRight: 'lantern' },
  },
  royalLibrary: {
    label:           'Royal Library',
    woodStyle:       'cherry',
    lightEnabled:    true,
    lightColor:      '#f5c518',
    lightIntensity:  0.50,
    shadowEnabled:   true,
    bookArrangement: 'neat',
    decorations:     { decorationRight: 'lantern' },
  },
  moonlitStudy: {
    label:           'Moonlit Study',
    woodStyle:       'walnut',
    lightEnabled:    true,
    lightColor:      '#a8d8ea',
    lightIntensity:  0.40,
    shadowEnabled:   false,
    bookArrangement: 'neat',
    decorations:     { decorationRight: 'plant' },
  },
  hauntedShelf: {
    label:           'Haunted Shelf',
    woodStyle:       'blackwood',
    lightEnabled:    true,
    lightColor:      '#9b59b6',
    lightIntensity:  0.45,
    shadowEnabled:   true,
    bookArrangement: 'leaning',
    decorations:     { decorationLeft: 'skull', decorationRight: 'crystalBall' },
  },
  forestReader: {
    label:           'Forest Reader',
    woodStyle:       'oak',
    lightEnabled:    false,
    lightColor:      '#78c17a',
    lightIntensity:  0.30,
    shadowEnabled:   false,
    bookArrangement: 'messy',
    decorations:     { decorationLeft: 'plant' },
  },
};

// ── Customization state ───────────────────────────────────────────────────────

/** Full visual state of a single shelf — driven by ShelfCustomizationPanel. */
export interface ShelfCustomizationState {
  woodStyle:        WoodStyle;
  lightEnabled:     boolean;
  lightColor:       string;
  lightIntensity:   number;
  shadowEnabled:    boolean;
  bookArrangement:  BookArrangement;
  decorationLeft?:  DecorationItem;
  decorationRight?: DecorationItem;
}

/** Flatten a ShelfThemeConfig preset into a plain ShelfCustomizationState. */
export function themeToState(theme: ShelfThemeConfig): ShelfCustomizationState {
  return {
    woodStyle:       theme.woodStyle,
    lightEnabled:    theme.lightEnabled,
    lightColor:      theme.lightColor,
    lightIntensity:  theme.lightIntensity,
    shadowEnabled:   theme.shadowEnabled,
    bookArrangement: theme.bookArrangement,
    decorationLeft:  theme.decorations?.decorationLeft,
    decorationRight: theme.decorations?.decorationRight,
  };
}
