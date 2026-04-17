---
name: Vizly design system
description: Use when designing for Vizly — a French SaaS for creating portfolios. "Handcrafted" direction: lime accent on cream bg, black buttons with offset lime shadow, Satoshi display + DM Sans body. French copy, tutoiement. Read README.md first for full system, then colors_and_type.css for tokens. Both the marketing site (vizly.fr) and the dashboard app have complete UI kits in ui_kits/.
---

# Vizly design system — quick start

**Product.** French portfolio-builder SaaS. Form-driven site creation → live on `pseudo.vizly.fr`. Audience: freelance creatives (photographers, designers, illustrators).

## Before you design anything

1. **Read `README.md` in full.** It defines the direction ("Handcrafted"), the voice (French, tutoiement, no emoji), palette rules (1 lime accent max per page, no gradients), and signature patterns (offset shadows, marker highlight on H1, cream bg + grain texture).
2. **Link `colors_and_type.css`** in every HTML file. All tokens (colors, type, radii, shadows) live there. Never inline hex values.
3. **Pick the right UI kit as starting point:**
   - `ui_kits/marketing/` → landing, pricing, anything on `vizly.fr`
   - `ui_kits/dashboard/` → anything authenticated (portfolio list, editor, billing)

## Non-negotiables

- **Language: French.** Tutoiement ("ton", "tu"). No emoji in UI ever. No exclamation marks except on marketing CTAs (rare).
- **Colors: strictly from tokens.** Background is cream `#FAF8F6`, never gray. One lime accent visible at a time.
- **Buttons: black bg `#1A1A1A` + offset lime shadow** `box-shadow: 3px 3px 0 #C8F169`, radius 10px. Hover shifts `translate(1px,1px)` and reduces shadow to 2px. No gradient, no pill-shape primaries.
- **Signature highlight: 1-2 words of each H1/H2 wrapped in `<span class="vz-highlight">` or `<VzHighlight>`** (lime background, slight `-1.5deg` rotation). Feels hand-drawn.
- **Cards: white, border `#EDE6DE`, radius 14px, NO shadow at rest.** Hover: border deepens to `#D8D3C7` + `shadow: 0 2px 12px rgba(0,0,0,0.04)`.
- **Body grain texture** applied via `body::before` — already in `colors_and_type.css`. Never remove it.
- **Logo wordmark**: the period in "Vizly." is always colored lime-deep `#8AB83D`. Use `<VzLogo>` from `ui_kits/marketing/atoms.jsx`.
- **Icons: Lucide only**, stroke-width 1.5, sizes 16/18/20/24px, color defaults to `var(--fg-secondary)`.

## Shared React atoms

Both UI kits share `ui_kits/marketing/atoms.jsx`:
- `<VzLogo size={20} />` — wordmark with lime dot
- `<VzBtn variant="primary|secondary|ghost" size="sm|md|lg">` — offset-shadow buttons
- `<VzHighlight>5 minutes</VzHighlight>` — marker highlight
- `<VzBadge variant="online|draft|pro|popular">` — status pill
- `<VzAvatar initials="SD" size={34} />` — lime square avatar

Dashboard-specific atoms in `ui_kits/dashboard/components.jsx` (sidebar, portfolio card, topbar, empty state).

## Fonts

Satoshi WOFF2 files are not in the repo (license only). Current substitution: **Plus Jakarta Sans** via Google Fonts (loaded in `colors_and_type.css`). When the user provides Satoshi, drop it into `fonts/Satoshi-Variable.woff2` and update the `@font-face` in `colors_and_type.css` — no other change needed.

## Common pitfalls

- Adding gray/slate/zinc anywhere. Always cream `#FAF8F6` / white / `#F4EFE8`.
- Forgetting the period dot color on "Vizly" wordmark.
- Using shadow on cards at rest (forbidden — shadow is reserved for the button signature).
- ScrollReveal in dashboard (forbidden — marketing only).
- UPPERCASE outside of status badges.
- More than one lime accent on screen (except pricing grid).
- Missing French typography spaces (`espace insécable` before `:` `;` `!` `?`).

## When the user asks for a new screen

1. Identify surface (marketing / dashboard / public portfolio).
2. Copy the closest UI kit file as starting point.
3. Reuse atoms from `atoms.jsx` — don't redraw buttons or badges.
4. Keep one lime accent per viewport. Apply marker highlight to the most important 1-2 words of the headline.
5. French copy, tutoiement, no emoji. Use the vocabulary list in README (portfolio / template / en ligne / brouillon).

## Divergence note

The codebase at `github.com/tomlefb/vizly` is an **older** state (terracotta accent, white bg). The user's design notes are **newer** ("Handcrafted" lime direction). This system follows the notes. If importing from the repo, assume you're migrating old components to the new direction.
