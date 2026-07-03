<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { darkMode } from '$lib/stores/auth';
  import { lang, t } from '$lib/stores/i18n';
  import { translations } from '$lib/i18n/translations';

  let { children } = $props();

  let kbdOpen = $state(false);
  let menuOpen = $state(false);

  function toggleKbd() { kbdOpen = !kbdOpen; }
  function closeKbd() { kbdOpen = false; menuOpen = false; }

  function switchLang(l: string) {
    lang.set(l as keyof typeof translations);
    if (browser) localStorage.setItem('help_lang', l);
  }

  function toggleDM() {
    darkMode.update(v => !v);
  }

  onMount(() => {
    if (!browser) return;

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

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === '?' && !e.shiftKey && !e.metaKey && !e.ctrlKey) toggleKbd();
      if (e.key === 'Escape') closeKbd();
      if (e.shiftKey && e.key === 'D') { e.preventDefault(); darkMode.update(v => !v); }
    });
  });
</script>

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-xl focus:text-sm focus:font-medium">{$t('keyboard')}</a>

<svelte:head>
  <meta name="theme-color" content="#22c55e" />
  <meta name="color-scheme" content="light dark" />
  <meta name="description" content="help — nostr peer network. find help. give help. decentralized." />
  <meta property="og:title" content="help — nostr peer network" />
  <meta property="og:description" content="find help. give help. decentralized." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2322c55e'/><text x='50' y='68' font-size='55' font-family='Inter,sans-serif' font-weight='700' fill='white' text-anchor='middle'>h</text></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<!-- KBD Overlay -->
<div
  role="dialog"
  aria-modal="true"
  aria-label="keyboard shortcuts"
  tabindex="-1"
  class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200"
  class:pointer-events-none={!kbdOpen}
  class:opacity-0={!kbdOpen}
  onclick={(e) => e.target === e.currentTarget && closeKbd()}
  onkeydown={(e) => e.key === 'Escape' && closeKbd()}
>
  <div class="glass rounded-3xl p-6 max-w-sm mx-4 w-full dark:text-white shadow-2xl">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-bold text-lg">{$t('keyboard')}</h2>
      <button onclick={closeKbd} class="icon-btn" aria-label={$t('close')}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="space-y-3 text-sm">
      {#each [
        [$t('toggle.dark'), '⇧ D'],
        [$t('show.shortcuts'), '?'],
        [$t('close'), 'Esc'],
      ] as [label, k]}
        <div class="flex justify-between items-center">
          <span class="text-gray-600 dark:text-gray-300">{label}</span>
          <kbd class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-mono text-gray-500 dark:text-gray-400">{k}</kbd>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Header -->
<header class="sticky top-0 z-40 glass border-b border-white/20 dark:border-gray-700/30">
  <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
    <a href="/" class="flex items-center gap-2.5 no-underline shrink-0">
      <div class="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">h</div>
      <span class="font-semibold text-gray-800 dark:text-white tracking-tight">{$t('app.title')}</span>
      <span class="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">· {$t('app.subtitle')}</span>
    </a>
    <div class="flex items-center gap-1.5">
      <select
        onchange={(e) => switchLang((e.target as HTMLSelectElement).value)}
        class="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-500 dark:text-gray-400 outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
        aria-label={$t('language')}
      >
        <option value="en" selected={$lang === 'en'}>🇬🇧 EN</option>
        <option value="es" selected={$lang === 'es'}>🇪🇸 ES</option>
        <option value="fr" selected={$lang === 'fr'}>🇫🇷 FR</option>
        <option value="de" selected={$lang === 'de'}>🇩🇪 DE</option>
        <option value="pt" selected={$lang === 'pt'}>🇧🇷 PT</option>
      </select>
      <button onclick={toggleKbd} class="icon-btn" title={$t('show.shortcuts')} aria-label={$t('show.shortcuts')}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <button onclick={toggleDM} class="icon-btn" title={$t('toggle.dark')} aria-label={$t('toggle.dark')}>
        {#if $darkMode}
          <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>
        {:else}
          <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/></svg>
        {/if}
      </button>
    </div>
  </div>
</header>

<!-- Main -->
<main id="main" class="min-h-[calc(100vh-3.5rem)]">
  {@render children()}
</main>
