import { writable, derived } from 'svelte/store';

export interface Peer {
  name: string;
  countryFlag: string;
  language: string;
  status: 'online' | 'away' | 'offline';
  score: number;
  lastActive: string;
  npub: string;
  handle: string;
}

const names = ['alice', 'bob', 'carlos', 'diana', 'elena', 'felix', 'gabriel', 'hana', 'ismael', 'juna'];
const flags = ['🇺🇸', '🇬🇧', '🇩🇪', '🇫🇷', '🇯🇵', '🇧🇷', '🇮🇳', '🇰🇷', '🇦🇺', '🇨🇦'];
const langs = ['en', 'en', 'de', 'fr', 'ja', 'pt', 'hi', 'ko', 'en', 'en'];
const statuses: Peer['status'][] = ['online', 'online', 'online', 'away', 'offline'];

function makePeers(): Peer[] {
  return names.map((n, i) => ({
    name: n,
    countryFlag: flags[i],
    language: langs[i],
    status: statuses[i % statuses.length],
    score: Math.floor(Math.random() * 60) + 5,
    lastActive: i < 4 ? 'now' : i < 7 ? '5m ago' : '1h ago',
    npub: `npub1${n}...`,
    handle: `@${n}_${Math.random().toString(36).slice(2, 6)}`,
  }));
}

export const peers = writable<Peer[]>(makePeers());

export const onlineCount = derived(peers, ($p) => $p.filter(p => p.status === 'online').length);

export function updatePeerStatus() {
  peers.update(p =>
    p.map(peer => {
      const r = Math.random();
      if (r < 0.3) return { ...peer, status: 'online' as Peer['status'], lastActive: 'now' };
      if (r < 0.5) return { ...peer, status: 'away' as Peer['status'], lastActive: '5m ago' };
      return { ...peer, status: 'offline' as Peer['status'], lastActive: '2h ago' };
    })
  );
}
