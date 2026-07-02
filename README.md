# help

We all need help. This is a lightweight, nostr-powered way to find people
nearby — by country and language — who are around and willing to help.

No backend of our own to trust, no company behind it. Handles, presence, and
"helper score" all live in each person's own nostr identity; this project is
just a thin, honest client on top of it.

## Status

Day one. The site in [`docs/`](./docs) is a static landing page with an
early-access form — no live network yet. See [`idea.md`](./idea.md) for the
running notes on where this is headed.

This is a solo project, built with no funding. If it's useful to you, the
site has a way to support it.

## Live site

https://YOUR_GH_USERNAME.github.io/help/

## Local dev

It's a single static page — just open `docs/index.html` in a browser, or:

```
cd docs && python3 -m http.server 8000
```

## License

MIT
