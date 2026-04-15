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

  test('/login ne contient pas de checkbox CGU et le bouton Google est enabled', async ({ page }) => {
    await page.goto('/login')
    // No checkbox anywhere on the login page anymore
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    // Google OAuth button is clickable immediately
    await expect(page.getByRole('button', { name: /google/i })).toBeEnabled()
  })

  test('/register affiche la mention légale et les liens CGU/confidentialité', async ({ page }) => {
    await page.goto('/register')
    // No more CGU checkbox — replaced by a textual notice covering both flows
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    // The legal notice paragraph is visible
    await expect(page.getByText(/en créant un compte/i)).toBeVisible()
    // Both legal links are present and open the right pages in new tabs
    const cguLink = page.getByRole('link', { name: /conditions générales/i })
    const privacyLink = page.getByRole('link', { name: /politique de confidentialité/i })
    await expect(cguLink).toHaveAttribute('href', '/legal/cgu')
    await expect(privacyLink).toHaveAttribute('href', '/legal/confidentialite')
  })

  test('OAuth Google depuis /register préserve plan & interval via next', async ({ page }) => {
    let capturedAuthorizeUrl: string | null = null

    // Intercept Supabase's OAuth authorize endpoint and inspect the
    // redirect_to query param (which is what signInWithOAuth sends).
    // Respond with a no-op 200 to keep the test from hitting Google.
    await page.route('**/auth/v1/authorize*', async (route) => {
      capturedAuthorizeUrl = route.request().url()
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'intercepted',
      })
    })

    await page.goto('/register?plan=pro&interval=yearly')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /google/i }).click()

    await expect.poll(() => capturedAuthorizeUrl, { timeout: 5000 }).not.toBeNull()

    const authorizeUrl = new URL(capturedAuthorizeUrl!)
    const redirectTo = authorizeUrl.searchParams.get('redirect_to')
    expect(redirectTo).toBeTruthy()

    const callbackUrl = new URL(redirectTo!)
    expect(callbackUrl.pathname).toBe('/auth/callback')
    expect(callbackUrl.searchParams.get('next')).toBe('/dashboard?plan=pro&interval=yearly')
  })
})
