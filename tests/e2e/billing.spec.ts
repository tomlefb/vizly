import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Billing — Acces (tests executables sans auth)
// ---------------------------------------------------------------------------

test.describe('Billing — Acces', () => {
  test('redirige vers /login si non connecte', async ({ page }) => {
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige vers /login si non connecte (editor)', async ({ page }) => {
    await page.goto('/editor')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ---------------------------------------------------------------------------
// Billing — Page facturation
// Prerequis : utilisateur connecte avec plan free
// ---------------------------------------------------------------------------

test.describe('Billing — Page facturation (skip: necessite auth)', () => {
  test.skip('affiche le plan actuel "Gratuit" par defaut', async ({ page }) => {
    // Prerequis : session auth active avec user plan=free
    await page.goto('/billing')
    await expect(page.getByText('Plan Gratuit')).toBeVisible()
    await expect(page.getByText('Gratuit').first()).toBeVisible()
  })

  test.skip('affiche la limitation "Pas de mise en ligne" pour le plan free', async ({ page }) => {
    // Prerequis : session auth active avec user plan=free
    await page.goto('/billing')
    await expect(page.getByText('Pas de mise en ligne')).toBeVisible()
  })

  test.skip('affiche le bouton upgrade Starter pour un user free', async ({ page }) => {
    // Prerequis : session auth active avec user plan=free
    await page.goto('/billing')
    await expect(
      page.getByRole('button', { name: /Passer au Starter/i })
    ).toBeVisible()
  })

  test.skip('affiche le bouton upgrade Pro pour un user free', async ({ page }) => {
    // Prerequis : session auth active avec user plan=free
    await page.goto('/billing')
    await expect(
      page.getByRole('button', { name: /Passer au Pro/i })
    ).toBeVisible()
  })

  test.skip('le bouton "Gerer mon abonnement" est absent pour un user free', async ({ page }) => {
    // Prerequis : session auth active avec user plan=free
    // Le bouton billing portal n'apparait que pour starter et pro
    await page.goto('/billing')
    await expect(page.getByRole('button', { name: /Gerer mon abonnement/i })).not.toBeVisible()
  })

  test.skip('affiche la section Templates premium avec les 4 templates', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/billing')
    await expect(page.getByText('Templates premium')).toBeVisible()
    await expect(page.getByText('Creatif')).toBeVisible()
    await expect(page.getByText('Brutalist')).toBeVisible()
    await expect(page.getByText('Elegant')).toBeVisible()
    await expect(page.getByText('Bento')).toBeVisible()
  })

  test.skip('affiche le message "disponibles avec un abonnement" pour un user free', async ({ page }) => {
    // Prerequis : session auth active avec user plan=free
    await page.goto('/billing')
    await expect(
      page.getByText(/disponibles avec un abonnement Starter ou Pro/i)
    ).toBeVisible()
  })

  test.skip('les boutons acheter template ne sont PAS affiches pour un user free', async ({ page }) => {
    // Prerequis : session auth active avec user plan=free
    // canBuy = plan !== 'free' && !isPurchased — donc pas de bouton pour les free
    await page.goto('/billing')
    await expect(page.getByRole('button', { name: /Acheter.*2\.99/i })).not.toBeVisible()
  })

  test.skip('les boutons acheter template sont affiches pour un user Starter', async ({ page }) => {
    // Prerequis : session auth active avec user plan=starter
    await page.goto('/billing')
    // Au moins un bouton "Acheter (2.99 EUR)" doit etre visible pour les templates non achetes
    await expect(page.getByRole('button', { name: /Acheter \(2\.99 EUR\)/i }).first()).toBeVisible()
  })

  test.skip('un template deja achete affiche le badge "Achete" et pas de bouton achat', async ({ page }) => {
    // Prerequis : session auth active avec user ayant achete le template "creatif"
    await page.goto('/billing')
    await expect(page.getByText('Achete')).toBeVisible()
    // Le bouton achat ne doit pas apparaitre pour ce template
    const templateCard = page.locator('div').filter({ hasText: /Creatif/ }).first()
    await expect(templateCard.getByRole('button', { name: /Acheter/i })).not.toBeVisible()
  })

  test.skip('affiche le bouton "Gerer mon abonnement" pour un user Starter', async ({ page }) => {
    // Prerequis : session auth active avec user plan=starter
    await page.goto('/billing')
    await expect(
      page.getByRole('button', { name: /Gerer mon abonnement/i })
    ).toBeVisible()
  })

  test.skip('affiche le bouton "Gerer mon abonnement" pour un user Pro', async ({ page }) => {
    // Prerequis : session auth active avec user plan=pro
    await page.goto('/billing')
    await expect(
      page.getByRole('button', { name: /Gerer mon abonnement/i })
    ).toBeVisible()
  })

  test.skip('affiche le plan "Plan Pro" avec la couronne pour un user Pro', async ({ page }) => {
    // Prerequis : session auth active avec user plan=pro
    await page.goto('/billing')
    await expect(page.getByText('Plan Pro')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Billing — Bannieres de retour Stripe (URL params)
// Ces tests sont executables si la page /billing charge sans auth requise.
// Avec auth, les prerequis sont documentes.
// ---------------------------------------------------------------------------

test.describe('Billing — Bannieres checkout (skip: necessite auth)', () => {
  test.skip('?checkout=success affiche la banniere "Paiement confirme"', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/billing?checkout=success')
    await expect(page.getByText('Paiement confirme')).toBeVisible()
    await expect(
      page.getByText(/Ton abonnement est actif/i)
    ).toBeVisible()
  })

  test.skip('?checkout=cancel affiche la banniere "Paiement annule"', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/billing?checkout=cancel')
    await expect(page.getByText('Paiement annule')).toBeVisible()
    await expect(
      page.getByText(/Le paiement a ete annule/i)
    ).toBeVisible()
  })

  test.skip('sans parametre checkout, aucune banniere de statut n\'est affichee', async ({ page }) => {
    // Prerequis : session auth active
    await page.goto('/billing')
    await expect(page.getByText('Paiement confirme')).not.toBeVisible()
    await expect(page.getByText('Paiement annule')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Billing — Checkout Stripe
// Prerequis : auth + Stripe configuré en test mode (clés STRIPE_SECRET_KEY)
// ---------------------------------------------------------------------------

test.describe('Billing — Checkout Stripe (skip: necessite auth + Stripe test mode)', () => {
  test.skip('clic sur "Passer au Starter" redirige vers Stripe Checkout', async ({ page }) => {
    // Prerequis : user connecte plan=free, STRIPE_PRICE_STARTER configure
    await page.goto('/billing')
    await page.getByRole('button', { name: /Passer au Starter/i }).click()
    // Le bouton passe en etat loading ("Redirection...")
    await expect(page.getByText('Redirection...')).toBeVisible()
    // Puis redirection vers Stripe
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10_000 })
  })

  test.skip('clic sur "Passer au Pro" redirige vers Stripe Checkout', async ({ page }) => {
    // Prerequis : user connecte plan=free, STRIPE_PRICE_PRO configure
    await page.goto('/billing')
    await page.getByRole('button', { name: /Passer au Pro/i }).click()
    await expect(page.getByText('Redirection...')).toBeVisible()
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10_000 })
  })

  test.skip('clic sur "Acheter (2.99 EUR)" pour un template redirige vers Stripe', async ({ page }) => {
    // Prerequis : user connecte plan=starter, template non achete, prix template configure
    await page.goto('/billing')
    await page.getByRole('button', { name: /Acheter \(2\.99 EUR\)/i }).first().click()
    await expect(page.getByText('Redirection...')).toBeVisible()
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10_000 })
  })

  test.skip('"Gerer mon abonnement" redirige vers le Stripe Billing Portal', async ({ page }) => {
    // Prerequis : user connecte plan=starter ou pro, stripe_customer_id present en DB
    await page.goto('/billing')
    await page.getByRole('button', { name: /Gerer mon abonnement/i }).click()
    await expect(page.getByText('Redirection...')).toBeVisible()
    await page.waitForURL(/billing\.stripe\.com/, { timeout: 10_000 })
  })

  test.skip('un seul bouton peut etre en etat loading a la fois', async ({ page }) => {
    // Prerequis : user connecte plan=free
    // Tous les boutons sont disabled pendant qu'une action est en cours (loadingAction !== null)
    await page.goto('/billing')
    await page.getByRole('button', { name: /Passer au Starter/i }).click()
    await expect(page.getByRole('button', { name: /Passer au Pro/i })).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Billing — Publish flow depuis l'editeur
// Prerequis : auth + editeur rempli (steps 1-4 completes) pour acceder step 5
// ---------------------------------------------------------------------------

test.describe('Billing — Publish flow (skip: necessite auth + editeur rempli)', () => {
  test.skip('un user free voit "S\'abonner pour publier" a l\'etape 5', async ({ page }) => {
    // Prerequis : user connecte plan=free, editeur a l'etape Publier
    // Le bouton a data-testid="publish-btn" et aria-label="S'abonner pour publier"
    await page.goto('/editor')
    // Naviguer jusqu'a l'etape 5 (Publier) via les boutons de navigation
    // ...remplir les etapes 1-4...
    const publishBtn = page.getByTestId('publish-btn')
    await expect(publishBtn).toBeVisible()
    await expect(publishBtn).toHaveAttribute('aria-label', "S'abonner pour publier")
    await expect(page.getByText(/S'abonner pour publier/i)).toBeVisible()
  })

  test.skip('un user Starter voit "Publier mon portfolio" a l\'etape 5', async ({ page }) => {
    // Prerequis : user connecte plan=starter, editeur a l'etape Publier
    await page.goto('/editor')
    // Naviguer jusqu'a l'etape 5...
    const publishBtn = page.getByTestId('publish-btn')
    await expect(publishBtn).toHaveAttribute('aria-label', 'Publier mon portfolio')
    await expect(page.getByText('Publier mon portfolio')).toBeVisible()
  })

  test.skip('un template premium non achete bloque le bouton publier', async ({ page }) => {
    // Prerequis : user connecte plan=starter, template "creatif" selectionne et non achete
    // selectedTemplateNeedsPurchase=true desactive le bouton et affiche un warning
    await page.goto('/editor')
    // Naviguer jusqu'a l'etape 5 avec template premium non achete...
    await expect(
      page.getByText(/Le template selectionne est premium et n'a pas encore ete achete/i)
    ).toBeVisible()
    await expect(page.getByTestId('publish-btn')).toBeDisabled()
  })

  test.skip('le bouton publier est desactive si le slug est vide', async ({ page }) => {
    // Prerequis : user connecte, etape 5 atteinte
    await page.goto('/editor')
    // A l'etape 5, sans slug valide, le bouton est disabled (canPublish = false)
    const publishBtn = page.getByTestId('publish-btn')
    await expect(publishBtn).toBeDisabled()
  })

  test.skip('le champ slug sanitize les caracteres non autorises', async ({ page }) => {
    // Prerequis : user connecte, etape 5 atteinte
    await page.goto('/editor')
    const slugInput = page.getByTestId('slug-input')
    await slugInput.fill('Mon Portfolio 2026!')
    // Doit etre sanitize en "mon-portfolio-2026"
    await expect(slugInput).toHaveValue('monportfolio2026')
  })

  test.skip('le champ slug affiche "Disponible" quand le slug est libre', async ({ page }) => {
    // Prerequis : user connecte, etape 5 atteinte, API /api/check-slug operationnelle
    await page.goto('/editor')
    const slugInput = page.getByTestId('slug-input')
    await slugInput.fill('monportfolio')
    await expect(page.getByText('Disponible')).toBeVisible({ timeout: 2_000 })
  })
})

// ---------------------------------------------------------------------------
// Billing — Webhooks Stripe
// Prerequis : Stripe CLI + `stripe listen --forward-to localhost:3000/api/stripe-webhook`
// ---------------------------------------------------------------------------

test.describe('Billing — Webhooks Stripe (skip: necessite Stripe CLI)', () => {
  test.skip('checkout.session.completed (subscription) active le plan Starter en DB', async () => {
    // Prerequis : Stripe CLI actif, STRIPE_WEBHOOK_SECRET configure
    // Commande : stripe trigger checkout.session.completed
    // Verification : SELECT plan FROM users WHERE id = '<user_id>' -> 'starter'
    // Ce test necessite une logique de setup/teardown DB hors scope Playwright pur
  })

  test.skip('checkout.session.completed (payment) ajoute le template dans purchased_templates', async () => {
    // Prerequis : Stripe CLI actif, event avec metadata.type='template', metadata.templateId='creatif'
    // Verification : SELECT * FROM purchased_templates WHERE user_id = '<id>' AND template_id = 'creatif'
  })

  test.skip('customer.subscription.deleted desactive le portfolio (published = false)', async () => {
    // Prerequis : Stripe CLI actif, user avec abonnement actif
    // Commande : stripe trigger customer.subscription.deleted
    // Verification : SELECT published FROM portfolios WHERE user_id = '<id>' -> false
  })

  test.skip('invoice.payment_failed ne desactive pas immediatement le portfolio', async () => {
    // Prerequis : Stripe CLI actif
    // Commande : stripe trigger invoice.payment_failed
    // Verification : published reste true (grace period)
  })

  test.skip('customer.subscription.updated met a jour le plan en DB', async () => {
    // Prerequis : Stripe CLI actif
    // Commande : stripe trigger customer.subscription.updated
    // Verification : SELECT plan FROM users -> nouveau plan
  })
})
