type CoinPrice = {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  image: string
}

async function getPrices(): Promise<CoinPrice[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple&order=market_cap_desc&sparkline=false',
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default async function CryptoPrices() {
  const coins = await getPrices()
  if (coins.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-lg">Крипто пазар</h2>
        <span className="text-xs text-gray-400">Актуализира се на 5 мин.</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {coins.map((coin) => {
          const isPositive = coin.price_change_percentage_24h >= 0
          return (
            <div
              key={coin.id}
              className="flex flex-col items-center bg-gray-50 rounded-xl p-3 gap-2"
            >
              <img src={coin.image} alt={coin.name} className="w-8 h-8" />
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">{coin.symbol}</p>
                <p className="text-sm font-bold text-gray-900">${formatPrice(coin.current_price)}</p>
                <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {isPositive ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
