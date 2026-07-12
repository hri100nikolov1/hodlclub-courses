import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { hasAnyCourseAccess } from '@/lib/access'
import { getCoinPrice } from '@/lib/market'

const MIN_TRADE_USD = 1
// Below this residual value a sold-down position is closed entirely,
// so float rounding can't leave "dust" holdings behind.
const DUST_USD = 0.01

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Не сте влезли' }, { status: 401 })
    if (!(await hasAnyCourseAccess(session))) {
      return Response.json({ error: 'Нямате достъп до симулатора' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const coinId = typeof body?.coinId === 'string' ? body.coinId : ''
    const side = body?.side === 'buy' || body?.side === 'sell' ? body.side : null
    const sellAll = body?.sellAll === true
    const amountUsd = typeof body?.amountUsd === 'number' ? body.amountUsd : NaN

    if (!coinId || !side) {
      return Response.json({ error: 'Невалидни данни' }, { status: 400 })
    }
    if (!sellAll && (!Number.isFinite(amountUsd) || amountUsd < MIN_TRADE_USD || amountUsd > 1e12)) {
      return Response.json(
        { error: `Минималната сделка е $${MIN_TRADE_USD}` },
        { status: 400 }
      )
    }

    const coin = await getCoinPrice(coinId)
    if (!coin) {
      return Response.json(
        { error: 'Цената в момента не е налична. Опитайте отново след минута.' },
        { status: 503 }
      )
    }
    const price = coin.current_price

    const result = await prisma.$transaction(async (tx) => {
      const portfolio = await tx.simPortfolio.upsert({
        where: { userId: session.userId },
        create: { userId: session.userId },
        update: {},
      })

      if (side === 'buy') {
        if (amountUsd > portfolio.cashUsd + 1e-9) {
          return { error: 'Недостатъчен наличен кеш' }
        }
        const qty = amountUsd / price
        const existing = await tx.simHolding.findUnique({
          where: { portfolioId_coinId: { portfolioId: portfolio.id, coinId } },
        })
        if (existing) {
          const newAmount = existing.amount + qty
          const newAvg = (existing.amount * existing.avgCostUsd + amountUsd) / newAmount
          await tx.simHolding.update({
            where: { id: existing.id },
            data: { amount: newAmount, avgCostUsd: newAvg },
          })
        } else {
          await tx.simHolding.create({
            data: {
              portfolioId: portfolio.id,
              coinId,
              symbol: coin.symbol,
              name: coin.name,
              image: coin.image,
              amount: qty,
              avgCostUsd: price,
            },
          })
        }
        await tx.simPortfolio.update({
          where: { id: portfolio.id },
          data: { cashUsd: portfolio.cashUsd - amountUsd },
        })
        const trade = await tx.simTrade.create({
          data: {
            portfolioId: portfolio.id,
            coinId,
            symbol: coin.symbol,
            side,
            amount: qty,
            priceUsd: price,
            totalUsd: amountUsd,
          },
        })
        return { trade }
      }

      // sell
      const holding = await tx.simHolding.findUnique({
        where: { portfolioId_coinId: { portfolioId: portfolio.id, coinId } },
      })
      if (!holding || holding.amount <= 0) {
        return { error: 'Нямате позиция в тази монета' }
      }
      let qty = sellAll ? holding.amount : amountUsd / price
      if (qty > holding.amount * (1 + 1e-9)) {
        return { error: 'Позицията ви е по-малка от заявената сума' }
      }
      qty = Math.min(qty, holding.amount)

      const proceeds = qty * price
      const realized = (price - holding.avgCostUsd) * qty
      const remaining = holding.amount - qty

      if (remaining * price < DUST_USD) {
        await tx.simHolding.delete({ where: { id: holding.id } })
      } else {
        await tx.simHolding.update({
          where: { id: holding.id },
          data: { amount: remaining },
        })
      }
      await tx.simPortfolio.update({
        where: { id: portfolio.id },
        data: { cashUsd: portfolio.cashUsd + proceeds },
      })
      const trade = await tx.simTrade.create({
        data: {
          portfolioId: portfolio.id,
          coinId,
          symbol: coin.symbol,
          side,
          amount: qty,
          priceUsd: price,
          totalUsd: proceeds,
          realizedPnlUsd: realized,
        },
      })
      return { trade }
    })

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 400 })
    }
    return Response.json({ ok: true, tradeId: result.trade.id })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}
