/**
 * Tests E2E — Flow de publication de portfolio
 *
 * ETAT ACTUEL :
 * Le test executable immediatement verifie le comportement 404 de la page
 * publique pour un slug inexistant (sans auth, sans donnees en base).
 *
 * Les tests marques `test.skip` necessitent :
 * - Une session authentifiee Supabase (storage state)
 * - Un portfolio cree en base pour l'utilisateur de test
 * - Pour certains tests : un portfolio publie avec slug connu
 *
 * COMMENT ACTIVER LES TESTS AUTHENTICATED :
 * ------------------------------------------
 * 1. Creer `tests/fixtures/auth.setup.ts` :
 *    - Connexion via supabase.auth.signInWithPassword avec user de test
 *    - page.context().storageState({ path: 'tests/fixtures/.auth/user.json' })
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
 *
 * NOTE SUBDOMAIN :
 *   Le test de redirection subdomain necessite une configuration DNS locale
 *   (ou un fichier /etc/hosts) et n'est pas executable en CI standard.
 *   Il est documente comme skip permanent avec prerequis explicite.
 *
 * REFERENCES :
 *   https://playwright.dev/docs/auth
 *   https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Acces public — tests executables sans auth
// ---------------------------------------------------------------------------

test.describe('Publication — Acces public (404)', () => {
  test('retourne 404 pour un slug inexistant', async ({ page }) => {
    const response = await page.goto('/portfolio/ce-slug-nexiste-pas-du-tout')
    // Next.js notFound() produit un statut 404
    expect(response?.status()).toBe(404)
  })

  test("un portfolio non publie n'est pas accessible", async ({ page }) => {
    // Le slug "brouillon" ne doit pas etre accessible publiquement :
    // - soit parce qu'il n'existe pas en base
    // - soit parce que published = false (notFound() est appele dans les deux cas)
    const response = await page.goto('/portfolio/brouillon')
    expect(response?.status()).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Flow de publication complet (skip : necessite auth + portfolio en base)
// ---------------------------------------------------------------------------

test.describe('Publication — Flow complet depuis l\'editeur', () => {
  test.skip('publication complete : editeur → slug → publier → portfolio live', async ({ page }) => {
    // PREREQUIS : session authentifiee, portfolio cree en base mais non publie
    // Etape 1 : aller sur l'editeur
    await page.goto('/editor')
    await expect(page.getByTestId('step-personal-info')).toBeVisible()

    // Etape 1 : remplir le titre (minimum requis)
    await page.getByTestId('input-title').fill('Tom Lefebvre')
    await page.getByTestId('step-next').click()

    // Etape 2 : passer les projets
    await expect(page.getByTestId('step-projects')).toBeVisible()
    await page.getByTestId('step-next').click()

    // Etape 3 : passer la personnalisation
    await expect(page.getByTestId('step-customization')).toBeVisible()
    await page.getByTestId('step-next').click()

    // Etape 4 : preview
    await expect(page.getByTestId('step-preview')).toBeVisible()
    await page.getByTestId('step-next').click()

    // Etape 5 : publication
    await expect(page.getByTestId('step-publish')).toBeVisible()
    await expect(page.getByTestId('slug-input')).toBeVisible()
    await expect(page.getByTestId('publish-btn')).toBeVisible()

    // Saisir un slug unique
    const uniqueSlug = `test-pub-${Date.now()}`
    await page.getByTestId('slug-input').fill(uniqueSlug)

    // Attendre la verification de disponibilite (debounce ~400ms + reponse API)
    await expect(page.getByText(/Disponible/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('publish-btn')).toBeEnabled()

    // Publier
    await page.getByTestId('publish-btn').click()

    // Apres publication : redirection vers le portfolio public
    await expect(page).toHaveURL(new RegExp(`/portfolio/${uniqueSlug}`), { timeout: 10000 })

    // Le portfolio doit etre visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test.skip('affiche un message de succes apres publication', async ({ page }) => {
    // PREREQUIS : session authentifiee, portfolio cree en base mais non publie
    await page.goto('/editor')
    await page.getByTestId('input-title').fill('Tom Lefebvre')
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()

    const uniqueSlug = `test-success-${Date.now()}`
    await page.getByTestId('slug-input').fill(uniqueSlug)
    await expect(page.getByText(/Disponible/i)).toBeVisible({ timeout: 5000 })
    await page.getByTestId('publish-btn').click()

    // Un message de succes ou une notification doit apparaitre
    await expect(page.getByText(/publié|en ligne|succès/i)).toBeVisible({ timeout: 10000 })
  })

  test.skip('affiche une erreur si le slug est deja pris', async ({ page }) => {
    // PREREQUIS : session authentifiee, un portfolio avec slug "slug-deja-pris" publie en base
    await page.goto('/editor')
    await page.getByTestId('input-title').fill('Tom Lefebvre')
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()

    // Saisir un slug deja utilise
    await page.getByTestId('slug-input').fill('slug-deja-pris')

    // Attendre le retour de l'API de verification
    await expect(page.getByText(/déjà pris|indisponible/i)).toBeVisible({ timeout: 5000 })

    // Le bouton publier doit rester desactive
    await expect(page.getByTestId('publish-btn')).toBeDisabled()
  })

  test.skip('rejette un slug invalide (caracteres speciaux)', async ({ page }) => {
    // PREREQUIS : session authentifiee
    await page.goto('/editor')
    await page.getByTestId('input-title').fill('Tom Lefebvre')
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()
    await page.getByTestId('step-next').click()

    // Saisir un slug avec des caracteres interdits
    // Le composant StepPublish sanitize le slug (minuscules, tirets uniquement)
    await page.getByTestId('slug-input').fill('Mon Pseudo!')
    // La valeur doit etre sanitizee en "monpseudo"
    await expect(page.getByTestId('slug-input')).toHaveValue('monpseudo')
  })
})

// ---------------------------------------------------------------------------
// Portfolio publie accessible (skip : necessite portfolio publie en base)
// ---------------------------------------------------------------------------

test.describe('Publication — Portfolio live', () => {
  test.skip('le portfolio publie est accessible via /portfolio/[slug]', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "mon-portfolio" et template "minimal"
    await page.goto('/portfolio/mon-portfolio')
    await expect(page).toHaveURL('/portfolio/mon-portfolio')

    // Le titre de l'utilisateur doit etre affiche
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Les projets doivent etre affiches si presents
  })

  test.skip('le portfolio affiche le bon template choisi', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-minimal", template = "minimal"
    await page.goto('/portfolio/test-minimal')
    // Le template minimal utilise un fond clair (#FAFAFA)
    const bgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    )
    // Pas de fond sombre sur le template minimal
    expect(bgColor).not.toMatch(/rgb\(\s*[0-9]{1,2}\s*,\s*[0-9]{1,2}\s*,/)
  })

  test.skip('apres publication, le dashboard affiche le statut "En ligne"', async ({ page }) => {
    // PREREQUIS : session authentifiee, portfolio publie
    await page.goto('/dashboard')
    await expect(page.getByText(/en ligne/i)).toBeVisible()
    // L'URL du portfolio doit etre affichee dans le dashboard
    await expect(page.getByText(/vizly\.fr/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Depublication (skip : necessite auth + portfolio publie)
// ---------------------------------------------------------------------------

test.describe('Publication — Depublication', () => {
  test.skip('depublier un portfolio le rend inaccessible (404)', async ({ page }) => {
    // PREREQUIS : session authentifiee, portfolio publie avec slug "test-unpublish"
    // 1. Verifier que le portfolio est accessible
    let response = await page.goto('/portfolio/test-unpublish')
    expect(response?.status()).toBe(200)

    // 2. Aller dans le dashboard et depublier
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /depublier|hors ligne/i }).click()

    // Confirmer si une modale de confirmation apparait
    const confirmBtn = page.getByRole('button', { name: /confirmer|oui/i })
    if (await confirmBtn.isVisible({ timeout: 2000 })) {
      await confirmBtn.click()
    }

    // 3. Verifier que le portfolio est desormais en 404
    response = await page.goto('/portfolio/test-unpublish')
    expect(response?.status()).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Middleware subdomain (skip : necessite config DNS locale ou /etc/hosts)
// ---------------------------------------------------------------------------

test.describe('Publication — Redirection subdomain', () => {
  test.skip(
    'le middleware redirige [slug].vizly.fr vers /portfolio/[slug]',
    async ({ page }) => {
      // PREREQUIS : entree dans /etc/hosts : "127.0.0.1 monslug.vizly.fr"
      //             et NEXT_PUBLIC_APP_DOMAIN=vizly.fr dans .env.local
      //             Ce test ne peut pas tourner en CI standard sans config DNS.
      await page.goto('http://monslug.vizly.fr:3000/')
      await expect(page).toHaveURL(/\/portfolio\/monslug|monslug\.vizly\.fr/)
    }
  )
})
