import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test("la page d'accueil se charge correctement", async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('le header contient la navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('link', { name: /créer mon portfolio/i })).toBeVisible()
  })

  test('la section tarifs est visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/starter/i)).toBeVisible()
    await expect(page.getByText(/4.99/i)).toBeVisible()
  })

  test('le footer contient le copyright', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/2026/)).toBeVisible()
  })
})
