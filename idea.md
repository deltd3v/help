# help

Nostr powered embeddable html solution
we all need help, what if u could see a list of peers active or inactive in your area, by country flag + language and their helper score, when they were active last, you can leave a message.. 
we are not building a backend powered by opensource and third-party solutions for auth/db/queues/*
we are using nostr clients to create a client and we assign it a handle that the user picks but behind the scenes its using the big platforms for free to make sure they get the help they need, there's also a page where people leave a reddit like post asking for help and has an openforum (visible only to their selected choice, locations or even world wide)

i dont have funds, i am solo so i cant afford any thing in this project i would like some donations for support

## Log

### 02.07.2026 - make a html page and host it on github pages that has a form on it
- Initial day 1 landing page with early-access form
- Hosted on GitHub Pages at https://deltd3v.github.io/help/

### 02.07.2026 - additions throughout the day
- Added peer list with simulated peers (🇫🇮🇧🇷🇩🇪🇯🇵) showing handles, languages, helper scores, and active/idle status
- Added "how it works" section with 3 steps
- Added support/donate section
- Added hero section with pulse-dot particle field
- Added interactive hover effects to peer cards (flag rotates/scales on hover)
- Added canvas particle animation in modal background
- Added multi-step game-animated slide-in modal with 11 views:
  - Sign In (handle + password)
  - Sign Up (handle, country, language, email, password)
  - Forgot Password (email/handle recovery)
  - Forgot Username (email recovery)
  - Settings menu (grid of 6 settings cards)
  - Theme picker (Dark, Dim, Light, Cyber)
  - Font picker (Inter, Fraunces, IBM Plex Mono, Georgia)
  - Language/i18n picker (🇬🇧🇫🇮🇧🇷🇩🇪🇯🇵🇪🇸)
  - FAQ (expandable accordion)
  - Terms of Service
  - Cookie preferences (necessary, preferences, analytics toggles)
- Game-like modal transitions: morph-in/out with blur + scale + translate keyframes, progress dots with fill animations
- Cards scale + glow on hover, inputs warp on focus, buttons with gradient sweep + press scale
- Toast notification system for feedback
- Git history wiped clean — single root commit as HEAD

