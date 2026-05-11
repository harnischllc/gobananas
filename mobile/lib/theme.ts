/**
 * Shared visual tokens. Mirrors docs/mockups/homescreen-concept-v1.html.
 * Keep this file thin — it's the only place colors and typography live.
 */

export const colors = {
  bg: '#faf7f0',
  ink: '#1f1d18',
  inkSoft: '#6b675e',
  line: '#e9e4d6',
  card: '#ffffff',
  accent: '#f5c518', // banana yellow
  accentDeep: '#d9a800',
  yellowSoft: '#fdf2bf',
  green: '#5d9a3f',
  greenSoft: '#d6ebc8',
  brown: '#8a5a2b',
  brownSoft: '#ead7c1',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 40,
};

export const shadow = {
  card: {
    shadowColor: '#1f1d18',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  hero: {
    shadowColor: '#d9a800',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
};
