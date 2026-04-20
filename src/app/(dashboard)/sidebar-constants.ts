// Constantes partagées serveur + client pour la sidebar.
// Doivent vivre hors d'un fichier "use client" : importées depuis la
// layout Server Component pour lire le cookie à la SSR et éviter le flash
// de labels au F5 quand la sidebar est rétractée.
export const SIDEBAR_COOKIE = 'vizly-sidebar-expanded'
export const SIDEBAR_EXPANDED_WIDTH = 220
export const SIDEBAR_COLLAPSED_WIDTH = 56
