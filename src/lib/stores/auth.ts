import { writable } from 'svelte/store';

export interface Profile {
  name: string;
  about: string;
  country: string;
  language: string;
  score: number;
  pubkey: string;
}

export const darkMode = writable<boolean>(false);
export const signedIn = writable<boolean>(false);
export const profile = writable<Profile>({ name: '', about: '', country: '', language: '', score: 0, pubkey: '' });
export const npubFull = writable<string>('');
export const npubShort = writable<string>('');

export const _privkey = writable<string>('');
export const _pubkey = writable<string>('');
