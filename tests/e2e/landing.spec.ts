import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test("la page d'accueil se charge correctement", async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('le header contient la navigation', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
    // Le CTA "Créer mon portfolio" est présent dans le header ET dans le hero ;
    // on scope au header pour rester déterministe.
    await expect(nav.getByRole('link', { name: /créer mon portfolio/i })).toBeVisible()
  })

  test('la section tarifs est visible', async ({ page }) => {
    await page.goto('/')
    // Le plan Starter apparait comme h3 dans la section Pricing
    await expect(page.getByRole('heading', { name: /^starter$/i })).toBeVisible()
    await expect(page.getByText(/4,?99/)).toBeVisible()
  })

  test('le footer contient le copyright', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/2026/)).toBeVisible()
  })
})
