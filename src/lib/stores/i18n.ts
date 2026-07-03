import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { initI18n, changeLanguage as i18nChangeLang, t as i18nT, getCurrentLang } from '$lib/i18n/i18n';

const savedLang = browser ? (localStorage.getItem('help_lang') || navigator.language?.split('-')[0] || 'en') : 'en';

if (typeof window !== 'undefined') {
  initI18n(savedLang);
} else {
  initI18n('en');
}

export const lang = writable<string>(savedLang);

lang.subscribe((lng) => {
  i18nChangeLang(lng);
  if (browser) {
    localStorage.setItem('help_lang', lng);
  }
});

export const t = derived(lang, () => {
  return (key: string, options?: any): string => {
    return i18nT(key, options);
  };
});
