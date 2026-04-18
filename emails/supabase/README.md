# Supabase email templates

Templates HTML des emails transactionnels envoyés par Supabase Auth :
confirmation d'inscription, magic link, reset password, change email,
invite user. Tous alignés sur la DA Handcrafted (safran + crème + noir).

## Où les copier

Dashboard Supabase → **Authentication** → **Email Templates** → sélectionne
le template correspondant → colle le contenu du `.html` de ce dossier dans
le champ "Message (HTML)".

| Fichier | Template Supabase | Variables utilisées |
|---|---|---|
| `confirm-signup.html` | Confirm signup | `{{ .Token }}` |
| `reset-password.html` | Reset password | `{{ .Token }}` |
| `change-email.html` | Change email address | `{{ .Token }}` |
| `magic-link.html` | Magic link | `{{ .ConfirmationURL }}` |
| `invite-user.html` | Invite user | `{{ .ConfirmationURL }}` |

## Variables Supabase

Syntaxe Go template :

- `{{ .Token }}` — code OTP 6 chiffres (flows OTP)
- `{{ .ConfirmationURL }}` — lien magique (flows link)
- `{{ .Email }}` — email de l'utilisateur
- `{{ .SiteURL }}` — URL du site configurée dans Supabase

## Direction visuelle

Tous les templates suivent la DA Handcrafted du site :

- Fond crème `#FAF8F6`, card blanche `#FFFFFF`, border `#E8E3DE`
- Wordmark `Vizly.` avec dot safran deep `#C2831A`
- System font stack (pas de webfont — fiabilité cross-client)

**Pattern signature VzHighlight** pour le point focal de chaque mail :

- **OTP templates** (confirm-signup, reset-password, change-email) : le
  code OTP est surligné safran `#F1B434` avec `transform:rotate(-1.5deg)`,
  border-radius 4px. Remplace l'ancienne card accent-light.
- **Link templates** (magic-link, invite-user) : un mot-clé du H1 est
  surligné de la même manière (« *Connecte-toi* à Vizly », « Tu es
  *invité* sur Vizly »).
- **Boutons CTA** (magic-link, invite-user) : fond noir `#1A1A1A` + ombre
  offset safran `box-shadow:3px 3px 0 #F1B434` — la signature des boutons
  primaires du site.

## Compatibilité clients mail

- **Gmail** (web/iOS/Android) : rendu complet, rotation + box-shadow ✓
- **Apple Mail** (macOS/iOS) : rendu complet ✓
- **Outlook desktop Windows** : `transform:rotate` et `box-shadow` ignorés
  par le moteur Word. Le highlight s'affiche en rectangle droit, les
  boutons restent noir plein. Reste propre et cohérent ✓
- **Outlook.com web** : rendu partiel, cohérent ✓
- **Yahoo / ProtonMail** : rendu complet ✓

Le `transform:rotate` et le `box-shadow` sont des améliorations
progressives — leur absence ne dégrade pas l'expérience, juste la
signature visuelle est moins marquée.
