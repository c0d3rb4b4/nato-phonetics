export type RoutePath = keyof typeof import('./navigation/routes').ROUTE_TITLES;
export type IconName = 'menu' | 'menu-outline' | 'home-outline' | 'book-outline' | 'text-outline'
  | 'chevron-forward' | 'mic-outline' | 'volume-high-outline' | 'shield-checkmark-outline'
  | 'settings-outline' | 'help-circle-outline' | 'information-circle-outline';

export type LetterSymbol =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
export type DigitSymbol = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type EntryContent = {
  word: string;
  pronunciation: string;
  /** Intentional provider input, separate from canonical spelling and guide. */
  speechText: string;
  color: string;
};

export type LetterEntry = EntryContent & { letter: LetterSymbol };
export type DigitEntry = EntryContent & { digit: DigitSymbol };

export type ConversionToken =
  | { type: 'letter'; entry: LetterEntry }
  | { type: 'number'; entry: DigitEntry }
  | { type: 'space' }
  | { type: 'punctuation'; char: string; word: string }
  | { type: 'unknown'; char: string };

export type QuizQuestion = { correct: LetterEntry; options: string[] };
export type QuizFeedback = 'correct' | 'wrong' | null;

export type ThemeMode = 'system' | 'light' | 'dark';
export type Preferences = {
  version: 1;
  themeMode: ThemeMode;
  selectedVoice: string | null;
  /** Absent in older v1 records; defaults apply until explicitly changed. */
  converterPacing?: { rate: number; wordPauseMs: number };
};
export type PreferenceError = {
  operation: 'load' | 'save' | 'migration' | 'cleanup';
  message: string;
};
export type PreferenceSnapshot = {
  preferences: Preferences;
  isLoading: boolean;
  isSaving: boolean;
  error: PreferenceError | null;
};
export type PreferenceStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  multiRemove: (keys: string[]) => Promise<unknown>;
};

export type Theme = {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
  };
};

export type ThemeContextValue = {
  theme: Theme;
  preferences: Preferences;
  isLoading: boolean;
  isSaving: boolean;
  preferenceError: PreferenceError | null;
  setThemeMode: (mode: ThemeMode) => Promise<boolean>;
  setSelectedVoice: (identifier: string | null) => Promise<boolean>;
  setConverterPacing: (value: NonNullable<Preferences['converterPacing']>) => Promise<boolean>;
  resetPreferences: () => Promise<boolean>;
  retryPreferences: () => Promise<void>;
};

export type SpeechResult =
  | { status: 'completed' }
  | { status: 'failed'; error: Error }
  | { status: 'cancelled' };

export type SpeechToken = { text: string; pauseAfterMs?: number };
export type PlaybackOptions = { voice?: string | null; rate?: number; pauseMs?: number };
export type PlaybackSnapshot = {
  owner: string | null;
  status: 'idle' | 'preparing' | 'playing' | 'paused';
  tokenIndex: number;
  tokenCount: number;
  result: SpeechResult | null;
  warning: string | null;
};
export type EnglishVoice = {
  identifier: string;
  name: string;
  language: string;
  quality: string;
  localService?: boolean;
};

export type NavigationItem = {
  title: string;
  icon: IconName;
  route: RoutePath;
  description: string;
};
