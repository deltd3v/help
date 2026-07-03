import { writable, derived } from 'svelte/store';
import type { Lang } from '$lib/i18n/translations';
import { translations } from '$lib/i18n/translations';

export const lang = writable<Lang>('en');

export const t = derived(lang, ($lang) => {
  const dict = translations[$lang] || translations.en;
  return (key: string): string => dict[key] || key;
});
