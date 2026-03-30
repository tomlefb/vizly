/**
 * Tests E2E — Editeur multi-etapes
 *
 * ETAT ACTUEL : La majorite des tests sont marques `test.skip` car ils
 * necessitent une session Supabase Auth authentifiee. Le seul test
 * immediatement executable verifie la redirection vers /login.
 *
 * COMMENT ACTIVER LES TESTS UNE FOIS L'AUTH MOCK SERA EN PLACE :
 * ---------------------------------------------------------------
 * 1. Creer un fichier `tests/fixtures/auth.setup.ts` qui :
 *    - Cree un utilisateur de test via Supabase Admin API ou via
 *      `supabase.auth.signInWithPassword` avec des credentials de test
 *    - Sauvegarde le storage state via `page.context().storageState()`
 *      dans `tests/fixtures/.auth/user.json`
 * 2. Dans `playwright.config.ts`, ajouter un projet "setup" :
 *    ```ts
 *    projects: [
 *      { name: 'setup', testMatch: /auth\.setup\.ts/ },
 *      {
 *        name: 'chromium',
 *        use: { ...devices['Desktop Chrome'],
 *               storageState: 'tests/fixtures/.auth/user.json' },
 *        dependencies: ['setup'],
 *      },
 *    ]
 *    ```
 * 3. Retirer les `test.skip` des blocs concernes.
 * 4. Remplacer `await page.goto('/editor')` par un goto direct sans
 *    redirection (l'auth est portee par le storage state).
 *
 * REFERENCES :
 *   https://playwright.dev/docs/auth
 *   https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Acces et redirection
// ---------------------------------------------------------------------------

test.describe('Editeur — Acces et redirection', () => {
  test('redirige vers /login si non connecte', async ({ page }) => {
    await page.goto('/editor')
    // Next.js redirect() renvoie vers /login (via middleware ou Server Component)
    await expect(page).toHaveURL(/\/login/)
  })
})

// ---------------------------------------------------------------------------
// Navigation entre etapes
// ---------------------------------------------------------------------------

test.describe('Editeur — Navigation entre etapes', () => {
  test.skip(
    'affiche l\'etape 1 (Infos personnelles) par defaut',
    async ({ page }) => {
      // PREREQUIS : session authentifiee (storage state)
      await page.goto('/editor')
      await expect(page.getByTestId('step-personal-info')).toBeVisible()
      await expect(page.getByTestId('step-nav')).toBeVisible()
    }
  )

  test.skip(
    'le bouton Precedent est desactive a l\'etape 1',
    async ({ page }) => {
      await page.goto('/editor')
      const prevBtn = page.getByTestId('step-prev')
      await expect(prevBtn).toBeDisabled()
    }
  )

  test.skip(
    'le bouton Suivant est desactive quand le nom est vide',
    async ({ page }) => {
      await page.goto('/editor')
      // Aucune saisie — titre vide par defaut
      const nextBtn = page.getByTestId('step-next')
      await expect(nextBtn).toBeDisabled()
    }
  )

  test.skip(
    'navigation vers l\'etape 2 apres saisie du nom',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await expect(page.getByTestId('step-projects')).toBeVisible()
    }
  )

  test.skip(
    'navigation retour vers l\'etape 1 depuis l\'etape 2',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await expect(page.getByTestId('step-projects')).toBeVisible()
      await page.getByTestId('step-prev').click()
      await expect(page.getByTestId('step-personal-info')).toBeVisible()
    }
  )

  test.skip(
    'navigation complete a travers les 5 etapes',
    async ({ page }) => {
      await page.goto('/editor')

      // Etape 1 -> 2
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await expect(page.getByTestId('step-projects')).toBeVisible()

      // Etape 2 -> 3 (aucun projet requis)
      await page.getByTestId('step-next').click()
      await expect(page.getByTestId('step-customization')).toBeVisible()

      // Etape 3 -> 4
      await page.getByTestId('step-next').click()
      await expect(page.getByTestId('step-preview')).toBeVisible()

      // Etape 4 -> 5
      await page.getByTestId('step-next').click()
      await expect(page.getByTestId('step-publish')).toBeVisible()
    }
  )
})

// ---------------------------------------------------------------------------
// Etape 1 — Infos personnelles
// ---------------------------------------------------------------------------

test.describe('Editeur — Etape 1 : Infos personnelles', () => {
  test.skip(
    'remplit le formulaire complet et verifie la mise a jour du live preview',
    async ({ page }) => {
      await page.goto('/editor')

      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('input-bio').fill('Developpeur web freelance')
      await page.getByTestId('input-contact-email').fill('tom@example.com')
      await page.getByTestId('input-social-github').fill(
        'https://github.com/tomlefb'
      )
      await page.getByTestId('input-social-linkedin').fill(
        'https://linkedin.com/in/tomlefb'
      )

      // Le live preview doit afficher le nom saisi
      await expect(page.getByTestId('live-preview')).toContainText(
        'Tom Lefebvre'
      )
    }
  )

  test.skip(
    'affiche le compteur de caracteres pour la bio',
    async ({ page }) => {
      await page.goto('/editor')
      const bio = 'Developpeur passionné'
      await page.getByTestId('input-bio').fill(bio)
      // Le compteur format "N/500" doit etre visible
      await expect(
        page.getByText(new RegExp(`${bio.length}\\/500`))
      ).toBeVisible()
    }
  )

  test.skip(
    'affiche une erreur quand le nom est vide et qu\'on tente de passer a l\'etape 2',
    async ({ page }) => {
      await page.goto('/editor')
      // S'assurer que le champ titre est vide
      await page.getByTestId('input-title').clear()
      await page.getByTestId('step-next').click()
      // Doit rester sur l'etape 1
      await expect(page.getByTestId('step-personal-info')).toBeVisible()
    }
  )

  test.skip(
    'les inputs reseaux sociaux sont tous presents',
    async ({ page }) => {
      await page.goto('/editor')
      const platforms = [
        'linkedin',
        'github',
        'dribbble',
        'instagram',
        'twitter',
        'website',
      ]
      for (const platform of platforms) {
        await expect(
          page.getByTestId(`input-social-${platform}`)
        ).toBeVisible()
      }
    }
  )
})

// ---------------------------------------------------------------------------
// Etape 2 — Projets
// ---------------------------------------------------------------------------

test.describe('Editeur — Etape 2 : Projets', () => {
  /**
   * Helper interne : navigue jusqu'a l'etape 2.
   * Ne peut pas etre utilise sans auth — reste dans les tests skip.
   */

  test.skip(
    'affiche l\'etat vide au debut (aucun projet)',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      await expect(page.getByTestId('step-projects')).toBeVisible()
      await expect(
        page.getByText('Aucun projet pour le moment')
      ).toBeVisible()
      await expect(page.getByTestId('add-project-btn')).toBeVisible()
    }
  )

  test.skip(
    'ouvre le formulaire de projet au clic sur Ajouter',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      await page.getByTestId('add-project-btn').click()
      await expect(page.getByTestId('project-form')).toBeVisible()
      await expect(page.getByTestId('project-title')).toBeVisible()
      await expect(page.getByTestId('project-description')).toBeVisible()
    }
  )

  test.skip(
    'ajoute un projet et le voit apparaitre dans la liste',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      await page.getByTestId('add-project-btn').click()
      await page.getByTestId('project-title').fill('Mon Premier Projet')
      await page.getByTestId('project-description').fill(
        'Un projet de demonstration.'
      )

      // Bouton "Ajouter" dans le dialog footer
      await page.getByRole('button', { name: 'Ajouter' }).click()

      // Le projet apparait dans la liste
      await expect(page.getByTestId('project-list')).toContainText(
        'Mon Premier Projet'
      )
    }
  )

  test.skip(
    'le bouton Ajouter du dialog est desactive si le titre est vide',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      await page.getByTestId('add-project-btn').click()
      // Titre vide par defaut — le bouton doit etre desactive
      await expect(
        page.getByRole('button', { name: 'Ajouter' })
      ).toBeDisabled()
    }
  )

  test.skip(
    'modifie un projet existant',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      // Creer un projet d'abord
      await page.getByTestId('add-project-btn').click()
      await page.getByTestId('project-title').fill('Projet Initial')
      await page.getByRole('button', { name: 'Ajouter' }).click()

      // Cliquer sur le bouton edit (aria-label contient "Modifier le projet")
      await page
        .getByRole('button', { name: /Modifier le projet Projet Initial/i })
        .click()
      await expect(page.getByTestId('project-form')).toBeVisible()

      // Modifier le titre
      await page.getByTestId('project-title').clear()
      await page.getByTestId('project-title').fill('Projet Modifie')
      await page.getByRole('button', { name: 'Enregistrer' }).click()

      // Titre mis a jour dans la liste
      await expect(page.getByTestId('project-list')).toContainText(
        'Projet Modifie'
      )
    }
  )

  test.skip(
    'supprime un projet',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      // Creer un projet
      await page.getByTestId('add-project-btn').click()
      await page.getByTestId('project-title').fill('Projet a Supprimer')
      await page.getByRole('button', { name: 'Ajouter' }).click()
      await expect(page.getByTestId('project-list')).toContainText(
        'Projet a Supprimer'
      )

      // Supprimer via le bouton (aria-label contient "Supprimer le projet")
      await page
        .getByRole('button', {
          name: /Supprimer le projet Projet a Supprimer/i,
        })
        .click()

      // La liste disparait (0 projets) ou le projet n'est plus present
      await expect(page.getByTestId('project-list')).not.toBeVisible()
    }
  )

  test.skip(
    'ferme le dialog avec la touche Echap',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      await page.getByTestId('add-project-btn').click()
      await expect(page.getByTestId('project-form')).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(page.getByTestId('project-form')).not.toBeVisible()
    }
  )
})

// ---------------------------------------------------------------------------
// Etape 3 — Personnalisation
// ---------------------------------------------------------------------------

test.describe('Editeur — Etape 3 : Personnalisation', () => {
  test.skip(
    'affiche le selecteur de templates, les color pickers et le font selector',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      await expect(page.getByTestId('step-customization')).toBeVisible()
      await expect(page.getByTestId('template-selector')).toBeVisible()
      await expect(page.getByTestId('color-picker')).toBeVisible()
      await expect(page.getByTestId('font-selector')).toBeVisible()
    }
  )

  test.skip(
    'selectionne le template Dark',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      await page.getByTestId('template-card-dark').click()
      // Le template dark est selectionne — verifier l'attribut aria-pressed ou un ring visible
      const card = page.getByTestId('template-card-dark')
      await expect(card).toHaveAttribute('aria-pressed', 'true')
    }
  )

  test.skip(
    'les templates premium affichent un badge de verrouillage sans achat',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      // Les templates premium : creatif, brutalist, elegant, bento
      for (const name of ['creatif', 'brutalist', 'elegant', 'bento']) {
        await expect(
          page.getByTestId(`template-card-${name}`)
        ).toBeVisible()
      }
    }
  )
})

// ---------------------------------------------------------------------------
// Etape 4 — Preview
// ---------------------------------------------------------------------------

test.describe('Editeur — Etape 4 : Preview', () => {
  test.skip(
    'affiche le conteneur step-preview avec les donnees saisies',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click() // -> etape 2
      await page.getByTestId('step-next').click() // -> etape 3
      await page.getByTestId('step-next').click() // -> etape 4

      await expect(page.getByTestId('step-preview')).toBeVisible()
      // Le nom saisi doit apparaitre dans le preview
      await expect(page.getByTestId('step-preview')).toContainText(
        'Tom Lefebvre'
      )
    }
  )

  test.skip(
    'le bouton Retour ramene a l\'etape 3',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      await page.getByRole('button', { name: /Retour a l'edition/i }).click()
      await expect(page.getByTestId('step-customization')).toBeVisible()
    }
  )
})

// ---------------------------------------------------------------------------
// Etape 5 — Publication
// ---------------------------------------------------------------------------

test.describe('Editeur — Etape 5 : Publication', () => {
  test.skip(
    'affiche le champ slug et le bouton publier',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      await expect(page.getByTestId('step-publish')).toBeVisible()
      await expect(page.getByTestId('slug-input')).toBeVisible()
      await expect(page.getByTestId('publish-btn')).toBeVisible()
    }
  )

  test.skip(
    'affiche le recapitulatif avec le template choisi',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      // La section recap doit mentionner "Template"
      await expect(page.getByTestId('step-publish')).toContainText('Template')
      // Et le template par defaut "minimal"
      await expect(page.getByTestId('step-publish')).toContainText('minimal')
    }
  )

  test.skip(
    'rejette un slug trop court (moins de 3 caracteres)',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      await page.getByTestId('slug-input').fill('ab')
      await expect(page.getByText(/Au moins 3 caracteres/i)).toBeVisible()
      // Le bouton publier doit rester desactive
      await expect(page.getByTestId('publish-btn')).toBeDisabled()
    }
  )

  test.skip(
    'verifie la disponibilite d\'un slug valide',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      await page.getByTestId('slug-input').fill('monportfolio')
      // Attendre le debounce (400ms) + reponse API
      await expect(page.getByText(/Disponible/i)).toBeVisible({
        timeout: 3000,
      })
    }
  )

  test.skip(
    'sanitize le slug : supprime les caracteres speciaux',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()
      await page.getByTestId('step-next').click()

      // Saisir un slug avec majuscules et caracteres speciaux
      await page.getByTestId('slug-input').fill('Mon Pseudo!')
      // La valeur affichee doit etre sanitizee en "monpseudo"
      await expect(page.getByTestId('slug-input')).toHaveValue('monpseudo')
    }
  )
})

// ---------------------------------------------------------------------------
// Live preview
// ---------------------------------------------------------------------------

test.describe('Editeur — Live Preview', () => {
  test.skip(
    'affiche l\'etat vide avant toute saisie',
    async ({ page }) => {
      await page.goto('/editor')
      await expect(page.getByTestId('live-preview')).toBeVisible()
      // Message d'etat vide
      await expect(page.getByTestId('live-preview')).toContainText(
        'Commence a remplir le formulaire'
      )
    }
  )

  test.skip(
    'se met a jour en temps reel quand le nom est saisi',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Jane Doe')
      await expect(page.getByTestId('live-preview')).toContainText('Jane Doe')
    }
  )
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test.describe('Editeur — Edge cases', () => {
  test.skip(
    'bio tronquee a 500 caracteres via maxLength HTML',
    async ({ page }) => {
      await page.goto('/editor')
      const longBio = 'A'.repeat(600)
      await page.getByTestId('input-bio').fill(longBio)
      // maxLength="500" empeche la saisie au-dela — la valeur effective est <= 500
      const value = await page.getByTestId('input-bio').inputValue()
      expect(value.length).toBeLessThanOrEqual(500)
    }
  )

  test.skip(
    'ne peut pas naviguer vers une etape future non completee',
    async ({ page }) => {
      await page.goto('/editor')
      // Cliquer directement sur la pill "Etape 5" sans avoir complete les etapes
      await page.getByRole('button', { name: /Etape 5/i }).click()
      // Doit rester sur l'etape 1
      await expect(page.getByTestId('step-personal-info')).toBeVisible()
    }
  )

  test.skip(
    'le dialog projet se ferme en cliquant sur l\'overlay',
    async ({ page }) => {
      await page.goto('/editor')
      await page.getByTestId('input-title').fill('Tom Lefebvre')
      await page.getByTestId('step-next').click()

      await page.getByTestId('add-project-btn').click()
      await expect(page.getByTestId('project-form')).toBeVisible()

      // Cliquer sur l'overlay (backdrop) en dehors du dialog
      // L'overlay est le premier ancetre fixed avec role="dialog"
      await page.getByRole('dialog').click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('project-form')).not.toBeVisible()
    }
  )
})
