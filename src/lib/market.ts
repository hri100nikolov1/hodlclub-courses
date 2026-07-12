/**
 * Market data for the trading simulator — CoinGecko, server-side only.
 *
 * Prices are cached for 60s via Next fetch revalidation. Trades execute at
 * the server-fetched price, never at a client-supplied one.
 */

export const SIM_COIN_IDS = [
  'bitcoin',
  'ethereum',
  'solana',
  'binancecoin',
  'ripple',
  'cardano',
  'dogecoin',
  'polkadot',
  'chainlink',
  'avalanche-2',
  'litecoin',
  'uniswap',
] as const

export type MarketCoin = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number | null
  market_cap: number
}

export async function getMarkets(): Promise<MarketCoin[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${SIM_COIN_IDS.join(',')}&order=market_cap_desc&sparkline=false`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.filter(
      (c): c is MarketCoin =>
        c && typeof c.id === 'string' && typeof c.current_price === 'number' && c.current_price > 0
    )
  } catch {
    return []
  }
}

export async function getCoinPrice(coinId: string): Promise<MarketCoin | null> {
  const markets = await getMarkets()
  return markets.find((c) => c.id === coinId) ?? null
}
