# Findings

## SvelteKit + Netlify Setup

```
npm create svelte@latest . -- --template skeleton --types typescript
npm install -D tailwindcss @tailwindcss/vite
npm install nostr-tools marked dayjs
```

- Use `@sveltejs/adapter-netlify` (auto-detected by Netlify CLI)
- Tailwind v4 with `@tailwindcss/vite` plugin
- `+page.server.ts` for SSR, `+page.svelte` for UI

## Nostr Tools in SvelteKit
- `nostr-tools` works in both server and client
- Key generation should happen client-side only (crypto)
- Import: `import * as NostrTools from 'nostr-tools'`

## Simulating Peers
- Use a Svelte writable store with setInterval
- Generate fake peer objects with name, country, language, status
- Cycle statuses every random interval
- Store persists across route changes

## Deployment
- Netlify needs `netlify.toml` with publish directory
- SvelteKit adapter-netlify creates `.netlify/functions/`
- Environment variables for any config
