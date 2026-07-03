# Task Plan: SvelteKit SSR → Netlify

## Goal
Convert monolithic CDN-HTML app into a proper SvelteKit SSR app deployed on Netlify, with simulated live peer interactions and a polished design.

## Acceptance Criteria
1. `npm run dev` starts a working dev server
2. Nostr auth flow works (register, sign in, recover, OTP, NIP-07)
3. Dashboard shows profile, QR code, activity chart, recent activity
4. Peers page shows simulated online users with live activity updates
5. Forum page has posts with markdown rendering
6. Dark mode + i18n (EN/ES/FR/DE/PT) work
7. `npm run build` succeeds
8. Deploy to Netlify works

## Phases

### Phase 1: Scaffold SvelteKit + Tailwind ✅
- `npm create svelte@latest` with skeleton, TypeScript, ESLint
- Add Tailwind CSS via PostCSS
- Configure brand colors and animations

### Phase 2: Core Layout + Auth Pages ✅
- Layout with header, dark mode toggle, lang switcher, nav
- Auth flow: welcome page with 4 action cards
- Register form with Nostr key generation
- Sign-in with nsec or NIP-07 extension
- Recovery form
- OTP verification step

### Phase 3: Dashboard + Peers + Forum ✅
- Dashboard: profile card, QR code, stats, activity chart, recent activity
- Peers: searchable list with simulated online/offline/live activity
- Forum: post listing, new post form with markdown, filter tabs

### Phase 4: Simulated Live Interactions ✅
- Store with setInterval generating fake peer activity
- Activity feed updates every 5-10 seconds
- Peer status changes (online/away/offline cycling)

### Phase 5: Polish + Deploy ✅
- 404 page
- PWA manifest
- Netlify config (`netlify.toml`)
- Build and verify
