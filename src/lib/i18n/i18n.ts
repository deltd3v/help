import i18next from 'i18next';
import { browser } from '$app/environment';
import { translations } from './translations';

let initialized = false;

export function initI18n(lng: string = 'en') {
  if (initialized) return i18next;

  i18next.init({
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: true },
    resources: Object.fromEntries(
      Object.entries(translations).map(([lang, keys]) => [
        lang,
        { translation: keys }
      ])
    ),
  });

  initialized = true;
  return i18next;
}

export function changeLanguage(lng: string) {
  return i18next.changeLanguage(lng);
}

export function getCurrentLang(): string {
  return i18next.language;
}

export function t(key: string, options?: any): string {
  return i18next.t(key, options);
}
