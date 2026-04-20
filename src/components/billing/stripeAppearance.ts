// =============================================================================
// stripeAppearance.ts — Vizly design tokens applied to the Stripe PaymentElement
// =============================================================================
//
// These values are HARDCODED copies of the CSS variables defined in
// src/app/globals.css (@theme block). Keep them in sync manually whenever
// the Vizly design tokens are updated — the Stripe PaymentElement renders
// inside an iframe and cannot read CSS variables from the parent document.
//
// Source of truth: src/app/globals.css
//
// Last sync: 2026-04-14 (Phase 4 creation)
//
// PCI compliance trade-off: the PaymentElement renders inside a Stripe-hosted
// iframe so card data never touches the Vizly origin. This means we cannot
// apply Tailwind classes or directly target elements with CSS. The only
// styling channel is this `appearance` object. Some pixel-level details from
// the Vizly system (specific shadows, sub-pixel borders, the parchment grain
// overlay) cannot be reproduced 1:1 inside the iframe. That's an accepted
// trade-off for PCI safety.

import type { Appearance } from '@stripe/stripe-js'

// ---- Vizly design tokens (mirror of globals.css) -----------------------------

const VIZLY_BACKGROUND = '#FFFFFF'
const VIZLY_FOREGROUND = '#1A1A1A'
const VIZLY_MUTED = '#6B6560'
const VIZLY_MUTED_FOREGROUND = '#9C958E'
const VIZLY_BORDER = '#E8E3DE'
// Safran — la couleur signature de l'app (mirror de --color-accent dans
// globals.css). L'ancienne valeur pointait vers DEFAULT_PORTFOLIO_COLOR
// (#D4634E terracotta), la couleur par défaut des portfolios publics, ce
// qui donnait un contour orange sur la modale Stripe alors que le reste
// du site est safran.
const VIZLY_ACCENT = '#F1B434'
const VIZLY_ACCENT_DEEP = '#C2831A' // --color-accent-deep, utilisé pour les focus rings
const VIZLY_DESTRUCTIVE = '#DC2626'
const VIZLY_RADIUS_MD = '10px' // matches --radius-md, used for buttons/inputs
const VIZLY_FONT_BODY = '"DM Sans", system-ui, sans-serif'

// ---- Stripe Appearance object ------------------------------------------------
//
// Theme: 'flat' is the most minimal Stripe base — no default shadows, no
// rounded gradients. We layer Vizly tokens on top of it via `variables` for
// global colors/fonts and `rules` for element-specific overrides.

export const vizlyAppearance: Appearance = {
  theme: 'flat',
  variables: {
    // Brand — safran (signature Vizly). Le texte posé sur un fond safran
    // doit rester noir (--color-accent-fg) pour un contraste suffisant.
    colorPrimary: VIZLY_ACCENT,
    colorPrimaryText: VIZLY_FOREGROUND,
    // Surfaces & text
    colorBackground: VIZLY_BACKGROUND,
    colorText: VIZLY_FOREGROUND,
    colorTextSecondary: VIZLY_MUTED,
    colorTextPlaceholder: VIZLY_MUTED_FOREGROUND,
    // Errors
    colorDanger: VIZLY_DESTRUCTIVE,
    colorDangerText: VIZLY_DESTRUCTIVE,
    // Typography
    fontFamily: VIZLY_FONT_BODY,
    fontSizeBase: '15px',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    // Layout
    spacingUnit: '4px',
    borderRadius: VIZLY_RADIUS_MD,
    // Tab icons (Card / Apple Pay / Google Pay / Link)
    colorIconTab: VIZLY_MUTED,
    colorIconTabSelected: VIZLY_ACCENT,
    colorIconTabHover: VIZLY_FOREGROUND,
  },
  rules: {
    // ---- Tabs (payment method selector) ----
    '.Tab': {
      border: `1px solid ${VIZLY_BORDER}`,
      boxShadow: 'none',
      backgroundColor: VIZLY_BACKGROUND,
    },
    '.Tab:hover': {
      border: `1px solid ${VIZLY_FOREGROUND}33`, // /20 opacity
      backgroundColor: VIZLY_BACKGROUND,
    },
    '.Tab--selected': {
      border: `1px solid ${VIZLY_ACCENT}`,
      backgroundColor: VIZLY_BACKGROUND,
      boxShadow: 'none',
    },
    '.Tab--selected:focus': {
      boxShadow: 'none',
    },
    // ---- Inputs (card number, expiry, cvc, postal code, etc.) ----
    '.Input': {
      border: `1px solid ${VIZLY_BORDER}`,
      boxShadow: 'none',
      backgroundColor: VIZLY_BACKGROUND,
      color: VIZLY_FOREGROUND,
    },
    '.Input:focus': {
      border: `1px solid ${VIZLY_ACCENT}`,
      boxShadow: `0 0 0 3px ${VIZLY_ACCENT}26`, // /15 opacity, focus ring
    },
    '.Input--invalid': {
      border: `1px solid ${VIZLY_DESTRUCTIVE}`,
      boxShadow: 'none',
    },
    // ---- Labels (above each input) ----
    '.Label': {
      fontWeight: '500',
      color: VIZLY_FOREGROUND,
      fontSize: '14px',
    },
    // ---- Error text ----
    '.Error': {
      color: VIZLY_DESTRUCTIVE,
      fontSize: '13px',
      marginTop: '6px',
    },
  },
}
