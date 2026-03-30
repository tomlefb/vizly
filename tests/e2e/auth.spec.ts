import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test('la page de connexion se charge correctement', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
  })

  test("la page d'inscription se charge correctement", async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible()
    await expect(page.getByLabel(/nom/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
  })

  test('lien vers inscription depuis la page de connexion', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /créer un compte/i }).click()
    await expect(page).toHaveURL('/register')
  })

  test("lien vers connexion depuis la page d'inscription", async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: /se connecter/i }).click()
    await expect(page).toHaveURL('/login')
  })

  test('affiche une erreur avec des identifiants invalides', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('invalid@test.com')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /se connecter/i }).click()
    // Should show an error message
    await expect(page.getByText(/erreur|invalide/i)).toBeVisible()
  })
})
