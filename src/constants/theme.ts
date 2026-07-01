// @ts-ignore
import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  bgDark: '#02050c',       // Deep space black background
  bgCard: '#090e1a',       // Slate gray tech card background
  bgCardSelected: '#131b2e', // Active / highlighted card background
  cyan: '#00f0ff',         // Neon cyan accent (primary glow)
  magenta: '#ff0055',      // Neon magenta accent (secondary/action glow)
  yellow: '#ffea00',       // Tech yellow (warning)
  green: '#39ff14',        // Neon green (active/safe status)
  red: '#ff003c',          // Alarm red (inactive/empty status)
  border: '#111b30',       // Tech dark blue border
  borderCyan: '#00f0ff55', // Faded cyan border
  text: '#ffffff',         // White primary text
  textSecondary: '#8a9ab3', // Light tech blue secondary text
  textMuted: '#475569',    // Slate gray muted text
  
  // Backwards compatibility with template standard colors
  light: {
    text: '#ffffff',
    background: '#02050c',
    backgroundElement: '#090e1a',
    backgroundSelected: '#131b2e',
    textSecondary: '#8a9ab3',
  },
  dark: {
    text: '#ffffff',
    background: '#02050c',
    backgroundElement: '#090e1a',
    backgroundSelected: '#131b2e',
    textSecondary: '#8a9ab3',
  }
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Glows = {
  cyan: {
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    ...Platform.select({
      android: {
        elevation: 6,
      },
    }),
  },
  magenta: {
    shadowColor: Colors.magenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    ...Platform.select({
      android: {
        elevation: 6,
      },
    }),
  },
  green: {
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    ...Platform.select({
      android: {
        elevation: 5,
      },
    }),
  },
  red: {
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    ...Platform.select({
      android: {
        elevation: 5,
      },
    }),
  }
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Times New Roman',
    rounded: 'System',
    mono: 'Courier',
    tech: 'Courier New',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
    tech: 'monospace',
  },
  web: {
    sans: 'system-ui, sans-serif',
    serif: 'serif',
    rounded: 'ui-rounded, sans-serif',
    mono: 'ui-monospace, monospace',
    tech: '"Courier New", Courier, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
