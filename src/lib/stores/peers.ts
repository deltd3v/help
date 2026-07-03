import { writable, derived } from 'svelte/store';
import type { SimPeer } from '$lib/workers/peerSimulation';

export type { SimPeer };

export const peers = writable<SimPeer[]>([]);
export const onlineCount = writable<number>(0);
export const busyCount = writable<number>(0);
export const awayCount = writable<number>(0);
