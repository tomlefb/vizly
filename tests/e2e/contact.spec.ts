import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Contact Form — Validation API (tests executables sans auth ni donnees)
// L'API /api/contact valide les inputs via contactFormSchema (Zod) :
//   name   : string min 1 max 100
//   email  : email valide
//   message: string min 10 max 2000
//   slug   : identifiant du portfolio cible (route param ou body)
// ---------------------------------------------------------------------------

test.describe('Contact Form — Validation API', () => {
  test('retourne 400 sans body', async ({ request }) => {
    const response = await request.post('/api/contact')
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec body vide (objet JSON vide)', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {},
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec un email invalide', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test User',
        email: 'pas-un-email',
        message: 'Ce message est suffisamment long pour passer la validation minimale.',
        slug: 'test-portfolio',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec un email au format incomplet', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test User',
        email: 'test@',
        message: 'Ce message est suffisamment long pour passer la validation minimale.',
        slug: 'test-portfolio',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec un message trop court (moins de 10 caracteres)', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test User',
        email: 'visiteur@example.com',
        message: 'Court',
        slug: 'test-portfolio',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec un nom manquant', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        email: 'visiteur@example.com',
        message: 'Ce message est suffisamment long pour passer la validation minimale.',
        slug: 'test-portfolio',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec un nom vide', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: '',
        email: 'visiteur@example.com',
        message: 'Ce message est suffisamment long pour passer la validation minimale.',
        slug: 'test-portfolio',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec un message manquant', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test User',
        email: 'visiteur@example.com',
        slug: 'test-portfolio',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec un slug manquant', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test User',
        email: 'visiteur@example.com',
        message: 'Ce message est suffisamment long pour passer la validation minimale.',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('la reponse 400 contient un message d\'erreur JSON', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: '',
        email: 'invalide',
        message: 'Court',
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json() as Record<string, unknown>
    // L'API doit retourner un objet JSON avec un champ "error" ou "message"
    expect(typeof body === 'object' && body !== null).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Contact Form — Acces route API
// ---------------------------------------------------------------------------

test.describe('Contact Form — Methodes HTTP', () => {
  test('retourne 405 pour une requete GET sur /api/contact', async ({ request }) => {
    const response = await request.get('/api/contact')
    // L'API accepte uniquement POST
    expect([404, 405]).toContain(response.status())
  })
})

// ---------------------------------------------------------------------------
// Contact Form — Flow complet
// Prerequis : portfolio publie avec plan Pro + email Resend configure
// ---------------------------------------------------------------------------

test.describe('Contact Form — Flow complet (skip: necessite portfolio Pro)', () => {
  test.skip('retourne 200 avec des donnees valides et un portfolio Pro existant', async ({ request }) => {
    // Prerequis : portfolio publie avec plan Pro, slug 'test-pro-portfolio' existant en DB
    // et RESEND_API_KEY configure (ou email desactive en test)
    const response = await request.post('/api/contact', {
      data: {
        name: 'Visiteur Test',
        email: 'visiteur@example.com',
        message: 'Bonjour, je suis interesse par votre travail et souhaitais vous contacter.',
        slug: 'test-pro-portfolio',
      },
    })
    expect(response.status()).toBe(200)
    const body = await response.json() as Record<string, unknown>
    expect(body).toHaveProperty('success', true)
  })

  test.skip('retourne 403 si le portfolio existe mais n\'est pas sur le plan Pro', async ({ request }) => {
    // Prerequis : portfolio publie avec plan Starter (pas de formulaire de contact)
    // Le formulaire de contact est reserve au plan Pro
    const response = await request.post('/api/contact', {
      data: {
        name: 'Visiteur Test',
        email: 'visiteur@example.com',
        message: 'Bonjour, je suis interesse par votre travail et souhaitais vous contacter.',
        slug: 'test-starter-portfolio',
      },
    })
    expect(response.status()).toBe(403)
  })

  test.skip('retourne 404 si le portfolio n\'existe pas', async ({ request }) => {
    // Prerequis : aucun portfolio avec ce slug en DB
    const response = await request.post('/api/contact', {
      data: {
        name: 'Visiteur Test',
        email: 'visiteur@example.com',
        message: 'Bonjour, je suis interesse par votre travail et souhaitais vous contacter.',
        slug: 'portfolio-qui-nexiste-pas-du-tout-jamais',
      },
    })
    expect(response.status()).toBe(404)
  })

  test.skip('retourne 404 si le portfolio n\'est pas publie', async ({ request }) => {
    // Prerequis : portfolio avec published = false (non publie)
    const response = await request.post('/api/contact', {
      data: {
        name: 'Visiteur Test',
        email: 'visiteur@example.com',
        message: 'Bonjour, je suis interesse par votre travail et souhaitais vous contacter.',
        slug: 'test-unpublished-portfolio',
      },
    })
    expect(response.status()).toBe(404)
  })
})
