<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { darkMode } from '$lib/stores/auth';
  import { lang } from '$lib/stores/i18n';
  import { translations } from '$lib/i18n/translations';
  import { peers, onlineCount, updatePeerStatus } from '$lib/stores/peers';

  let { children } = $props();

  let kbdOpen = $state(false);

  function toggleKbd() { kbdOpen = !kbdOpen; }
  function closeKbd() { kbdOpen = false; }

  function switchLang(l: string) {
    lang.set(l as keyof typeof translations);
    if (typeof window !== 'undefined') localStorage.setItem('help_lang', l);
  }

  onMount(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('help_lang') || navigator.language?.split('-')[0] || 'en';
    if (saved in translations) lang.set(saved as keyof typeof translations);

    if (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('help_dark')) {
      darkMode.set(true);
      document.documentElement.classList.add('dark');
    }

    darkMode.subscribe(v => {
      document.documentElement.classList.toggle('dark', v);
      localStorage.setItem('help_dark', String(v));
    });

    const int = setInterval(() => updatePeerStatus(), 8000);

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === '?' && !e.shiftKey && !e.metaKey && !e.ctrlKey) toggleKbd();
      if (e.key === 'Escape') closeKbd();
      if (e.shiftKey && e.key === 'D') { e.preventDefault(); darkMode.update(v => !v); }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        (document.querySelector('[data-search]') as HTMLInputElement)?.focus();
      }
    });

    return () => clearInterval(int);
  });
</script>

<a href="#main" class="skip-link">skip to main content</a>

<!-- KBD Overlay -->
<div id="kbd-overlay" tabindex="-1" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm {kbdOpen ? 'show' : ''}" style="opacity: {kbdOpen ? 1 : 0}; pointer-events: {kbdOpen ? 'auto' : 'none'}" role="dialog" aria-modal="true" aria-label="keyboard shortcuts" onclick={(e) => e.target === e.currentTarget && closeKbd()} onkeydown={(e) => e.key === 'Escape' && closeKbd()}>
  <div class="glass rounded-3xl p-6 max-w-sm mx-4 w-full dark:text-white">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-bold text-lg">keyboard shortcuts</h2>
      <button onclick={closeKbd} class="icon-btn" aria-label="close shortcuts"><span class="text-lg">✕</span></button>
    </div>
    <div class="space-y-3 text-sm">
      {#each [
        ['toggle dark mode', 'Shift + D'],
        ['show shortcuts', '?'],
        ['close overlay', 'Esc'],
        ['sign out', 'Shift + S'],
        ['focus search', '/'],
      ] as [label, kbd]}
        <div class="flex justify-between items-center">
          <span>{label}</span>
          <kbd class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-mono">{kbd}</kbd>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Header -->
<header class="sticky top-0 z-40 glass border-b border-white/20 dark:border-gray-700/30">
  <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2.5 no-underline">
      <div class="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">h</div>
      <span class="font-semibold text-gray-800 dark:text-white tracking-tight">help</span>
      <span class="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">&middot; nostr peer network</span>
    </a>
    <div class="flex items-center gap-2">
      <select onchange={(e) => switchLang((e.target as HTMLSelectElement).value)} class="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-500 dark:text-gray-400">
        <option value="en">🇬🇧 EN</option>
        <option value="es">🇪🇸 ES</option>
        <option value="fr">🇫🇷 FR</option>
        <option value="de">🇩🇪 DE</option>
        <option value="pt">🇧🇷 PT</option>
      </select>
      <button onclick={toggleKbd} class="icon-btn" title="keyboard shortcuts" aria-label="keyboard shortcuts">?</button>
      <button onclick={() => darkMode.update(v => !v)} class="icon-btn" aria-label="toggle dark mode">
        {#if $darkMode}☀️{:else}🌙{/if}
      </button>
    </div>
  </div>
</header>

<!-- Main -->
<main id="main" class="max-w-5xl mx-auto px-4 py-8">
  {@render children()}
</main>

<style>
  #kbd-overlay { transition: opacity 0.2s; }
</style>
