# Task Plan: Professional SvelteKit Rebuild

## Goal
Transform the "help" Nostr peer network from its current broken state into a professional, working SvelteKit SSR application by rebuilding from scratch with proper architecture.

## Acceptance Criteria
1. [ ] All pages render correctly (no blank page, no 404)
2. [ ] i18n language picker changes all UI text in real-time (5 languages)
3. [ ] Peer simulation runs in a Web Worker (true concurrent thread)
4. [ ] Professional design matching idea.md: green palette, glassmorphism, Inter font
5. [ ] Dark mode works consistently
6. [ ] Mobile bottom nav works
7. [ ] Auth flow works (register, sign in, recover, OTP, NIP-07)
8. [ ] Dashboard renders QR code + Chart.js chart + stats + activity
9. [ ] Forum with Markdown rendering works
10. [ ] Keyboard shortcuts work
11. [ ] Cookie consent works
12. [ ] Clean `npm run build` passes

## Phases

### Phase 1: Scaffold Clean Project ✅ (already have basic project)
### Phase 2: Rebuild i18n System
- Simplify translations to use a single reactive map
- Apply `$t('key')` to every text node in all templates
- Fix lang store to properly persist and react
### Phase 3: Add Web Worker Peer Simulation
- Create `src/lib/workers/peerSimulation.ts`
- Use Vite's `?worker` import
- Post messages to main thread every 2-3s for each peer
- 10+ daemon peers with complex status cycling patterns
### Phase 4: Rebuild UI Components
- Auth flow with proper styling
- Dashboard with working Chart.js + QR code
- Peer list with search + live status from Worker
- Forum with Markdown rendering
- Cookie consent
- Keyboard shortcuts
- Mobile bottom nav
### Phase 5: Fix Design & Polish
- idea.md brand identity: green palette, glassmorphism
- Proper dark mode with system preference detection
- Responsive layout
- PWA manifest
- Smooth transitions
### Phase 6: Verify & Deploy
- `npm run build` passes
- Deploy to Netlify
- Verify all features work

## Known Issues from Current Codebase
1. i18n: translations defined but NEVER used in templates (all English hardcoded)
2. Layout uses `$darkMode` (Svelte 4 syntax) but runs in Svelte 5 runes mode
3. Peer simulation on main thread (not concurrent)
4. Chart.js imported dynamically but error handling missing
5. QR code renders after timeout (race condition)
6. Cookie consent uses unsupported `{#if typeof window}` pattern in SSR
7. CSP meta tag missing from layout
8. No proper error boundaries
9. `bind:value` with Svelte 5 requires `$state()` variables (mostly correct)
10. `bind:this={chartCanvas}` requires `$state()` (correctly done but initialization timing is fragile)
