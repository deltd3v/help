export interface SimPeer {
  id: number;
  name: string;
  handle: string;
  countryFlag: string;
  country: string;
  language: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  score: number;
  assistsGiven: number;
  assistsReceived: number;
  lastActive: string;
  statusMessage: string;
  npub: string;
}

const names = [
  'alice', 'bob', 'carlos', 'diana', 'elena',
  'felix', 'gabriel', 'hana', 'ismael', 'juna',
  'kaito', 'lina', 'marcus', 'nadia', 'oscar',
  'priya', 'quentin', 'rachel', 'santiago', 'tara',
  'umar', 'valentina', 'wei', 'ximena', 'yuki',
  'zara', 'aiden', 'blake', 'chloe', 'dante',
  'elsa', 'finn', 'greta', 'hugo', 'iris'
];

const countries = [
  { flag: '🇺🇸', name: 'US', lang: 'en' },
  { flag: '🇬🇧', name: 'GB', lang: 'en' },
  { flag: '🇩🇪', name: 'DE', lang: 'de' },
  { flag: '🇫🇷', name: 'FR', lang: 'fr' },
  { flag: '🇯🇵', name: 'JP', lang: 'ja' },
  { flag: '🇧🇷', name: 'BR', lang: 'pt' },
  { flag: '🇮🇳', name: 'IN', lang: 'hi' },
  { flag: '🇰🇷', name: 'KR', lang: 'ko' },
  { flag: '🇦🇺', name: 'AU', lang: 'en' },
  { flag: '🇨🇦', name: 'CA', lang: 'en' },
  { flag: '🇲🇽', name: 'MX', lang: 'es' },
  { flag: '🇦🇷', name: 'AR', lang: 'es' },
  { flag: '🇿🇦', name: 'ZA', lang: 'en' },
  { flag: '🇳🇬', name: 'NG', lang: 'en' },
  { flag: '🇰🇪', name: 'KE', lang: 'en' },
  { flag: '🇸🇪', name: 'SE', lang: 'sv' },
  { flag: '🇳🇱', name: 'NL', lang: 'nl' },
  { flag: '🇮🇹', name: 'IT', lang: 'it' },
  { flag: '🇵🇱', name: 'PL', lang: 'pl' },
  { flag: '🇹🇷', name: 'TR', lang: 'tr' },
  { flag: '🇻🇳', name: 'VN', lang: 'vi' },
  { flag: '🇹🇭', name: 'TH', lang: 'th' },
  { flag: '🇪🇬', name: 'EG', lang: 'ar' },
  { flag: '🇵🇭', name: 'PH', lang: 'tl' },
  { flag: '🇨🇱', name: 'CL', lang: 'es' },
  { flag: '🇨🇴', name: 'CO', lang: 'es' },
  { flag: '🇵🇹', name: 'PT', lang: 'pt' },
  { flag: '🇦🇹', name: 'AT', lang: 'de' },
  { flag: '🇨🇭', name: 'CH', lang: 'de' },
  { flag: '🇧🇪', name: 'BE', lang: 'fr' },
  { flag: '🇸🇬', name: 'SG', lang: 'en' },
  { flag: '🇳🇴', name: 'NO', lang: 'no' },
  { flag: '🇩🇰', name: 'DK', lang: 'da' },
  { flag: '🇫🇮', name: 'FI', lang: 'fi' },
  { flag: '🇮🇸', name: 'IS', lang: 'is' },
];

const statusMessages: Record<string, string[]> = {
  online: ['helping a peer', 'reviewing code', 'sharing resources', 'mentoring', 'available for chat', 'happy to help'],
  away: ['brb', 'in a meeting', 'coffee break', 'afk', 'focusing'],
  busy: ['deep work', 'in a call', 'pair programming', 'workshop', 'hacking'],
  offline: ['offline'],
};

const activities = [
  'answered question about nostr relays',
  'helped with key recovery',
  'shared a tutorial on NIP-01',
  'contributed to open source',
  'reported a bug fix',
  'created a help request',
  'reviewed a NIP proposal',
  'connected a new relay',
  'verified someone\'s identity',
  'shared nostr resources',
  'helped debug a client',
  'wrote documentation',
  'mentored a new user',
  'translated help content',
  'ran a nostr workshop',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateHandle(name: string): string {
  const suffixes = ['_nostr', '_btc', '_peer', '_helper', '', '_dev', '_crypto'];
  const nums = Math.random().toString(36).slice(2, 5);
  return `@${name}${pick(suffixes)}${Math.random() > 0.5 ? nums : ''}`;
}

function timeAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function createPeers(): SimPeer[] {
  const shuffledCountries = shuffle(countries);
  return names.map((name, i) => {
    const country = shuffledCountries[i % shuffledCountries.length];
    const statuses: SimPeer['status'][] = ['online', 'online', 'away', 'busy', 'offline'];
    const status = statuses[i % statuses.length];
    const score = Math.floor(Math.random() * 80) + 10;
    return {
      id: i,
      name,
      handle: generateHandle(name),
      countryFlag: country.flag,
      country: country.name,
      language: country.lang,
      status,
      score,
      assistsGiven: Math.floor(Math.random() * score / 3),
      assistsReceived: Math.floor(Math.random() * score / 5),
      lastActive: status === 'offline' ? timeAgo(60 + Math.floor(Math.random() * 1440)) : 'now',
      statusMessage: pick(statusMessages[status]),
      npub: `npub1${name}${Math.random().toString(36).slice(2, 8)}`,
    };
  });
}

let peers = createPeers();
let activityLog: { peerId: number; name: string; action: string; time: string }[] = [];

function tick() {
  const now = Date.now();

  peers = peers.map(peer => {
    const r = Math.random();

    if (r < 0.15) {
      const newStatus: SimPeer['status'] = peer.status === 'online' ? 'away'
        : peer.status === 'away' ? 'busy'
        : peer.status === 'busy' ? 'offline'
        : 'online';
      const wasOffline = peer.status === 'offline';
      return {
        ...peer,
        status: newStatus,
        lastActive: newStatus === 'online' || wasOffline ? 'now' : peer.lastActive,
        statusMessage: pick(statusMessages[newStatus]),
        score: newStatus === 'online' ? peer.score + Math.floor(Math.random() * 3) : peer.score,
      };
    }

    if (r < 0.08 && peer.status === 'online') {
      const action = pick(activities);
      activityLog.push({
        peerId: peer.id,
        name: peer.name,
        action,
        time: timeAgo(0),
      });
      if (activityLog.length > 50) activityLog = activityLog.slice(-50);
      return {
        ...peer,
        score: peer.score + 1,
        assistsGiven: peer.assistsGiven + 1,
        statusMessage: pick(statusMessages.online),
      };
    }

    return peer;
  });

  const onlineCount = peers.filter(p => p.status === 'online').length;
  const busyCount = peers.filter(p => p.status === 'busy').length;
  const awayCount = peers.filter(p => p.status === 'away').length;

  self.postMessage({
    type: 'peers_update',
    peers,
    onlineCount,
    busyCount,
    awayCount,
    totalCount: peers.length,
    activityLog: activityLog.slice(-10),
  });
}

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === 'start') {
    tick();
    setInterval(tick, 2000 + Math.random() * 1000);
  }
};
