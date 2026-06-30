import { prisma } from '@/lib/prisma'
import type { SessionPayload } from '@/lib/session'

/**
 * Entitlement helpers.
 *
 * - Course access: existing UserCourseAccess (unchanged).
 * - Book access: ProductAccess 'book' (or admin).
 * - AI access: bundled with FULL course access (moduleLimit = null), or granted
 *   standalone via ProductAccess 'ai' (or admin). Limited (downsell) buyers who
 *   only have the first N modules do NOT get the AI analyzer.
 */

export async function hasBookAccess(session: SessionPayload | null): Promise<boolean> {
  if (!session) return false
  if (session.role === 'admin') return true
  const pa = await prisma.productAccess.findUnique({
    where: { userId_product: { userId: session.userId, product: 'book' } },
  })
  return !!pa
}

export async function hasAIAccess(session: SessionPayload | null): Promise<boolean> {
  if (!session) return false
  if (session.role === 'admin') return true
  const [fullCourseCount, ai] = await Promise.all([
    prisma.userCourseAccess.count({ where: { userId: session.userId, moduleLimit: null } }),
    prisma.productAccess.findUnique({
      where: { userId_product: { userId: session.userId, product: 'ai' } },
    }),
  ])
  return fullCourseCount > 0 || !!ai
}

export async function hasAnyCourseAccess(session: SessionPayload | null): Promise<boolean> {
  if (!session) return false
  if (session.role === 'admin') return true
  const count = await prisma.userCourseAccess.count({ where: { userId: session.userId } })
  return count > 0
}
