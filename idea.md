# help

Nostr powered embeddable html solution
we all need help, what if u could see a list of peers active or inactive in your area, by country flag + language and their helper score, when they were active last, you can leave a message.. 
we are not building a backend powered by opensource and third-party solutions for auth/db/queues/*
we are using nostr clients to create a client and we assign it a handle that the user picks but behind the scenes its using the big platforms for free to make sure they get the help they need, there's also a page where people leave a reddit like post asking for help and has an openforum (visible only to their selected choice, locations or even world wide)

i dont have funds, i am solo so i cant afford any thing in this project i would like some donations for support

## Brand Identity — "help"

### Logo
- Mark: Lowercase "h" in a rounded square, green fill, white sans-serif
- Wordmark: "help" in Inter Semi-Bold, tracking-tight, no descender drama
- Lockup: Mark + "help" + "· nostr peer network" in gray

### Color Palette
```
Primary Green   #22c55e  — action, growth, trust
Green Light     #dcfce7  — backgrounds, glows
Green Dark      #15803d  — hover, emphasis
Warm Amber      #f59e0b  — warnings, keys, recovery
Cool Blue       #3b82f6  — sign in, info
Soft Purple     #a855f7  — NIP-07, extensions, social
Neutral 50-900  Tailwind gray scale
```

### Typography
- UI: Inter (300/400/500/600/700) — clean, readable, modern
- Code/Keys: JetBrains Mono (400/500) — npub/nsec display
- Scale: 11px (micro) → 12/14/16/18/20/24px

### Spacing
- 4px base unit (Tailwind default)
- Cards: p-6, rounded-3xl
- Sections: py-12, gap-3
- Glass: backdrop-blur(12px), rgba white/black at 0.7/0.3

### Voice & Tone
- Friendly but not childish: "find help. give help."
- Direct, minimal, humble: "we all need help"
- Decentralized ethos: "your keys, your identity"
- Global: country flags, language picker

### Design Principles
1. Rounded & soft — everything rounded-xl or rounded-3xl
2. Light & airy — glassmorphism, generous whitespace
3. Motion with purpose — GSAP entrances, AOS scroll, smooth transitions
4. Dark mode first-class — all components have dark variants
5. No backend — pure CDN, static HTML, localStorage persistence
6. Keyboard accessible — focus rings, tab order, aria labels

### Component Design Tokens
```
.glass         → backdrop-filter blur, semi-transparent bg, subtle border
.btn-primary   → bg-brand-500, white text, rounded-xl, hover brand-600
.btn-secondary → bg-gray-100, gray text, rounded-xl, hover gray-200
.input-field   → white bg, rounded-xl, border gray-200, focus brand ring
.step-indicator→ 40px circle, numbered, brand-500 active, gray-100 inactive
```

## Log

### 02.07.2026 - create index.html with nostr-powered multi-step auth form (register, sign in, recovery, otp, social sign in via NIP-07)
### 03.07.2026 - comprehensive CDN resource catalog for HTMX files
### 04.07.2026 - brand identity system + full index.html rewrite with all CDN resources, glassmorphism design, cookie consent, shepherd tour, gsap animations, chart.js, i18n, qr codes, markdown, pwa manifest, keyboard shortcuts, accessability

## CDN Resource Catalog for HTMX Projects (2026)

All resources loaded from CDN — no build step, no bundler, no backend necessary.

### Core Libraries

| Library | CDN URL | Purpose |
|---------|---------|---------|
| **HTMX 2.x** | `https://cdn.jsdelivr.net/npm/htmx.org@2/dist/htmx.min.js` | AJAX, SSE, WS, dynamic HTML swaps |
| **Alpine.js 3.x** | `https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js` | Reactive client-side state, UI logic |
| **hyperscript** | `https://unpkg.com/hyperscript.org@0.9` | Event-driven scripting, pairs with HTMX |
| **Tailwind CSS** | `https://cdn.tailwindcss.com` | Utility-first CSS |
| **Nostr Tools** | `https://unpkg.com/nostr-tools@2/lib/nostr.bundle.min.js` | Nostr key generation, NIP-19, events |

### HTMX Extensions (cdnjs)

| Extension | CDN URL | Use Case |
|-----------|---------|----------|
| **alpine-morph** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/alpine-morph.min.js` | Morph Alpine state during HTMX swaps |
| **response-targets** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/response-targets.min.js` | Target elements by HTTP response code |
| **class-tools** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/class-tools.min.js` | Add/remove/toggle classes on timers |
| **preload** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/preload.min.js` | Preload content on hover/mousedown |
| **multi-swap** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/multi-swap.min.js` | Swap multiple targets in one response |
| **loading-states** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/loading-states.min.js` | Automatic loading indicators |
| **remove-me** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/remove-me.min.js` | Remove elements after a delay |
| **idiomorph** | `https://cdn.jsdelivr.net/npm/idiomorph/dist/idiomorph.min.js` | Morph DOM algorithm (HTMX 2.x default) |
| **client-side-templates** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/client-side-templates.min.js` | Mustache/HBS/JSON templates client-side |
| **ws** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/ws.min.js` | WebSocket support |
| **sse** | `https://cdnjs.cloudflare.com/ajax/libs/htmx/2.0.7/ext/sse.min.js` | Server-Sent Events support |

### Alpine.js Plugins

| Plugin | CDN URL | Use Case |
|--------|---------|----------|
| **@alpinejs/persist** | `https://cdn.jsdelivr.net/npm/@alpinejs/persist@3/dist/cdn.min.js` | Persist state to localStorage |
| **@alpinejs/collapse** | `https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3/dist/cdn.min.js` | Smooth expand/collapse animations |
| **@alpinejs/intersect** | `https://cdn.jsdelivr.net/npm/@alpinejs/intersect@3/dist/cdn.min.js` | Intersection Observer for scroll triggers |
| **@alpinejs/focus** | `https://cdn.jsdelivr.net/npm/@alpinejs/focus@3/dist/cdn.min.js` | Focus trapping for modals |
| **@alpinejs/morph** | `https://cdn.jsdelivr.net/npm/@alpinejs/morph@3/dist/cdn.min.js` | DOM morphing |

### Icons

| Library | CDN URL | Style |
|---------|---------|-------|
| **Font Awesome 6** | `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css` | Solid, Regular, Brands |
| **Phosphor Icons** | `https://cdnjs.cloudflare.com/ajax/libs/phosphor-icons/1.4.2/phosphor.min.css` | Bold, Duotone, Fill, Light, Regular, Thin |
| **Lucide** | `https://unpkg.com/lucide-static@latest/font/lucide.css` | Clean open-source icons |
| **Bootstrap Icons** | `https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.min.css` | 1900+ Bootstrap-aligned icons |
| **Heroicons** | `https://unpkg.com/heroicons@2/css/heroicons.css` | Tailwind-friendly outline/solid |
| **Tabler Icons** | `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css` | 5000+ SVG-based icons |
| **Remix Icon** | `https://cdn.jsdelivr.net/npm/remixicon@4/fonts/remixicon.css` | System/design icons |
| **Material Symbols** | `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined` | Google Material variable icons |
| **Feather Icons** | `https://cdn.jsdelivr.net/npm/feather-icons@4/dist/feather.min.js` | Simply beautiful open source (JS injection) |

### Fonts (Google Fonts CDN)

| Font | CDN URL | Best For |
|------|---------|----------|
| **Inter** | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700` | Default UI, Tailwind default |
| **JetBrains Mono** | `https://fonts.googleapis.com/css2?family=JetBrains+Mono` | Code/terminal blocks |
| **DM Sans** | `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700` | Clean modern UI |
| **Outfit** | `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600` | Display headings |
| **Space Grotesk** | `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700` | Tech-forward branding |
| **Geist** | `https://cdn.jsdelivr.net/npm/geist-font@1/dist/font/css/geist.min.css` | Vercel's new system font |
| **Fontsource (all)** | `https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5` | Variable fonts via jsDelivr |

### Animations & Motion

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **GSAP** | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12/gsap.min.js` | Professional JS animation timeline |
| **GSAP ScrollTrigger** | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12/ScrollTrigger.min.js` | Scroll-based animations |
| **GSAP SplitText** | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12/SplitText.min.js` | Character/word text animations |
| **Animate.css** | `https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1/animate.min.css` | CSS keyframe utility classes |
| **Motion** | `https://cdn.jsdelivr.net/npm/motion@11/dist/motion.js` | Framer Motion's standalone JS lib |
| **AOS** | `https://unpkg.com/aos@2/dist/aos.js` + `aos.css` | Animate on scroll (zero JS config) |
| **Lottie Web** | `https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12/lottie.min.js` | After Effects animation playback |
| **Hover.css** | `https://cdnjs.cloudflare.com/ajax/libs/hover.css/2.3/css/hover-min.css` | Hover effect CSS collection |
| **Magic Animations** | `https://cdnjs.cloudflare.com/ajax/libs/magic/1.1/magic.min.css` | CSS3 animation pack |
| **Textillate** | `https://cdnjs.cloudflare.com/ajax/libs/textillate/0.4/jquery.textillate.min.js` | Text animation (depends on animate.css) |
| **Rive** | `https://cdn.jsdelivr.net/npm/@rive-app/canvas@2` | Real-time interactive animations |

### Toast Notifications

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Toastify** | `https://cdn.jsdelivr.net/npm/toastify-js@1` | Zero-dep toast, lightweight |
| **Notyf** | `https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js` + `.css` | Minimalist toast with icons |
| **Cute Alert** | `https://cdn.jsdelivr.net/npm/cute-alert@1` | Alert/confirm/toast in one |
| **Simple Notify** | `https://cdn.jsdelivr.net/npm/simple-notify@1/dist/simple-notify.min.js` + `.css` | Customizable toast + HTML content |
| **iziToast** | `https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4/iziToast.min.js` + `.css` | Rich feature toast (progress, buttons) |
| **Sweetalert2** | `https://cdn.jsdelivr.net/npm/sweetalert2@11` | Modal + toast hybrid |
| **Noty** | `https://cdnjs.cloudflare.com/ajax/libs/noty/3.2/noty.min.js` + `.css` | Mature, feature-rich notifications |
| **Sonner** | `https://cdn.jsdelivr.net/npm/sonner@1/dist/index.js` + `.css` | Modern toast (formerly `sonner`) |

### i18n (Internationalization)

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **i18next** | `https://cdn.jsdelivr.net/npm/i18next@23/dist/umd/i18next.min.js` | Full-featured i18n framework |
| **i18next-xhr-backend** | `https://cdn.jsdelivr.net/npm/i18next-xhr-backend@3` | Load translation JSON via XHR |
| **Lingui** | `https://cdn.jsdelivr.net/npm/@lingui/core@4` | Minimal i18n, React-friendly |
| **Polyglot** | `https://cdn.jsdelivr.net/npm/node-polyglot@2/dist/polyglot.min.js` | Airbnb's tiny i18n library |
| **Globalize** | `https://cdnjs.cloudflare.com/ajax/libs/globalize/1.7/globalize.min.js` | CLDR-powered i18n (date, number, currency) |

### Sanitization

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **DOMPurify** | `https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4/purify.min.js` | XSS sanitization (best-in-class) |
| **sanitize-html** | `https://cdnjs.cloudflare.com/ajax/libs/sanitize-html/2.17/sanitize-html.min.js` | Server-style HTML filtering |

### Cookie Consent

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Cookie Consent (Neiki)** | `https://cdn.jsdelivr.net/npm/neiki-cookie-banner@1/dist/neiki-cookie-banner.min.js` + `.css` | GDPR modal/bar/box, multi-language |
| **Cookie Consent (Osano)** | `https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js` + `.css` | Classic GDPR consent (Osano) |
| **CookieConsent (Vanilla)** | `https://cdn.jsdelivr.net/npm/vanilla-cookieconsent@3/dist/cookieconsent.umd.js` + `.css` | Vanilla JS, highly customizable |
| **Klaro** | `https://cdn.jsdelivr.net/npm/klaro@0.7/dist/klaro.js` + `.css` | Privacy-first consent manager |

### Onboarding / User Tours

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Shepherd.js** | `https://cdn.jsdelivr.net/npm/shepherd.js@13/dist/js/shepherd.min.js` + `dist/css/shepherd.css` | Full step-by-step onboarding tours |
| **Driver.js** | `https://cdn.jsdelivr.net/npm/driver.js@1/dist/driver.min.js` + `.css` | Lightweight spotlight/highlight |
| **Intro.js** | `https://cdn.jsdelivr.net/npm/intro.js@7/minified/intro.min.js` + `minified/introjs.min.css` | Feature introduction walkthroughs |

### Forms & Validation

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Just Validate** | `https://cdn.jsdelivr.net/npm/just-validate@4/dist/just-validate.min.js` | Lightweight form validation |
| **validator.js** | `https://cdnjs.cloudflare.com/ajax/libs/validator/13.12/validator.min.js` | String validation + sanitization |
| **Cleave.js** | `https://cdnjs.cloudflare.com/ajax/libs/cleave.js/1.6/cleave.min.js` | Input formatting (phone, CC, date) |
| **IMask** | `https://cdn.jsdelivr.net/npm/imask@7/dist/imask.min.js` | Advanced input masking |
| **AutoNumeric** | `https://cdn.jsdelivr.net/npm/autonumeric@4/dist/autoNumeric.min.js` | Currency/number formatting |

### Charts & Data Viz

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Chart.js** | `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` | Simple canvas charts |
| **ApexCharts** | `https://cdn.jsdelivr.net/npm/apexcharts@4/dist/apexcharts.min.js` | Rich interactive charts |
| **Frappe Charts** | `https://cdn.jsdelivr.net/npm/frappe-charts@1/dist/frappe-charts.min.esm.js` | GitHub-style SVG charts |

### Color & Theme

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Coloris** | `https://cdn.jsdelivr.net/npm/@melloware/coloris@2/dist/coloris.min.js` + `.css` | Accessible color picker |
| **Pigment** | `https://cdn.jsdelivr.net/npm/@ colorpk/pigment@1/dist/pigment.min.js` | Theme color extraction |

### Markdown / Rich Text

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Marked** | `https://cdn.jsdelivr.net/npm/marked@15/lib/marked.umd.min.js` | Fast Markdown → HTML |
| **DOMPurify + Marked** | Combined | Safe user-rendered Markdown |
| **Quill** | `https://cdn.jsdelivr.net/npm/quill@2/dist/quill.min.js` + `quill.snow.css` | Rich text editor |
| **TinyMCE** | `https://cdn.jsdelivr.net/npm/tinymce@7/tinymce.min.js` | Full WYSIWYG editor |

### Utility Libraries

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Mitt** | `https://cdn.jsdelivr.net/npm/mitt@3/dist/mitt.umd.min.js` | Tiny event emitter (~200b) |
| **Nanoid** | `https://cdn.jsdelivr.net/npm/nanoid@5/umd/index.browser.min.js` | Unique ID generation |
| **Day.js** | `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js` | Lightweight date manipulation |
| **date-fns** | `https://cdn.jsdelivr.net/npm/date-fns@4/cdn/date_fns.min.js` | Date utility functions |
| **Lodash** | `https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17/lodash.min.js` | General JS utility belt |
| **imask** | `https://cdn.jsdelivr.net/npm/imask@7/dist/imask.min.js` | Input mask |
| **Sortable** | `https://cdn.jsdelivr.net/npm/sortablejs@1/Sortable.min.js` | Drag-and-drop sorting |
| **Alpine Sortable** | `src="https://cdn.jsdelivr.net/npm/@khalyomede/alpinejs-sortable@0/dist/sortable.min.js"` | Drag-and-drop with Alpine |
| **axios** | `https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js` | HTTP client (if HTMX isn't enough) |
| **QRCode.js** | `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0/qrcode.min.js` | QR code generation |
| **Clipboard.js** | `https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0/clipboard.min.js` | Copy to clipboard |

### Performance & Loading

| Library | CDN URL | Use Case |
|---------|---------|----------|
| **Lozad** | `https://cdn.jsdelivr.net/npm/lozad@1/dist/lozad.min.js` | Lazy loading images/iframes |
| **lazysizes** | `https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3/lazysizes.min.js` | Full lazy loading suite |
| **NProgress** | `https://cdnjs.cloudflare.com/ajax/libs/nprogress/0.2/nprogress.min.js` + `.css` | Progress bar for page transitions |

### Recommended CDN Providers (for our project)

| Provider | Base URL | Best For |
|----------|----------|----------|
| **jsDelivr** | `https://cdn.jsdelivr.net/npm/` | npm packages (multi-CDN, most reliable) |
| **cdnjs** | `https://cdnjs.cloudflare.com/ajax/libs/` | Popular JS/CSS libraries (Cloudflare backed) |
| **unpkg** | `https://unpkg.com/` | Quick npm access |
| **Google Fonts** | `https://fonts.googleapis.com/` | Font families |
| **Tailwind Play CDN** | `https://cdn.tailwindcss.com` | Tailwind CSS engine |

### Loading Strategy

```html
<!-- 1. Critical CSS/Fonts first (blocking) -->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="https://cdn.tailwindcss.com">

<!-- 2. Tailwind + Fonts (render-blocking CSS) -->
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- 3. Core JS (deferred) -->
<script defer src="https://cdn.jsdelivr.net/npm/htmx.org@2/dist/htmx.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
<script defer src="https://unpkg.com/hyperscript.org@0.9"></script>

<!-- 4. Alpine plugins (deferred, AFTER Alpine) -->
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/persist@3/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3/dist/cdn.min.js"></script>

<!-- 5. Nostr / Utility (deferred) -->
<script defer src="https://unpkg.com/nostr-tools@2/lib/nostr.bundle.min.js"></script>

<!-- 6. Icons (async, non-blocking) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" media="print" onload="this.media='all'">

<!-- 7. Animate.css (async) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1/animate.min.css" media="print" onload="this.media='all'">

<!-- 8. GSAP for gamelike animations (deferred) -->
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12/gsap.min.js"></script>
```

### Tailwind Config for Animations

```js
tailwind.config = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'typewriter': 'typewriter 2s steps(40) forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        bounceIn: { '0%': { opacity: '0', transform: 'scale(0.3)' }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        glow: { '0%': { boxShadow: '0 0 5px rgba(34,197,94,0.2)' }, '100%': { boxShadow: '0 0 20px rgba(34,197,94,0.6)' } },
      }
    }
  }
}
```

### SEO / Meta

```html
<!-- Primary Meta -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="help — nostr peer network. find help. give help. decentralized.">
<meta name="theme-color" content="#22c55e">

<!-- Open Graph -->
<meta property="og:title" content="help — nostr peer network">
<meta property="og:description" content="find help. give help. decentralized.">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="help — nostr peer network">

<!-- PWA / Manifest -->
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
```
