<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import { darkMode, signedIn, profile, npubFull, npubShort, _pubkey, _privkey, type Profile } from '$lib/stores/auth';
  import { lang, t } from '$lib/stores/i18n';
  import { onlineCount, peers, busyCount, awayCount, type SimPeer } from '$lib/stores/peers';
  import * as NostrTools from 'nostr-tools';

  type AuthMode = 'register' | 'signin' | 'recover';
  type View = 'dashboard' | 'peers' | 'forum';

  let step = $state(1);
  let authMode = $state<AuthMode>('register');
  let formName = $state('');
  let formAbout = $state('');
  let formCountry = $state('');
  let formLanguage = $state('');
  let formAgree = $state(false);
  let formNsec = $state('');
  let formNpub = $state('');
  let formNsecInput = $state('');
  let formRecoverKey = $state('');
  let showPrivkey = $state(false);
  let showPrivkeyWarning = $state(false);
  let otp = $state(['', '', '', '', '', '']);
  let copied = $state(false);
  let view = $state<View>('dashboard');
  let peerSearch = $state('');

  let showNewPost = $state(false);
  let newPostTitle = $state('');
  let newPostBody = $state('');
  let forumFilter = $state('recent');
  let forumPosts = $state<Array<{title:string;author:string;body:string;time:string;replies:number;urgent:boolean}>>([
    { title: 'How to connect to custom relays?', author: 'alice', body: 'I am trying to connect to **my own relay** but keep getting connection errors. Has anyone set up a custom relay before?\n\n```\nwss://myrelay.example.com\n```\n\nAny tips?', time: '2h ago', replies: 3, urgent: false },
    { title: 'Lost my nsec — any recovery options?', author: 'bob', body: 'I know the answer is probably "no" since nostr is self-sovereign, but I wanted to ask anyway. Is there _any_ way to recover an account without the private key?', time: '5h ago', replies: 7, urgent: true },
    { title: 'Looking for devs to review my NIP proposal', author: 'carlos', body: 'I wrote a NIP for **community tagging**. Would love some feedback before submitting. The gist:\n\n- New kind `30050` for community definitions\n- Tags for moderators and rules\n\nThoughts?', time: '1d ago', replies: 12, urgent: false },
    { title: 'Best nostr clients for mobile?', author: 'diana', body: 'What are people using on iOS/Android these days? Looking for something with **good UX** and reliable relay management.', time: '3h ago', replies: 5, urgent: false },
    { title: 'Help with NIP-05 verification', author: 'elena', body: 'I am trying to get a NIP-05 identifier but running into DNS issues. Has anyone used a free provider?', time: '6h ago', replies: 2, urgent: false },
    ]);

  let chartCanvas: HTMLCanvasElement | undefined = $state();
  let chartInstance: any = null;
  let qrContainer: HTMLDivElement | undefined = $state();
  let cookieAccepted = $state(false);

  let workerRef: Worker | null = null;
  let activityLog = $state<Array<{name:string;action:string;time:string}>>([]);

  function generateKeys() {
    try {
      const sk = NostrTools.generateSecretKey();
      const pk = NostrTools.getPublicKey(sk);
      _privkey.set(sk as unknown as string);
      _pubkey.set(pk);
      formNsec = NostrTools.nip19.nsecEncode(sk);
      formNpub = NostrTools.nip19.npubEncode(pk);
      showPrivkeyWarning = true;
    } catch (e) { console.error('nostr error', e); }
  }

  function deriveNpub(pk: string) {
    try {
      const f = NostrTools.nip19.npubEncode(pk);
      npubFull.set(f);
      npubShort.set(f.slice(0, 12) + '...' + f.slice(-6));
    } catch { npubFull.set('...'); npubShort.set('...'); }
  }

  function completeRegistration() {
    if (!formAgree || !formName) return;
    profile.set({ name: formName, about: formAbout || '', country: formCountry || '', language: formLanguage || '', score: 0, pubkey: '' });
    step = 3;
  }

  function signInWithKey() {
    try {
      const nsec = formNsecInput.trim();
      const sk = nsec.startsWith('nsec1') ? NostrTools.nip19.decode(nsec).data : nsec;
      _privkey.set(sk as string);
      const pk = NostrTools.getPublicKey(sk as Uint8Array);
      _pubkey.set(pk);
      profile.set({ name: 'nostr user', about: '', country: '', language: '', score: 0, pubkey: pk });
      deriveNpub(pk);
      signedIn.set(true);
      step = 1;
      saveSession();
    } catch (e) { console.error('invalid key', e); }
  }

  function recoverAccount() { formNsecInput = formRecoverKey; signInWithKey(); }

  async function signInWithExtension() {
    if (!(window as any).nostr) { step = 4; return; }
    try {
      const pk = await (window as any).nostr.getPublicKey();
      _pubkey.set(pk); _privkey.set('');
      profile.set({ name: 'nostr user (extension)', about: '', country: '', language: '', score: 0, pubkey: pk });
      deriveNpub(pk); signedIn.set(true); step = 1; saveSession();
    } catch (e) { console.error('extension error', e); }
  }

  function socialSignIn() { (window as any).nostr ? signInWithExtension() : (step = 4); }

  function otpInput(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.value && index < 5) {
      const container = input.closest('.flex');
      if (container) { const inputs = container.querySelectorAll('input'); if (inputs[index + 1]) (inputs[index + 1] as HTMLInputElement).focus(); }
    }
  }

  function otpBack(index: number, e: Event) {
    if (!otp[index] && index > 0) {
      const input = e.target as HTMLInputElement;
      const container = input.closest('.flex');
      if (container) { const inputs = container.querySelectorAll('input'); if (inputs[index - 1]) (inputs[index - 1] as HTMLInputElement).focus(); }
    }
  }

  function verifyOtp() { if (otp.join('').length === 6) { signedIn.set(true); step = 1; saveSession(); } }

  function saveSession() {
    if (browser) {
      localStorage.setItem('help_nostr_session', JSON.stringify({
        privkey: get(_privkey), pubkey: get(_pubkey), profile: get(profile)
      }));
    }
  }

  function signOut() {
    signedIn.set(false); step = 1;
    _privkey.set(''); _pubkey.set('');
    profile.set({ name: '', about: '', country: '', language: '', score: 0, pubkey: '' });
    npubFull.set(''); npubShort.set('');
    if (browser) localStorage.removeItem('help_nostr_session');
    clearForm();
  }

  function clearForm() {
    formName = ''; formAbout = ''; formCountry = ''; formLanguage = '';
    formAgree = false; formNsec = ''; formNpub = '';
    formNsecInput = ''; formRecoverKey = '';
    otp = ['', '', '', '', '', '']; showPrivkey = false; showPrivkeyWarning = false;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch {}
  }

  function renderMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/### (.+)/g, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
      .replace(/## (.+)/g, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
      .replace(/# (.+)/g, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl overflow-x-auto text-xs my-2"><code>$2</code></pre>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/^- (.+)/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
      .replace(/\n\n/g, '</p><p class="my-1.5">')
      .replace(/^(?!(?:<[phu]|\s*$))/m, '<p class="my-1.5">');
  }

  function submitPost() {
    if (!newPostTitle.trim()) return;
    forumPosts = [{ title: newPostTitle, author: get(profile).name || 'anonymous', body: newPostBody || '_no details_', time: 'just now', replies: 0, urgent: false }, ...forumPosts];
    newPostTitle = ''; newPostBody = ''; showNewPost = false;
  }

  async function initChart() {
    if (!browser || !chartCanvas) return;
    try {
      const { default: Chart } = await import('chart.js');
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'help activities',
            data: [3, 7, 4, 9, 6, 12, 8],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.1)',
            fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af' } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, color: '#9ca3af' } }
          }
        }
      });
    } catch (e) { console.error('chart init error', e); }
  }

  async function initQR() {
    if (!browser || !qrContainer || !get(npubFull)) return;
    try {
      const qr = await import('qrcode');
      qrContainer.innerHTML = '';
      const canvas = document.createElement('canvas');
      qr.toCanvas(canvas, get(npubFull), { width: 120, margin: 1, color: { dark: '#22c55e', light: '#ffffff' } });
      qrContainer.appendChild(canvas);
    } catch (e) { console.error('qr init error', e); }
  }

  function startWorker() {
    if (!browser) return;
    try {
      workerRef = new Worker(new URL('$lib/workers/peerSimulation.ts', import.meta.url), { type: 'module' });
      workerRef.onmessage = (e: MessageEvent) => {
        const data = e.data;
        if (data.type === 'peers_update') {
          peers.set(data.peers);
          onlineCount.set(data.onlineCount);
          busyCount.set(data.busyCount);
          awayCount.set(data.awayCount);
          if (data.activityLog?.length) {
            activityLog = data.activityLog.map((a: any) => ({ name: a.name, action: a.action, time: a.time }));
          }
        }
      };
      workerRef.postMessage({ type: 'start' });
    } catch (e) {
      console.error('worker init error, falling back to main thread', e);
    }
  }

  onMount(() => {
    if (!browser) return;

    startWorker();

    const stored = localStorage.getItem('help_nostr_session');
    if (stored) {
      try {
        const d = JSON.parse(stored);
        _privkey.set(d.privkey); _pubkey.set(d.pubkey);
        profile.set(d.profile || { name: '', about: '', country: '', language: '', score: 0, pubkey: '' });
        signedIn.set(true);
        deriveNpub(d.pubkey);
      } catch { localStorage.removeItem('help_nostr_session'); }
    }

    if (localStorage.getItem('help_cookie')) {
      cookieAccepted = true;
    }

    return () => {
      workerRef?.terminate();
    };
  });

  $effect(() => {
    if ($signedIn && browser) {
      const id = setTimeout(() => { initChart(); initQR(); }, 200);
      return () => clearTimeout(id);
    }
  });
</script>

<!-- Cookie consent -->
{#if !cookieAccepted && browser}
  <div class="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-3 animate-slide-up">
    <div class="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
      <p class="text-xs text-gray-500 dark:text-gray-400">{$t('cookie.msg')}</p>
      <div class="flex gap-2">
        <button onclick={() => cookieAccepted = true} class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg transition-colors">{$t('decline')}</button>
        <button onclick={() => { cookieAccepted = true; localStorage.setItem('help_cookie','1'); }} class="text-xs bg-brand-500 text-white px-4 py-1.5 rounded-lg hover:bg-brand-600 transition-colors font-medium">{$t('accept')}</button>
      </div>
    </div>
  </div>
{/if}

<!-- AUTH FLOW -->
{#if !$signedIn}
  <div class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4" class:gradient-bg={!$darkMode}>
    <div class="w-full max-w-md animate-fade-in">
      <!-- Steps indicator -->
      <div class="flex items-center justify-center gap-2 mb-8">
        {#each Array(4) as _, i}
          <div class="flex items-center">
            <div class="step-indicator {i + 1 === step ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/30' : i + 1 < step ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}">{i + 1}</div>
            {#if i + 1 < 4}
              <div class="w-8 h-0.5 mx-1 rounded-full {i + 1 < step ? 'bg-brand-400' : 'bg-gray-200 dark:bg-gray-700'}"></div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Step 1: Choose method -->
      {#if step === 1}
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg shadow-brand-200 dark:shadow-brand-900/30">h</div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">{$t('welcome')}</h1>
          <p class="text-sm text-gray-400 mt-1">{$t('tagline')}</p>
        </div>
        <div class="space-y-2.5">
          {#each [
            { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: $t('create'), desc: $t('create.desc'), color: 'brand', action: () => { step = 2; authMode = 'register'; generateKeys(); } },
            { icon: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z', label: $t('signin'), desc: $t('signin.desc'), color: 'blue', action: () => { step = 2; authMode = 'signin'; } },
            { icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z', label: $t('recover'), desc: $t('recover.desc'), color: 'amber', action: () => { step = 2; authMode = 'recover'; } },
          ] as item}
            <button onclick={item.action} class="w-full glass-card p-4 text-left cursor-pointer">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-xl bg-{item.color}-100 dark:bg-{item.color}-900/20 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-{item.color}-600 dark:text-{item.color}-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon}/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-gray-800 dark:text-white">{item.label}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <svg class="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
          {/each}
          <div class="relative my-4">
            <div class="border-t border-gray-100 dark:border-gray-800"></div>
            <span class="absolute inset-0 flex items-center justify-center text-xs text-gray-400"><span class="bg-white dark:bg-gray-900 px-2">{$t('or')}</span></span>
          </div>
          <button onclick={socialSignIn} class="w-full glass-card p-4 text-left cursor-pointer">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
              </div>
              <div class="flex-1">
                <p class="font-semibold text-sm text-gray-800 dark:text-white">{$t('social')}</p>
                <p class="text-xs text-gray-400 mt-0.5">{$t('social.desc')}</p>
              </div>
              <svg class="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </div>
          </button>
        </div>
      {/if}

      <!-- Step 2: Register / Sign In / Recover -->
      {#if step === 2}
        {#if authMode === 'register'}
          <div class="glass-card rounded-3xl p-6 space-y-4 shadow-xl">
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800 dark:text-white">{$t('reg.title')}</h3>
                <p class="text-xs text-gray-400">{$t('reg.desc')}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-name">{$t('display.name')}</label>
                <input id="reg-name" type="text" bind:value={formName} placeholder="alice" class="input-field" maxlength="30" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-about">{$t('about')}</label>
                <textarea id="reg-about" bind:value={formAbout} placeholder="i'm here to help..." class="input-field" rows="2" maxlength="160"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-country">{$t('country')}</label>
                  <select id="reg-country" bind:value={formCountry} class="input-field">
                    <option value="">{$t('select')}</option>
                    <option value="US">🇺🇸 US</option><option value="GB">🇬🇧 GB</option><option value="DE">🇩🇪 DE</option><option value="FR">🇫🇷 FR</option><option value="JP">🇯🇵 JP</option>
                    <option value="BR">🇧🇷 BR</option><option value="IN">🇮🇳 IN</option><option value="NG">🇳🇬 NG</option><option value="KE">🇰🇪 KE</option><option value="AU">🇦🇺 AU</option>
                    <option value="CA">🇨🇦 CA</option><option value="MX">🇲🇽 MX</option><option value="AR">🇦🇷 AR</option><option value="ZA">🇿🇦 ZA</option><option value="KR">🇰🇷 KR</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-lang">{$t('lang')}</label>
                  <select id="reg-lang" bind:value={formLanguage} class="input-field">
                    <option value="">{$t('select')}</option>
                    <option value="en">🇬🇧 english</option><option value="es">🇪🇸 español</option><option value="fr">🇫🇷 français</option><option value="de">🇩🇪 deutsch</option>
                    <option value="pt">🇧🇷 português</option><option value="ja">🇯🇵 日本語</option><option value="hi">🇮🇳 हिन्दी</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
                  {$t('your.npub')}
                </span>
                <button onclick={() => copyToClipboard(formNpub)} class="text-xs text-brand-500 hover:text-brand-600 font-medium">{copied ? '✓' : '📋'}</button>
              </div>
              <p class="text-xs font-mono text-gray-500 dark:text-gray-400 break-all bg-white dark:bg-gray-900/50 rounded-lg p-2">{formNpub || 'generating...'}</p>
              {#if showPrivkeyWarning}
                <div class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                  <span>⚠️</span>
                  <span>{$t('backup.warning')} <button onclick={() => showPrivkey = !showPrivkey} class="underline font-medium">{showPrivkey ? $t('hide') : $t('show')}</button></span>
                </div>
                {#if showPrivkey}
                  <div class="text-xs font-mono text-gray-400 break-all bg-white dark:bg-gray-900/50 rounded-lg p-2 select-all">{formNsec}</div>
                {/if}
              {/if}
            </div>
            <div class="flex items-start gap-3">
              <input type="checkbox" bind:checked={formAgree} id="agree" class="mt-1 rounded accent-brand-500" />
              <label for="agree" class="text-xs text-gray-400 dark:text-gray-500">{$t('keys.responsibility')}</label>
            </div>
            <div class="flex gap-3 pt-1">
              <button onclick={() => { step = 1; clearForm(); }} class="btn-secondary text-sm flex-1">{$t('back')}</button>
              <button onclick={completeRegistration} disabled={!formAgree || !formName} class="btn-primary text-sm flex-1">✓ {$t('create')}</button>
            </div>
          </div>
        {:else if authMode === 'signin'}
          <div class="glass-card rounded-3xl p-6 space-y-4 shadow-xl">
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800 dark:text-white">{$t('signin')}</h3>
                <p class="text-xs text-gray-400">{$t('signin.desc')}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="signin-nsec">nsec</label>
                <input id="signin-nsec" type="password" bind:value={formNsecInput} placeholder="nsec1..." class="input-field font-mono text-xs" />
              </div>
              <button onclick={signInWithKey} disabled={!formNsecInput} class="btn-primary text-sm w-full">{$t('signin.with.key')}</button>
            </div>
            <div class="relative"><div class="border-t border-gray-100 dark:border-gray-800"></div><span class="absolute inset-0 flex items-center justify-center text-xs text-gray-400"><span class="bg-white dark:bg-gray-900 px-2">{$t('or')}</span></span></div>
            <button onclick={signInWithExtension} class="w-full glass-card p-4 text-left cursor-pointer">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918"/></svg>
                </div>
                <div><p class="font-semibold text-sm text-gray-800 dark:text-white">{$t('signin.with.extension')}</p><p class="text-xs text-gray-400">{$t('nip07.desc')}</p></div>
                <span class="ml-auto text-gray-300">→</span>
              </div>
            </button>
            <button onclick={() => { step = 1; clearForm(); }} class="btn-secondary text-sm w-full">{$t('back')}</button>
          </div>
        {:else}
          <div class="glass-card rounded-3xl p-6 space-y-4 shadow-xl">
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800 dark:text-white">{$t('recover')}</h3>
                <p class="text-xs text-gray-400">{$t('recover.desc')}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="recover-key">nsec</label>
                <input id="recover-key" type="password" bind:value={formRecoverKey} placeholder="nsec1..." class="input-field font-mono text-xs" />
              </div>
              <button onclick={recoverAccount} disabled={!formRecoverKey} class="btn-primary text-sm w-full">↻ {$t('recover')}</button>
            </div>
            <p class="text-center text-xs text-gray-400 py-2">{$t('recover.warning')}</p>
            <button onclick={() => { step = 1; clearForm(); }} class="btn-secondary text-sm w-full">{$t('back')}</button>
          </div>
        {/if}
      {/if}

      <!-- Step 3: OTP -->
      {#if step === 3}
        <div class="glass-card rounded-3xl p-6 space-y-5 text-center shadow-xl">
          <div class="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto">
            <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 dark:text-white">{$t('otp.title')}</h3>
            <p class="text-xs text-gray-400 mt-1">{$t('otp.desc')}</p>
          </div>
          <div class="flex justify-center gap-2" role="group" aria-label="one-time password">
            {#each Array(6) as _, i}
              <input type="text" inputmode="numeric" maxlength="1" bind:value={otp[i]} oninput={(e) => otpInput(i, e)} onkeydown={(e) => e.key === 'Backspace' && otpBack(i, e)}
                class="w-11 h-12 text-center text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800/80 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 outline-none transition-all {otp[i] ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : ''}" />
            {/each}
          </div>
          <div class="flex gap-3 pt-2">
            <button onclick={() => step = 2} class="btn-secondary text-sm flex-1">{$t('back')}</button>
            <button onclick={verifyOtp} disabled={otp.join('').length !== 6} class="btn-primary text-sm flex-1">✓ {$t('verify')}</button>
          </div>
          <p class="text-xs text-gray-400">{$t('otp.alt')} <button onclick={() => step = 4} class="text-brand-500 hover:text-brand-600 font-medium underline">{$t('otp.alt.action')}</button></p>
        </div>
      {/if}

      <!-- Step 4: Social / Extension -->
      {#if step === 4}
        <div class="glass-card rounded-3xl p-6 space-y-4 shadow-xl">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800 dark:text-white">{$t('social')}</h3>
              <p class="text-xs text-gray-400">{$t('nip07.desc')}</p>
            </div>
          </div>
          <div class="space-y-3">
            {#each [
              { icon: 'M13.19 2.323a2.25 2.25 0 013.619 0l5.248 6.674a2.25 2.25 0 01.846 1.983l-2.002 8.404a2.25 2.25 0 01-2.2 1.866H5.25a2.25 2.25 0 01-2.2-1.866L1.048 10.98a2.25 2.25 0 01.846-1.983L7.142 2.323z', name: 'Alby', desc: 'bitcoin & nostr lightning extension' },
              { icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342', name: 'nos2x', desc: 'nostr signer extension' },
            ] as ext}
              <button onclick={signInWithExtension} class="w-full glass-card p-4 text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={ext.icon}/></svg>
                  </div>
                  <div><p class="font-semibold text-sm text-gray-800 dark:text-white">{ext.name}</p><p class="text-xs text-gray-400">{ext.desc}</p></div>
                </div>
              </button>
            {/each}
          </div>
          <button onclick={() => step = 1} class="btn-secondary text-sm w-full">{$t('back')}</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- SIGNED IN VIEWS -->
{#if $signedIn}
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <!-- Tab bar -->
    <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 max-w-md mx-auto sm:mx-0">
      {#each [
        { id: 'dashboard' as View, icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', labelKey: 'dashboard' },
        { id: 'peers' as View, icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', labelKey: 'peers' },
        { id: 'forum' as View, icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155', labelKey: 'forum' },
      ] as tab}
        <button onclick={() => view = tab.id} class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
          class:bg-white={view === tab.id}
          class:dark:bg-gray-700={view === tab.id && $darkMode}
          class:text-brand-600={view === tab.id}
          class:dark:text-brand-400={view === tab.id && $darkMode}
          class:text-gray-500={view !== tab.id}
          class:dark:text-gray-400={view !== tab.id && $darkMode}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={tab.icon}/></svg>
          <span class="hidden sm:inline">{$t(tab.labelKey)}</span>
        </button>
      {/each}
    </div>

    <!-- Dashboard -->
    {#if view === 'dashboard'}
      <div class="grid gap-5 md:grid-cols-2">
        <!-- Profile card -->
        <div class="glass-card rounded-3xl p-6 md:col-span-2 text-center space-y-4 shadow-sm">
          <div class="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mx-auto ring-4 ring-brand-200">
            <span class="text-2xl font-bold text-brand-600 dark:text-brand-400">{$profile.name?.charAt(0).toUpperCase() || '?'}</span>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-white">{$profile.name || 'helper'}</h2>
            <p class="text-xs text-gray-400 font-mono mt-1">{$npubShort}</p>
          </div>
          <div class="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
              {$profile.country || '—'}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"/></svg>
              {$profile.language || '—'}
            </span>
            <span class="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>
              {$t('active.now')}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
              {$t('score')}: {$profile.score || '0'}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300">{$profile.about || $t('ready')}</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-3">
          <div class="glass-card rounded-2xl p-4 text-center shadow-sm">
            <p class="text-2xl font-bold text-brand-500">{$onlineCount}</p>
            <p class="text-xs text-gray-400">{$t('online')}</p>
          </div>
          <div class="glass-card rounded-2xl p-4 text-center shadow-sm">
            <p class="text-2xl font-bold text-amber-500">{3}</p>
            <p class="text-xs text-gray-400">{$t('helps.given')}</p>
          </div>
          <div class="glass-card rounded-2xl p-4 text-center shadow-sm">
            <p class="text-2xl font-bold text-blue-500">{7}</p>
            <p class="text-xs text-gray-400">{$t('helps.received')}</p>
          </div>
        </div>

        <!-- Chart -->
        <div class="glass-card rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300">{$t('activity')}</h3>
            <span class="text-xs text-gray-400">12 {$t('assists')}</span>
          </div>
          <canvas bind:this={chartCanvas} class="w-full h-28" aria-label="weekly activity chart"></canvas>
        </div>

        <!-- QR + npub -->
        <div class="glass-card rounded-3xl p-6 text-center space-y-3 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300">{$t('npub.key')}</h3>
          <div bind:this={qrContainer} class="flex justify-center"></div>
          <p class="text-xs text-gray-400 font-mono break-all select-all">{$npubFull}</p>
          <button onclick={() => copyToClipboard($npubFull)} class="text-xs text-brand-500 hover:text-brand-600 font-medium">
            {copied ? '✓' : '📋'} {$t(copied ? 'copied' : 'copy.npub')}
          </button>
        </div>

        <!-- Recent activity -->
        <div class="glass-card rounded-3xl p-6 md:col-span-2 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">{$t('activity.title')}</h3>
          {#if activityLog.length > 0}
            <div class="space-y-2 text-sm">
              {#each activityLog as act}
                <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span class="text-gray-600 dark:text-gray-300"><strong class="font-medium text-gray-800 dark:text-white">{act.name}</strong> {act.action}</span>
                  <span class="text-xs text-gray-400">{act.time}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-gray-400 text-center py-4">{$t('no.activity')}</p>
          {/if}
        </div>
      </div>

    <!-- Peers -->
    {:else if view === 'peers'}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{$t('peers')}</h2>
          <span class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            {$onlineCount}/{$peers.length} {$t('online')}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input type="text" bind:value={peerSearch} data-search placeholder={$t('search.peers')} class="input-field pl-10" />
          </div>
          <div class="flex gap-1">
            {#each ['all', 'online.only', 'offline.only'] as filter}
              <button onclick={() => peerSearch = filter === 'all' ? '' : filter === 'online.only' ? '__filter_online__' : '__filter_offline__'} class="text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium {peerSearch === (filter === 'all' ? '' : filter === 'online.only' ? '__filter_online__' : '__filter_offline__') ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}">{$t(filter)}</button>
            {/each}
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          {#each $peers.filter(p => {
            if (peerSearch === '__filter_online__') return p.status === 'online';
            if (peerSearch === '__filter_offline__') return p.status === 'offline';
            if (!peerSearch) return true;
            const q = peerSearch.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.countryFlag.includes(q) || p.language.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q);
          }) as peer}
            <div class="glass-card rounded-2xl p-4 flex items-center gap-4 hover:border-brand-200 dark:hover:border-brand-800 transition-all border border-transparent shadow-sm">
              <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">{peer.name.charAt(0).toUpperCase()}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-semibold text-sm text-gray-800 dark:text-white">{peer.name}</p>
                  <span class="text-xs">{peer.countryFlag}</span>
                  <span class="badge {peer.status === 'online' ? 'badge-online' : peer.status === 'busy' ? 'badge-busy' : peer.status === 'away' ? 'badge-away' : 'badge-offline'}">{$t(peer.status)}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span class="truncate max-w-[120px]">{peer.handle}</span>
                  <span>·</span>
                  <span>⭐ {peer.score}</span>
                  <span>·</span>
                  <span>{peer.statusMessage || ''}</span>
                </div>
              </div>
              <button class="btn-primary text-xs px-4 py-2 shrink-0">{$t('message')}</button>
            </div>
          {/each}
        </div>
        {#if $peers.filter(p => {
          if (peerSearch === '__filter_online__') return p.status === 'online';
          if (peerSearch === '__filter_offline__') return p.status === 'offline';
          if (!peerSearch) return true;
          const q = peerSearch.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.countryFlag.includes(q) || p.language.toLowerCase().includes(q);
        }).length === 0}
          <p class="text-center text-sm text-gray-400 py-8">{$t('no.peers')}</p>
        {/if}
      </div>

    <!-- Forum -->
    {:else if view === 'forum'}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{$t('forum')}</h2>
          <button onclick={() => showNewPost = !showNewPost} class="btn-primary text-sm flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            {$t('new.post')}
          </button>
        </div>

        {#if showNewPost}
          <div class="glass-card rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 class="font-semibold text-sm text-gray-700 dark:text-gray-200">{$t('create.post')}</h3>
            <label for="post-title" class="sr-only">{$t('post.title')}</label>
            <input id="post-title" type="text" bind:value={newPostTitle} placeholder={$t('post.title')} class="input-field" maxlength="100" />
            <label for="post-body" class="sr-only">{$t('post.body')}</label>
            <textarea id="post-body" bind:value={newPostBody} placeholder={$t('post.body')} class="input-field" rows="4" maxlength="2000"></textarea>
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12"/></svg>
              <span>{$t('markdown.hint')}</span>
            </div>
            <div class="flex gap-3 pt-1">
              <button onclick={() => showNewPost = false} class="btn-secondary text-sm flex-1">{$t('cancel')}</button>
              <button onclick={submitPost} disabled={!newPostTitle.trim()} class="btn-primary text-sm flex-1">{$t('post')}</button>
            </div>
          </div>
        {/if}

        <div class="flex gap-1 text-xs">
          {#each ['recent', 'top', 'unanswered'] as filter}
            <button onclick={() => forumFilter = filter} class="px-3 py-1.5 rounded-lg transition-colors font-medium {forumFilter === filter ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}">{$t(filter)}</button>
          {/each}
        </div>

        <div class="space-y-3">
          {#each forumPosts as post, i}
            <div class="glass-card rounded-2xl p-5 transition-all border border-transparent hover:border-brand-200 dark:hover:border-brand-800 shadow-sm">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">{post.author.charAt(0).toUpperCase()}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-sm text-gray-800 dark:text-white">{post.title}</span>
                    {#if post.urgent}
                      <span class="badge badge-away">{$t('urgent')}</span>
                    {/if}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{post.time}</span>
                    <span>·</span>
                    <span>💬 {post.replies} {$t('replies')}</span>
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-300 mt-2 prose">{@html renderMarkdown(post.body)}</div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Mobile bottom nav -->
  <div class="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-1 sm:hidden">
    <div class="flex justify-around">
      {#each [
        { id: 'dashboard' as View, icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', labelKey: 'dashboard' },
        { id: 'peers' as View, icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', labelKey: 'peers' },
        { id: 'forum' as View, icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155', labelKey: 'forum' },
      ] as tab}
        <button onclick={() => view = tab.id} class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors {view === tab.id ? 'text-brand-500' : 'text-gray-400'}"
          aria-label={$t(tab.labelKey)}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={tab.icon}/></svg>
          <span class="text-[10px]">{$t(tab.labelKey)}</span>
        </button>
      {/each}
      <button onclick={signOut} class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-gray-400" aria-label={$t('sign.out')}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
        <span class="text-[10px]">{$t('sign.out')}</span>
      </button>
    </div>
  </div>
{/if}

<!-- Footer -->
<p class="text-center text-xs text-gray-300 dark:text-gray-700 py-4 {view === 'forum' && $signedIn ? 'pb-20' : ''} {$signedIn ? '' : 'pb-6'}">
  {$t('powered.by')} · <a href="https://nostr.com" target="_blank" rel="noopener" class="underline hover:text-brand-400">{$t('learn.more')}</a>
</p>
