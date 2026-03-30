import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Settings — Acces (tests executables sans auth)
// ---------------------------------------------------------------------------

test.describe('Settings — Acces', () => {
  test('redirige vers /login si non connecte', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige vers /login si non connecte apres tentative directe', async ({ page }) => {
    // Verifier que la protection est active meme avec un parametre d'URL
    await page.goto('/settings?tab=danger')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ---------------------------------------------------------------------------
// Settings — Page parametres
// Prerequis : utilisateur connecte (session Supabase active)
// ---------------------------------------------------------------------------

test.describe('Settings — Page parametres (skip: necessite auth)', () => {
  test.skip('affiche le titre Parametres', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /Paramètres|Parametres/i })).toBeVisible()
  })

  test.skip('affiche le champ nom pre-rempli avec le nom du compte', async ({ page }) => {
    // Prerequis : session auth active avec user.name renseigne
    await page.goto('/settings')
    const nameInput = page.getByLabel(/nom/i)
    await expect(nameInput).toBeVisible()
    // Le champ doit etre pre-rempli (valeur non vide)
    await expect(nameInput).not.toHaveValue('')
  })

  test.skip("affiche l'email de l'utilisateur en lecture seule", async ({ page }) => {
    // Prerequis : session auth active
    // L'email est affiche mais non editable (gere par Supabase Auth)
    await page.goto('/settings')
    const emailField = page.getByLabel(/email/i)
    await expect(emailField).toBeVisible()
    await expect(emailField).toBeDisabled()
  })

  test.skip('affiche le plan actuel avec lien vers la page billing', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/settings')
    await expect(page.getByText(/Plan/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /billing|facturation|abonnement/i })).toBeVisible()
  })

  test.skip('le bouton sauvegarder est present', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/settings')
    await expect(
      page.getByRole('button', { name: /sauvegarder|enregistrer|mettre à jour/i })
    ).toBeVisible()
  })

  test.skip('permet de modifier le nom et affiche une confirmation', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/settings')
    const nameInput = page.getByLabel(/nom/i)
    await nameInput.clear()
    await nameInput.fill('Nouveau Nom Test')
    await page.getByRole('button', { name: /sauvegarder|enregistrer|mettre à jour/i }).click()
    // Un toast ou message de confirmation doit apparaitre
    await expect(page.getByText(/sauvegardé|mis à jour|succès/i)).toBeVisible()
  })

  test.skip('affiche la zone de danger avec bouton supprimer le compte', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/settings')
    // La zone de danger est toujours visible mais necessite une confirmation
    await expect(page.getByText(/zone de danger|danger/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /supprimer.*compte|delete.*account/i })
    ).toBeVisible()
  })

  test.skip('le bouton supprimer ouvre une modale de confirmation', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/settings')
    await page.getByRole('button', { name: /supprimer.*compte/i }).click()
    // Une modale de confirmation doit s'afficher
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(
      page.getByText(/cette action est irréversible|confirmation/i)
    ).toBeVisible()
  })

  test.skip('la modale de confirmation peut etre fermee avec Echap', async ({ page }) => {
    // Prerequis : session auth active + modale ouverte
    await page.goto('/settings')
    await page.getByRole('button', { name: /supprimer.*compte/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
