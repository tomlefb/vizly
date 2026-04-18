# Supabase email templates

Templates HTML des emails transactionnels envoyés par Supabase Auth
(confirmation d'inscription, magic link, reset password, etc).

## Où les copier

Dashboard Supabase → **Authentication** → **Email Templates** → sélectionne
le template correspondant → colle le contenu du `.html` de ce dossier.

| Fichier | Template Supabase |
|---|---|
| `confirm-signup.html` | Confirm signup |

*(Les autres templates seront ajoutés au fur et à mesure : magic-link,
reset-password, change-email-address, reauthentication.)*

## Variables Supabase

Les templates utilisent la syntaxe Go template de Supabase :

- `{{ .Token }}` — le code OTP 6 chiffres (pour les flows OTP)
- `{{ .ConfirmationURL }}` — lien magique (pour les flows link)
- `{{ .Email }}` — email de l'utilisateur
- `{{ .SiteURL }}` — URL du site configurée dans Supabase

## Direction visuelle

Tous les templates suivent la DA Handcrafted du site :

- Fond crème `#FAF8F6`, card blanche `#FFFFFF`, border `#E8E3DE`
- Wordmark `Vizly.` avec dot safran deep `#C2831A`
- System font stack (pas de webfont — fiabilité cross-client)
- Code OTP surligné signature `VzHighlight` : fond safran `#F1B434`,
  `transform:rotate(-1.5deg)`, border-radius 4px
- Boutons CTA (le cas échéant) : fond noir `#1A1A1A`, texte blanc,
  ombre offset safran `box-shadow:3px 3px 0 #F1B434`

## Compatibilité clients mail

- **Gmail** (web/iOS/Android) : rendu complet ✓
- **Apple Mail** (macOS/iOS) : rendu complet ✓
- **Outlook** (desktop Windows) : `transform:rotate` ignoré — le highlight
  s'affiche en rectangle droit, reste propre et identitaire ✓
- **Yahoo / ProtonMail** : rendu complet ✓

Le pattern `transform:rotate` est une amélioration progressive ; l'absence
de rotation dans Outlook ne dégrade pas l'expérience.
