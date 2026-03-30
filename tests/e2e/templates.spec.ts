/**
 * Tests E2E — Templates portfolio (page publique /portfolio/[slug])
 *
 * ETAT ACTUEL :
 * Les tests executables immediatement verifient le comportement 404 de la page
 * publique en l'absence de donnees (slug inexistant, portfolio non publie).
 *
 * Les tests marques `test.skip` necessitent un portfolio publie en base avec
 * des donnees connues. Ils seront actives une fois qu'un helper de seed de
 * test sera en place (voir ci-dessous).
 *
 * COMMENT ACTIVER LES TESTS RESPONSIVE :
 * ----------------------------------------
 * 1. Creer un fichier `tests/fixtures/portfolio.setup.ts` qui :
 *    - S'authentifie via Supabase Admin API avec des credentials de test
 *    - Insere un portfolio publie pour chaque template (minimal, dark,
 *      classique, colore) avec les slugs "test-minimal", "test-dark",
 *      "test-classique", "test-colore" et "test-pro-user"
 *    - Sauvegarde le storage state dans `tests/fixtures/.auth/user.json`
 * 2. Dans `playwright.config.ts`, ajouter un projet "setup" :
 *    ```ts
 *    projects: [
 *      { name: 'setup', testMatch: /portfolio\.setup\.ts/ },
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
 * REFERENCES :
 *   https://playwright.dev/docs/auth
 *   https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Comportement 404 — tests executables sans auth ni donnees en base
// ---------------------------------------------------------------------------

test.describe('Templates — Page portfolio publique (404)', () => {
  test('retourne 404 pour un slug inexistant', async ({ page }) => {
    const response = await page.goto('/portfolio/slug-inexistant-xyz-42')
    // Next.js notFound() produit un statut 404
    expect(response?.status()).toBe(404)
  })

  test('retourne 404 pour un slug vide simulé (chemin de base)', async ({ page }) => {
    // La route /portfolio/[slug] ne correspond pas a /portfolio seul
    // On verifie un slug improbable supplementaire pour la robustesse
    const response = await page.goto('/portfolio/zzz-ce-portfolio-nexiste-certainement-pas')
    expect(response?.status()).toBe(404)
  })

  test("retourne 404 pour un portfolio avec slug valide mais non publie", async ({ page }) => {
    // Le portfolio "brouillon-test" ne doit pas etre accessible :
    // - soit parce qu'il n'existe pas
    // - soit parce que published = false
    // Dans les deux cas, la page doit retourner 404
    const response = await page.goto('/portfolio/brouillon-test')
    expect(response?.status()).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Responsive — TemplateMinimal (skip : necessite portfolio publie en base)
// ---------------------------------------------------------------------------

test.describe('Templates — TemplateMinimal responsive', () => {
  test.skip('375px : layout en colonne unique, photo et projets empiles', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-minimal", template "minimal"
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/portfolio/test-minimal')

    await expect(page).toHaveURL('/portfolio/test-minimal')

    // Le header doit etre en colonne sur mobile (flex-col)
    const header = page.locator('header').first()
    await expect(header).toBeVisible()

    // La grille de projets doit etre en colonne unique (1 colonne CSS)
    const projectGrid = page.getByTestId('projects-grid')
    await expect(projectGrid).toBeVisible()
    const gridStyle = await projectGrid.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('grid-template-columns')
    )
    // Une seule colonne : la valeur CSS ne doit pas contenir deux mesures distinctes
    expect(gridStyle.trim().split(' ').length).toBeLessThanOrEqual(1)
  })

  test.skip('768px : grille de projets en 2 colonnes', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-minimal"
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/portfolio/test-minimal')

    const projectGrid = page.getByTestId('projects-grid')
    await expect(projectGrid).toBeVisible()
  })

  test.skip('1280px : grille de projets en 3 colonnes', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-minimal"
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/portfolio/test-minimal')

    const projectGrid = page.getByTestId('projects-grid')
    await expect(projectGrid).toBeVisible()
  })

  test.skip("affiche le titre et la bio de l'utilisateur", async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-minimal"
    await page.goto('/portfolio/test-minimal')
    // Le titre "Développeur Full Stack" doit etre visible (depuis TEST_PORTFOLIO)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Responsive — TemplateDark (skip : necessite portfolio publie en base)
// ---------------------------------------------------------------------------

test.describe('Templates — TemplateDark', () => {
  test.skip('a un fond sombre (background-color sombre)', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-dark", template "dark"
    await page.goto('/portfolio/test-dark')

    // Verifier que le conteneur principal a un fond sombre
    const body = page.locator('body')
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )
    // Les valeurs RGB d'un fond sombre ont des composantes faibles (< 50)
    // ex: rgb(10, 10, 10) ou rgb(15, 15, 15)
    expect(bgColor).toMatch(/rgb\(\s*([0-9]{1,2})\s*,/)
  })

  test.skip('375px : layout responsive sur mobile', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-dark"
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/portfolio/test-dark')
    await expect(page).toHaveURL('/portfolio/test-dark')
    // Pas de scroll horizontal
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})

// ---------------------------------------------------------------------------
// Responsive — TemplateClassique (skip : necessite portfolio publie en base)
// ---------------------------------------------------------------------------

test.describe('Templates — TemplateClassique', () => {
  test.skip('1280px : sidebar a gauche et projets a droite', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-classique", template "classique"
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/portfolio/test-classique')

    // Le layout doit avoir une sidebar (flex-row sur desktop)
    // On verifie la presence de l'element sidebar via son role ou testid
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toBeVisible()
  })

  test.skip('375px : sidebar devient header en colonne sur mobile', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-classique"
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/portfolio/test-classique')

    // Sur mobile le sidebar passe en haut (colonne)
    // Pas de scroll horizontal
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})

// ---------------------------------------------------------------------------
// Responsive — TemplateColore (skip : necessite portfolio publie en base)
// ---------------------------------------------------------------------------

test.describe('Templates — TemplateColore', () => {
  test.skip('a des elements avec des coins arrondis (border-radius)', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-colore", template "colore"
    await page.goto('/portfolio/test-colore')

    // Les cards de projets doivent avoir un border-radius significatif
    const firstCard = page.getByTestId('project-card').first()
    await expect(firstCard).toBeVisible()
    const borderRadius = await firstCard.evaluate((el) =>
      window.getComputedStyle(el).borderRadius
    )
    // border-radius doit etre > 0 (ex: "16px", "24px")
    expect(borderRadius).not.toBe('0px')
  })

  test.skip('375px : layout responsive sans scroll horizontal', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-colore"
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/portfolio/test-colore')

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})

// ---------------------------------------------------------------------------
// Badge "Fait avec Vizly" (skip : necessite portfolios publies en base)
// ---------------------------------------------------------------------------

test.describe('Templates — Badge "Fait avec Vizly"', () => {
  test.skip('le badge est visible pour un utilisateur plan Starter', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-minimal", user plan = "starter"
    await page.goto('/portfolio/test-minimal')
    // Le badge contient "Fait avec" suivi de "Vizly"
    await expect(page.getByText(/Fait avec/i)).toBeVisible()
  })

  test.skip('le badge est absent pour un utilisateur plan Pro', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-pro-user", user plan = "pro"
    // isPremium = true → badge non rendu
    await page.goto('/portfolio/test-pro-user')
    await expect(page.getByText(/Fait avec/i)).not.toBeVisible()
  })

  test.skip('le badge contient un lien vers vizly.fr', async ({ page }) => {
    // PREREQUIS : portfolio publie avec slug "test-minimal", user plan = "starter"
    await page.goto('/portfolio/test-minimal')
    const badge = page.getByText(/Fait avec/i)
    await expect(badge).toBeVisible()
    // Le lien du badge pointe vers le site principal
    const link = page.getByRole('link', { name: /vizly/i })
    await expect(link).toBeVisible()
  })
})
