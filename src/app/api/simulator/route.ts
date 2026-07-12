import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { hasAnyCourseAccess } from '@/lib/access'
import { getMarkets } from '@/lib/market'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Не сте влезли' }, { status: 401 })
    if (!(await hasAnyCourseAccess(session))) {
      return Response.json({ error: 'Нямате достъп до симулатора' }, { status: 403 })
    }

    const [portfolio, market] = await Promise.all([
      prisma.simPortfolio.upsert({
        where: { userId: session.userId },
        create: { userId: session.userId },
        update: {},
        include: {
          holdings: { orderBy: { updatedAt: 'desc' } },
          trades: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      }),
      getMarkets(),
    ])

    const priceById = new Map(market.map((c) => [c.id, c.current_price]))

    const holdings = portfolio.holdings.map((h) => {
      const price = priceById.get(h.coinId) ?? null
      const value = price !== null ? h.amount * price : null
      const costBasis = h.amount * h.avgCostUsd
      return {
        coinId: h.coinId,
        symbol: h.symbol,
        name: h.name,
        image: h.image,
        amount: h.amount,
        avgCostUsd: h.avgCostUsd,
        priceUsd: price,
        valueUsd: value,
        pnlUsd: value !== null ? value - costBasis : null,
        pnlPct: value !== null && costBasis > 0 ? ((value - costBasis) / costBasis) * 100 : null,
      }
    })

    const holdingsValue = holdings.reduce((sum, h) => sum + (h.valueUsd ?? 0), 0)
    const totalValue = portfolio.cashUsd + holdingsValue
    const totalPnl = totalValue - portfolio.startUsd

    return Response.json({
      cashUsd: portfolio.cashUsd,
      startUsd: portfolio.startUsd,
      holdingsValueUsd: holdingsValue,
      totalValueUsd: totalValue,
      totalPnlUsd: totalPnl,
      totalPnlPct: (totalPnl / portfolio.startUsd) * 100,
      holdings,
      trades: portfolio.trades.map((t) => ({
        id: t.id,
        coinId: t.coinId,
        symbol: t.symbol,
        side: t.side,
        amount: t.amount,
        priceUsd: t.priceUsd,
        totalUsd: t.totalUsd,
        realizedPnlUsd: t.realizedPnlUsd,
        createdAt: t.createdAt,
      })),
      market,
      marketUnavailable: market.length === 0,
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}
