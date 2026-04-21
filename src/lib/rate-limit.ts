import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Périodique cleanup : toutes les 10k requêtes, on purge les buckets expirés
// pour éviter une fuite mémoire lente. Pas de setInterval pour rester
// compatible edge runtime et éviter les handles persistants.
let opsSinceCleanup = 0

function cleanup(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitOptions {
  /** Unique identifier for the rate-limit window (eg. 'login', 'contact'). */
  key: string
  /** Max requests allowed per window. */
  limit: number
  /** Window duration in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Fixed-window in-memory rate limiter. Scoped per (key, identifier) pair.
 * In-memory = per-instance; not shared across Railway replicas. Suffisant
 * en single-instance ; migrable vers Upstash sans toucher aux call sites.
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  opsSinceCleanup++
  if (opsSinceCleanup > 10_000) {
    cleanup(now)
    opsSinceCleanup = 0
  }

  const bucketKey = `${options.key}:${identifier}`
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs
    buckets.set(bucketKey, { count: 1, resetAt })
    return { success: true, remaining: options.limit - 1, resetAt }
  }

  if (existing.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return {
    success: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  }
}

/**
 * Extract best-effort client identifier from headers set by Railway / reverse
 * proxies. Falls back to a shared bucket (single-tenant rate-limit) if no
 * header is present — safe default that errs on the side of protection.
 */
export function getClientIdentifier(request: Request | NextRequest): string {
  const reqHeaders =
    request instanceof Request ? request.headers : (request as NextRequest).headers
  const forwarded = reqHeaders.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = reqHeaders.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

/**
 * Server-Actions variant : lit les headers via next/headers. À utiliser
 * uniquement dans un contexte Server Action ou Server Component.
 */
export async function getActionClientIdentifier(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = h.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
