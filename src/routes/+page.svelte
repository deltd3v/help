<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { darkMode, signedIn, profile, npubFull, npubShort, _pubkey, _privkey } from '$lib/stores/auth';
  import { lang, t } from '$lib/stores/i18n';
  import { peers, onlineCount } from '$lib/stores/peers';
  import * as NostrTools from 'nostr-tools';
  import { get } from 'svelte/store';

  // Auth state
  let step = $state(1);
  const totalSteps = 4;
  let authMode = $state<'register' | 'signin' | 'recover'>('register');
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
  let view = $state<'dashboard' | 'peers' | 'forum'>('dashboard');
  let peerSearch = $state('');

  function generateKeys() {
    try {
      const sk = NostrTools.generateSecretKey();
      const pk = NostrTools.getPublicKey(sk);
      _privkey.set(sk);
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
      _privkey.set(sk);
      const pk = NostrTools.getPublicKey(sk);
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
    if (typeof window !== 'undefined') {
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
    if (typeof window !== 'undefined') localStorage.removeItem('help_nostr_session');
    clearForm();
  }

  function clearForm() {
    formName = ''; formAbout = ''; formCountry = ''; formLanguage = '';
    formAgree = false; formNsec = ''; formNpub = '';
    formNsecInput = ''; formRecoverKey = '';
    otp = ['', '', '', '', '', '']; showPrivkey = false; showPrivkeyWarning = false;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => { copied = true; setTimeout(() => copied = false, 2000); }).catch(() => {});
  }

  function renderMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/### (.+)/g, '<h3>$1</h3>')
      .replace(/## (.+)/g, '<h2>$1</h2>')
      .replace(/# (.+)/g, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!(?:<[phu]|\s*$))/m, '<p>');
  }

  // Forum
  let showNewPost = $state(false);
  let newPostTitle = $state('');
  let newPostBody = $state('');
  let forumFilter = $state('recent');
  let forumPosts = $state([
    { title: 'How to connect to custom relays?', author: 'alice', body: 'I am trying to connect to **my own relay** but keep getting connection errors. Has anyone set up a custom relay before?\n\n```\nwss://myrelay.example.com\n```\n\nAny tips?', time: '2h ago', replies: 3, urgent: false },
    { title: 'Lost my nsec \u2014 any recovery options?', author: 'bob', body: 'I know the answer is probably "no" since nostr is self-sovereign, but I wanted to ask anyway. Is there _any_ way to recover an account without the private key?', time: '5h ago', replies: 7, urgent: true },
    { title: 'Looking for devs to review my NIP proposal', author: 'carlos', body: 'I wrote a NIP for **community tagging**. Would love some feedback before submitting. The gist:\n\n- New kind `30050` for community definitions\n- Tags for moderators and rules\n\nThoughts?', time: '1d ago', replies: 12, urgent: false },
  ]);

  function submitPost() {
    if (!newPostTitle.trim()) return;
    forumPosts = [{ title: newPostTitle, author: $profile.name || 'anonymous', body: newPostBody || '_no details_', time: 'just now', replies: 0, urgent: false }, ...forumPosts];
    newPostTitle = ''; newPostBody = ''; showNewPost = false;
  }

  // Chart
  let chartCanvas: HTMLCanvasElement | undefined = $state();
  let chartInstance: any = null;

  async function initChart() {
    if (typeof window === 'undefined' || !chartCanvas) return;
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
  }

  // QR
  let qrContainer: HTMLDivElement | undefined = $state();

  async function initQR() {
    if (typeof window === 'undefined' || !qrContainer || !$npubFull) return;
    const qr = await import('qrcode');
    qrContainer.innerHTML = '';
    qr.toCanvas(qrContainer, $npubFull, { width: 120, margin: 1, color: { dark: '#22c55e', light: '#ffffff' } });
  }

  // Restore session on mount
  onMount(() => {
    if (typeof window === 'undefined') return;
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
  });

  // React to sign in for chart/qr init
  $effect(() => {
    if ($signedIn && browser) {
      setTimeout(() => { initChart(); initQR(); }, 100);
    }
  });
</script>

<!-- Cookie banner -->
{#if typeof window !== 'undefined' && !localStorage.getItem('help_cookie')}
  <div data-cookie class="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
      <p class="text-xs text-gray-500 dark:text-gray-400">we use essential cookies for auth. no tracking.</p>
      <div class="flex gap-2">
        <button onclick={() => { const el = document.querySelector('[data-cookie]'); if (el) el.remove(); }} class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg transition-colors">decline</button>
        <button onclick={() => { localStorage.setItem('help_cookie','1'); const el = document.querySelector('[data-cookie]'); if (el) el.remove(); }} class="text-xs bg-brand-500 text-white px-4 py-1.5 rounded-lg hover:bg-brand-600 transition-colors font-medium">accept</button>
      </div>
    </div>
  </div>
{/if}

<!-- AUTH FLOW -->
{#if !$signedIn}
  <div class="max-w-lg mx-auto" data-aos="fade-up">
    <!-- Steps -->
    <div class="flex items-center justify-center gap-2 mb-8">
      {#each Array(totalSteps) as _, i}
        <div class="flex items-center">
          <div class="step-indicator {i + 1 === step ? 'bg-brand-500 text-white shadow-lg' : i + 1 < step ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'}">{i + 1}</div>
          {#if i + 1 < totalSteps}
            <div class="w-8 h-0.5 mx-1 rounded {i + 1 < step ? 'bg-brand-400' : 'bg-gray-200 dark:bg-gray-700'}"></div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Step 1: Choose -->
    {#if step === 1}
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">welcome to help</h1>
        <p class="text-sm text-gray-400 mt-1">decentralized peer support on nostr</p>
      </div>
      <div class="grid gap-3">
        {#each [
          { icon: '👤', label: 'create account', desc: 'generate your nostr keys & join the network', color: 'brand', action: () => { step = 2; authMode = 'register'; generateKeys(); } },
          { icon: '🔑', label: 'sign in', desc: 'use existing nostr key or browser extension', color: 'blue', action: () => { step = 2; authMode = 'signin'; } },
          { icon: '🔐', label: 'recover account', desc: 'restore from private key or backup phrase', color: 'amber', action: () => { step = 2; authMode = 'recover'; } },
        ] as item}
          <button onclick={item.action} class="glass hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-2xl p-5 text-left transition-all duration-200 group border border-transparent hover:border-brand-200 dark:hover:border-brand-800">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-{item.color}-100 dark:bg-{item.color}-900/30 flex items-center justify-center text-{item.color}-600 dark:text-{item.color}-400 text-xl">{item.icon}</div>
              <div class="flex-1">
                <p class="font-semibold text-gray-800 dark:text-white">{item.label}</p>
                <p class="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span class="text-gray-300 dark:text-gray-600">→</span>
            </div>
          </button>
        {/each}
        <div class="relative my-2"><div class="border-t border-gray-100 dark:border-gray-800"></div><span class="absolute inset-0 flex items-center justify-center text-xs text-gray-400"><span class="bg-white dark:bg-gray-900 px-2">or</span></span></div>
        <button onclick={socialSignIn} class="glass hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl p-5 text-left transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 text-xl">🌐</div>
            <div class="flex-1"><p class="font-semibold text-gray-800 dark:text-white">social sign in</p><p class="text-xs text-gray-400 mt-0.5">connect with NIP-07 extension (Alby, nos2x, etc)</p></div>
            <span class="text-gray-300 dark:text-gray-600">→</span>
          </div>
        </button>
      </div>
    {/if}

    <!-- Step 2: Register / Sign In / Recover -->
    {#if step === 2}
      {#if authMode === 'register'}
        <div class="glass rounded-3xl p-6 space-y-4">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">👤</div>
            <div><h3 class="font-semibold text-gray-800 dark:text-white">create account</h3><p class="text-xs text-gray-400">your keys, your identity — generated locally</p></div>
          </div>
          <div class="space-y-3">
            <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-name">display name</label><input id="reg-name" type="text" bind:value={formName} placeholder="alice" class="input-field" maxlength="30" /></div>
            <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-about">about</label><textarea id="reg-about" bind:value={formAbout} placeholder="i'm here to help..." class="input-field" rows="2" maxlength="160"></textarea></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-country">country</label>
                <select id="reg-country" bind:value={formCountry} class="input-field">
                  <option value="">select</option>
                  <option value="US">🇺🇸 US</option><option value="GB">🇬🇧 GB</option><option value="DE">🇩🇪 DE</option><option value="FR">🇫🇷 FR</option><option value="JP">🇯🇵 JP</option>
                  <option value="BR">🇧🇷 BR</option><option value="IN">🇮🇳 IN</option><option value="NG">🇳🇬 NG</option><option value="KE">🇰🇪 KE</option><option value="AU">🇦🇺 AU</option>
                  <option value="CA">🇨🇦 CA</option><option value="MX">🇲🇽 MX</option><option value="AR">🇦🇷 AR</option><option value="ZA">🇿🇦 ZA</option><option value="KR">🇰🇷 KR</option>
                </select>
              </div>
              <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="reg-lang">language</label>
                <select id="reg-lang" bind:value={formLanguage} class="input-field">
                  <option value="">select</option><option value="en">🇬🇧 english</option><option value="es">🇪🇸 español</option><option value="fr">🇫🇷 français</option><option value="de">🇩🇪 deutsch</option>
                  <option value="ja">🇯🇵 日本語</option><option value="pt">🇧🇷 português</option><option value="hi">🇮🇳 हिन्दी</option><option value="ko">🇰🇷 한국어</option>
                  <option value="zh">🇨🇳 中文</option><option value="ar">🇸🇦 العربية</option><option value="ru">🇷🇺 русский</option>
                </select>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">🔑 your nostr public key</span>
              <button onclick={() => copyToClipboard(formNpub)} class="text-xs text-brand-500 hover:text-brand-600">{copied ? '✓ copied' : '📋 copy'}</button>
            </div>
            <p class="text-xs font-mono text-gray-500 dark:text-gray-400 break-all bg-white dark:bg-gray-900/50 rounded-lg p-2">{formNpub || 'generating...'}</p>
            {#if showPrivkeyWarning}
              <div class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                <span>⚠️ backup your private key! it's stored locally only. <button onclick={() => showPrivkey = !showPrivkey} class="underline font-medium">{showPrivkey ? 'hide' : 'show'}</button></span>
              </div>
              {#if showPrivkey}<div class="text-xs font-mono text-gray-400 break-all bg-white dark:bg-gray-900/50 rounded-lg p-2">{formNsec}</div>{/if}
            {/if}
          </div>
          <div class="flex items-start gap-3">
            <input type="checkbox" bind:checked={formAgree} id="agree" class="mt-1 rounded" />
            <label for="agree" class="text-xs text-gray-400 dark:text-gray-500">i understand that my keys are my responsibility. i have backed up my private key.</label>
          </div>
          <div class="flex gap-3 pt-1">
            <button onclick={() => { step = 1; clearForm(); }} class="btn-secondary text-sm flex-1">back</button>
            <button onclick={completeRegistration} disabled={!formAgree || !formName} class="btn-primary text-sm flex-1">✓ create account</button>
          </div>
        </div>
      {:else if authMode === 'signin'}
        <div class="glass rounded-3xl p-6 space-y-4">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">🔑</div>
            <div><h3 class="font-semibold text-gray-800 dark:text-white">sign in</h3><p class="text-xs text-gray-400">paste your nsec or use a browser extension</p></div>
          </div>
          <div class="space-y-3">
            <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="signin-nsec">private key (nsec)</label><input id="signin-nsec" type="password" bind:value={formNsecInput} placeholder="nsec1..." class="input-field font-mono text-xs" /></div>
            <button onclick={signInWithKey} disabled={!formNsecInput} class="btn-primary text-sm w-full">🔑 sign in with key</button>
          </div>
          <div class="relative"><div class="border-t border-gray-100 dark:border-gray-800"></div><span class="absolute inset-0 flex items-center justify-center text-xs text-gray-400"><span class="bg-white dark:bg-gray-900 px-2">or</span></span></div>
          <button onclick={signInWithExtension} class="w-full glass border border-purple-200 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl p-4 text-left transition-all group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 text-lg">🔌</div>
              <div><p class="font-semibold text-sm text-gray-800 dark:text-white">NIP-07 extension</p><p class="text-xs text-gray-400">connect with Alby, nos2x, or similar</p></div>
              <span class="ml-auto text-gray-300">→</span>
            </div>
          </button>
          <button onclick={() => { step = 1; clearForm(); }} class="btn-secondary text-sm w-full">back</button>
        </div>
      {:else}
        <div class="glass rounded-3xl p-6 space-y-4">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">🔐</div>
            <div><h3 class="font-semibold text-gray-800 dark:text-white">recover account</h3><p class="text-xs text-gray-400">restore with your private key</p></div>
          </div>
          <div class="space-y-3">
            <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block" for="recover-key">private key (nsec)</label><input id="recover-key" type="password" bind:value={formRecoverKey} placeholder="nsec1..." class="input-field font-mono text-xs" /></div>
            <button onclick={recoverAccount} disabled={!formRecoverKey} class="btn-primary text-sm w-full">↻ recover</button>
          </div>
          <div class="text-center text-xs text-gray-400 py-2">lost your key? without it, the account cannot be recovered — nostr is self-sovereign.</div>
          <button onclick={() => { step = 1; clearForm(); }} class="btn-secondary text-sm w-full">back</button>
        </div>
      {/if}
    {/if}

    <!-- Step 3: OTP -->
    {#if step === 3}
      <div class="glass rounded-3xl p-6 space-y-5 text-center">
        <div class="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto text-2xl text-brand-600">🛡️</div>
        <div><h3 class="font-semibold text-gray-800 dark:text-white">verify your identity</h3><p class="text-xs text-gray-400 mt-1">enter the 6-digit code sent to your extension</p></div>
        <div class="flex justify-center gap-2" role="group" aria-label="one-time password">
          {#each Array(6) as _, i}
            <input type="text" inputmode="numeric" maxlength="1" bind:value={otp[i]} oninput={(e) => otpInput(i, e)} onkeydown={(e) => e.key === 'Backspace' && otpBack(i, e)}
              class="w-11 h-12 text-center text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800/80 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 outline-none transition-all {otp[i] ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : ''}" />
          {/each}
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick={() => step = 2} class="btn-secondary text-sm flex-1">back</button>
          <button onclick={verifyOtp} disabled={otp.join('').length !== 6} class="btn-primary text-sm flex-1">✓ verify</button>
        </div>
        <p class="text-xs text-gray-400">didn't receive a code? <button onclick={() => step = 4} class="text-brand-500 hover:text-brand-600 font-medium underline">try alternative</button></p>
      </div>
    {/if}

    <!-- Step 4: Social -->
    {#if step === 4}
      <div class="glass rounded-3xl p-6 space-y-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">🌐</div>
          <div><h3 class="font-semibold text-gray-800 dark:text-white">social sign in</h3><p class="text-xs text-gray-400">connect with a nostr browser extension</p></div>
        </div>
        <div class="space-y-3">
          {#each [
            { icon: '⚡', name: 'Alby', desc: 'bitcoin & nostr lightning extension' },
            { icon: 'n', name: 'nos2x', desc: 'nostr signer extension' },
            { icon: '🔍', name: 'other NIP-07', desc: 'any compliant nostr signer' },
          ] as ext}
            <button onclick={signInWithExtension} class="w-full glass hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl p-4 text-left transition-all border border-purple-100 dark:border-purple-900/30">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 text-lg">{ext.icon}</div>
                <div><p class="font-semibold text-sm text-gray-800 dark:text-white">{ext.name}</p><p class="text-xs text-gray-400">{ext.desc}</p></div>
              </div>
            </button>
          {/each}
        </div>
        <button onclick={() => step = 1} class="btn-secondary text-sm w-full">back to start</button>
      </div>
    {/if}
  </div>
{/if}

<!-- SIGNED IN VIEWS -->
{#if $signedIn}
  <!-- Dashboard -->
  {#if view === 'dashboard'}
    <div class="space-y-5">
      <div class="mb-6 glass rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300">📊 activity this week</h3>
          <span class="text-xs text-gray-400">12 assists</span>
        </div>
        <canvas bind:this={chartCanvas} class="w-full h-28" aria-label="weekly activity chart"></canvas>
      </div>

      <div class="glass rounded-3xl p-8 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mx-auto ring-4 ring-brand-200 text-2xl text-brand-600">👤</div>
        <div><h2 class="text-xl font-bold">{$profile.name || 'helper'}</h2><p class="text-xs text-gray-400 font-mono mt-1">{$npubShort}</p></div>
        <div class="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span>🏳️ {$profile.country || '—'}</span>
          <span>🗣️ {$profile.language || '—'}</span>
          <span>🟢 active now</span>
          <span>⭐ score: {$profile.score || '0'}</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300">{$profile.about || 'ready to help'}</p>
        <div class="flex gap-3 justify-center pt-2 flex-wrap">
          <button onclick={() => view = 'forum'} class="btn-primary text-sm">💬 browse help requests</button>
          <button onclick={() => view = 'peers'} class="btn-secondary text-sm">👥 find peers</button>
        </div>
      </div>

      <div class="glass rounded-3xl p-6 text-center space-y-3">
        <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300">your nostr public key</h3>
        <div bind:this={qrContainer} class="flex justify-center"></div>
        <p class="text-xs text-gray-400 font-mono break-all">{$npubFull}</p>
        <button onclick={() => copyToClipboard($npubFull)} class="text-xs text-brand-500 hover:text-brand-600 font-medium">{copied ? '✓ copied!' : '📋 copy npub'}</button>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="glass rounded-2xl p-4 text-center"><p class="text-2xl font-bold text-brand-500">3</p><p class="text-xs text-gray-400">helps given</p></div>
        <div class="glass rounded-2xl p-4 text-center"><p class="text-2xl font-bold text-brand-500">7</p><p class="text-xs text-gray-400">helps received</p></div>
        <div class="glass rounded-2xl p-4 text-center"><p class="text-2xl font-bold text-brand-500">12</p><p class="text-xs text-gray-400">connections</p></div>
      </div>

      <div class="glass rounded-3xl p-6">
        <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">🕐 recent activity</h3>
        <div class="space-y-2 text-sm">
          {#each [
            { text: 'answered question about nostr relays', time: '2h ago' },
            { text: 'helped @bob with key recovery', time: '1d ago' },
            { text: 'posted a help request in #dev', time: '3d ago' },
          ] as act}
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span class="text-gray-600 dark:text-gray-300">{act.text}</span>
              <span class="text-xs text-gray-400">{act.time}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>

  <!-- Peers -->
  {:else if view === 'peers'}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold">👥 active peers</h2>
        <span class="text-xs text-gray-400">{$onlineCount} online</span>
      </div>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input type="text" bind:value={peerSearch} data-search placeholder="search by name, country, or language..." class="input-field pl-10" />
      </div>
      <div class="grid gap-3">
        {#each $peers as peer}
          <div class="glass rounded-2xl p-4 flex items-center gap-4 hover:border-brand-200 dark:hover:border-brand-800 transition-all border border-transparent">
            <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">{peer.name.charAt(0).toUpperCase()}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-semibold text-sm text-gray-800 dark:text-white">{peer.name}</p>
                <span class="text-xs">{peer.countryFlag}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full {peer.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : peer.status === 'away' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}">{peer.status}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span>🗣️ {peer.language}</span><span>⭐ {peer.score}</span><span>🕐 {peer.lastActive}</span>
              </div>
            </div>
            <button class="btn-primary text-xs px-4 py-2 shrink-0">💬 message</button>
          </div>
        {/each}
      </div>
      {#if $peers.length === 0}<p class="text-center text-sm text-gray-400 py-8">no peers match your search</p>{/if}
    </div>

  <!-- Forum -->
  {:else if view === 'forum'}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold">💬 help forum</h2>
        <button onclick={() => showNewPost = !showNewPost} class="btn-primary text-sm">+ new post</button>
      </div>

      {#if showNewPost}
        <div class="glass rounded-3xl p-6 space-y-3">
          <h3 class="font-semibold text-sm text-gray-700 dark:text-gray-200">create help request</h3>
          <label for="post-title" class="sr-only">post title</label>
          <input id="post-title" type="text" bind:value={newPostTitle} placeholder="title" class="input-field" maxlength="100" />
          <label for="post-body" class="sr-only">post body</label>
          <textarea id="post-body" bind:value={newPostBody} placeholder="describe what you need help with (markdown supported)..." class="input-field" rows="4" maxlength="2000"></textarea>
          <div class="flex items-center gap-2 text-xs text-gray-400"><span>📝</span><span>markdown formatting supported</span></div>
          <div class="flex gap-3 pt-1">
            <button onclick={() => showNewPost = false} class="btn-secondary text-sm flex-1">cancel</button>
            <button onclick={submitPost} disabled={!newPostTitle.trim()} class="btn-primary text-sm flex-1">📤 post</button>
          </div>
        </div>
      {/if}

      <div class="flex gap-1 text-xs">
        {#each ['recent', 'top', 'unanswered'] as filter}
          <button onclick={() => forumFilter = filter} class="px-3 py-1.5 rounded-lg transition-colors font-medium {forumFilter === filter ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}">{filter}</button>
        {/each}
      </div>

      <div class="space-y-3">
        {#each forumPosts as post, i}
          <div class="glass rounded-2xl p-5 transition-all border border-transparent hover:border-brand-200 dark:hover:border-brand-800">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">{post.author.charAt(0).toUpperCase()}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-sm text-gray-800 dark:text-white">{post.title}</span>
                  {#if post.urgent}<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">urgent</span>{/if}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{post.author}</span><span>·</span><span>{post.time}</span><span>·</span><span>💬 {post.replies} replies</span>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300 mt-2 prose">{@html renderMarkdown(post.body)}</div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Nav tabs for signed in -->
  <div class="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-2 sm:hidden">
    <div class="flex justify-around">
      {#each [
        { id: 'dashboard', icon: '📊', label: 'Home' },
        { id: 'peers', icon: '👥', label: 'Peers' },
        { id: 'forum', icon: '💬', label: 'Forum' },
      ] as tab}
        <button onclick={() => view = tab.id} class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors {view === tab.id ? 'text-brand-500' : 'text-gray-400'}">
          <span class="text-lg">{tab.icon}</span>
          <span class="text-[10px]">{tab.label}</span>
        </button>
      {/each}
      <button onclick={signOut} class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-gray-400">
        <span class="text-lg">🚪</span>
        <span class="text-[10px]">Exit</span>
      </button>
    </div>
  </div>
{/if}

<!-- Footer -->
<p class="text-center text-xs text-gray-300 dark:text-gray-700 mt-10 {view === 'forum' && $signedIn ? 'mb-20' : ''}">
  powered by nostr · keys stored locally · <a href="https://nostr.com" target="_blank" rel="noopener" class="underline hover:text-brand-400">learn more</a>
</p>
