import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { hasAnyCourseAccess } from '@/lib/access'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Не сте влезли' }, { status: 401 })
    if (!(await hasAnyCourseAccess(session))) {
      return Response.json({ error: 'Нямате достъп до симулатора' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      const portfolio = await tx.simPortfolio.upsert({
        where: { userId: session.userId },
        create: { userId: session.userId },
        update: {},
      })
      await tx.simHolding.deleteMany({ where: { portfolioId: portfolio.id } })
      await tx.simTrade.deleteMany({ where: { portfolioId: portfolio.id } })
      await tx.simPortfolio.update({
        where: { id: portfolio.id },
        data: { cashUsd: portfolio.startUsd },
      })
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}
