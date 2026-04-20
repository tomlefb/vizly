// =============================================================================
// railway/domains.ts — Gestion custom domains via l'API GraphQL Railway
// =============================================================================
//
// Railway gère les custom domains par service, avec auto-provisioning TLS
// (Let's Encrypt) dès que le DNS de l'user pointe sur le bon CNAME/A. On
// passe par 3 mutations/queries :
//   - customDomainCreate : enregistre le domaine côté Railway, retourne
//     un CustomDomain avec id + le DNS host à configurer (CNAME target)
//   - customDomainDelete : supprime par ID (pas par nom)
//   - customDomain(id) : lit le status (verified/pending + certStatus)
//
// Auth : Personal Access Token (header Authorization: Bearer <token>).
// Endpoint : https://backboard.railway.com/graphql/v2
//
// Les appels sont côté serveur uniquement (Server Actions, webhooks). Le
// token n'a aucune raison de fuiter côté client.

const RAILWAY_GRAPHQL_URL = 'https://backboard.railway.com/graphql/v2'

interface RailwayEnv {
  token: string
  projectId: string
  serviceId: string
  environmentId: string
}

function getEnv(): RailwayEnv {
  const token = process.env.RAILWAY_API_TOKEN
  const projectId = process.env.RAILWAY_PROJECT_ID
  const serviceId = process.env.RAILWAY_SERVICE_ID
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID
  if (!token || !projectId || !serviceId || !environmentId) {
    throw new Error(
      'Railway env incomplet : RAILWAY_API_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_SERVICE_ID et RAILWAY_ENVIRONMENT_ID doivent être définis.',
    )
  }
  return { token, projectId, serviceId, environmentId }
}

interface GraphqlResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

async function railwayFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const { token } = getEnv()
  const res = await fetch(RAILWAY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    // Railway Personal Tokens ne traversent pas le cache CDN ; no-store par
    // sécurité pour que les mutations ne soient jamais dédupliquées.
    cache: 'no-store',
  })

  const payload = (await res.json()) as GraphqlResponse<T>
  if (!res.ok || payload.errors?.length) {
    const message = payload.errors?.map((e) => e.message).join('; ') ?? `HTTP ${res.status}`
    throw new Error(`Railway GraphQL error: ${message}`)
  }
  if (!payload.data) {
    throw new Error('Railway GraphQL error: empty data')
  }
  return payload.data
}

export interface RailwayCustomDomain {
  id: string
  domain: string
  status: {
    verified: boolean
    certificateStatus: string | null
    dnsRecords: Array<{
      recordType: string
      hostlabel: string
      currentValue: string | null
      requiredValue: string
      status: string
    }>
  }
}

/**
 * Crée un custom domain sur le service Vizly. Railway initialise tout de
 * suite la demande de cert TLS ; `status.verified` restera `false` tant
 * que l'user n'aura pas configuré son DNS pour pointer sur le bon host.
 */
export async function addRailwayCustomDomain(domain: string): Promise<RailwayCustomDomain> {
  const { projectId, serviceId, environmentId } = getEnv()

  const query = `
    mutation CreateCustomDomain($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
        status {
          verified
          certificateStatus: certificateStatusDetailed
          dnsRecords {
            recordType
            hostlabel
            currentValue
            requiredValue
            status
          }
        }
      }
    }
  `

  const data = await railwayFetch<{ customDomainCreate: RailwayCustomDomain }>(query, {
    input: { domain, projectId, serviceId, environmentId },
  })

  return data.customDomainCreate
}

/**
 * Lit le status courant d'un custom domain (sa vérif DNS + son cert TLS).
 * Utile pour le bouton "Vérifier maintenant" côté UI : on re-query et on
 * bascule le status local en `verified` dès que Railway confirme.
 */
export async function getRailwayCustomDomainStatus(
  customDomainId: string,
): Promise<RailwayCustomDomain | null> {
  const { projectId } = getEnv()
  const query = `
    query GetCustomDomain($id: String!, $projectId: String!) {
      customDomain(id: $id, projectId: $projectId) {
        id
        domain
        status {
          verified
          certificateStatus: certificateStatusDetailed
          dnsRecords {
            recordType
            hostlabel
            currentValue
            requiredValue
            status
          }
        }
      }
    }
  `

  try {
    const data = await railwayFetch<{ customDomain: RailwayCustomDomain | null }>(query, {
      id: customDomainId,
      projectId,
    })
    return data.customDomain
  } catch (err) {
    // L'ID n'existe plus (domaine supprimé côté Railway manuellement) :
    // on remonte null, le caller décidera de clean la row locale.
    console.error('[railway] getCustomDomainStatus failed:', err)
    return null
  }
}

/**
 * Supprime un custom domain côté Railway. Appelé quand l'user retire son
 * domaine depuis la page /domaines, ou quand la sub tombe en free/cancel.
 */
export async function removeRailwayCustomDomain(customDomainId: string): Promise<boolean> {
  const query = `
    mutation DeleteCustomDomain($id: String!) {
      customDomainDelete(id: $id)
    }
  `

  try {
    const data = await railwayFetch<{ customDomainDelete: boolean }>(query, {
      id: customDomainId,
    })
    return data.customDomainDelete
  } catch (err) {
    console.error('[railway] customDomainDelete failed:', err)
    return false
  }
}
