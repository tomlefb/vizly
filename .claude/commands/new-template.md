# Nouveau Template Portfolio

Tu es le Designer senior du projet Portfolio Builder SaaS. Tu crees un nouveau template portfolio en suivant rigoureusement le Design Thinking Process.

## Contexte

Lis ces fichiers OBLIGATOIREMENT :
1. `MEMORY.md` -- Memoire persistante du projet (decisions, fonts deja utilisees)
2. `CLAUDE.md` -- Spec des templates, interface TemplateProps, descriptions des 8 templates
3. `AGENTS.md` -- Section Designer, anti-patterns, regles globales
4. `.claude/status/design-decisions.md` -- Decisions de design, fonts deja utilisees

## Template a creer

$ARGUMENTS

## Design Thinking Process (OBLIGATOIRE)

Avant d'ecrire une seule ligne de code, documente ces 4 etapes :

### 1. Purpose
- Quel type d'utilisateur ce template cible-t-il ?
- Quel probleme specifique resout-il pour cette cible ?
- Dans quel contexte sera-t-il utilise ? (candidature, portfolio pro, vitrine creative...)
- Qu'est-ce que l'utilisateur veut communiquer en choisissant CE template ?

### 2. Tone
- Quelle emotion dominante ? (professionnalisme, creativite, audace, elegance, fun...)
- Quel registre visuel ? (minimal, maximal, brutal, organique, geometrique...)
- Quelles references visuelles l'inspirent ? (magazines, affiches, sites specifiques...)
- Si ce template etait une marque, laquelle serait-il ?

### 3. Differentiation
- En quoi ce template se distingue-t-il des 7 autres ?
- Qu'est-ce qu'il fait que AUCUN autre template du projet ne fait ?
- Qu'est-ce qu'il fait differemment des templates de Squarespace, Wix, Carrd ?
- Quel est son "signature move" -- l'element visuel memorable qui le rend unique ?

### 4. Execution
- Font display choisie : [nom] -- DOIT etre unique, jamais utilisee par un autre template
- Font body choisie : [nom] -- complementaire a la display
- Layout principal : [description de la composition]
- Element signature : [l'element visuel distinctif]
- Palette : comment les couleurs dynamiques de l'utilisateur seront integrees
- Animations : quels mouvements specifiques

## Checklist technique

Le template DOIT :
- [ ] Implementer l'interface `TemplateProps` definie dans CLAUDE.md
- [ ] Recevoir `portfolio`, `projects`, et `isPremium` en props
- [ ] Utiliser les couleurs dynamiques (`primary_color`, `secondary_color`) de l'utilisateur
- [ ] Charger les fonts via `next/font/google` avec `display: swap`
- [ ] Etre responsive mobile-first (375px / 768px / 1280px)
- [ ] Etre accessible WCAG 2.1 AA (navigation clavier, contrastes, alt text)
- [ ] Utiliser des fonts UNIQUES jamais utilisees par un autre template du projet
- [ ] Peser < 50KB gzipped
- [ ] Respecter `prefers-reduced-motion` pour les animations
- [ ] Afficher le badge "Fait avec [Vizly]" si `isPremium === false`
- [ ] Gerer les cas limites : pas de photo, pas de projets, bio vide, pas de liens sociaux
- [ ] Utiliser des data-testid pour les elements testables

## Fonts deja utilisees (NE PAS REUTILISER)

Verifier dans `.claude/status/design-decisions.md` les fonts deja assignees aux autres templates. Chaque template a sa propre paire de fonts. Aucun doublon.

## Structure du fichier

Creer le template dans `src/components/templates/Template[Nom].tsx`.

Le composant doit :
1. Etre un Server Component par defaut (pas de "use client" sauf si animations Framer Motion necessaires)
2. Accepter `TemplateProps` en props
3. Exporter un composant par defaut nomme `Template[Nom]`
4. Inclure le Design Thinking Process en commentaire en tete du fichier

## Anti-patterns INTERDITS

- Gradients violet-bleu generiques
- Inter, Roboto, Arial en display
- Layout centre symetrique sans tension
- Border-radius uniforme
- Ombres sans intention
- Cards identiques en grille parfaite
- Copier le layout d'un autre template du projet
- Utiliser les memes fonts qu'un autre template

## Livrable

1. Le fichier du template : `src/components/templates/Template[Nom].tsx`
2. Mise a jour de `design-decisions.md` avec les fonts choisies
3. Le Design Thinking Process documente (en commentaire ou dans design-decisions.md)

## Memoire -- Mise a jour obligatoire en fin de creation

A la fin de la creation du template, mettre a jour `MEMORY.md` :
1. Ajouter une entree dans "Historique des sessions" avec le template cree et ses fonts
2. Ajouter la decision de fonts dans le "Registre des decisions"
3. Mettre a jour "Etat actuel du projet" si c'est le premier template ou le dernier
4. Mettre a jour le timestamp "Derniere mise a jour"
