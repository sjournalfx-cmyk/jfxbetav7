export type ThemePreference = 'obsidian' | 'cosmic';

export const normalizeThemePreference = (value?: string | null): ThemePreference => {
  if (value === 'cosmic') return 'cosmic';
  return 'obsidian';
};
