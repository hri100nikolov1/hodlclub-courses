'use client'

import { useCallback, useEffect, useState } from 'react'

type Holding = {
  coinId: string
  symbol: string
  name: string
  image: string | null
  amount: number
  avgCostUsd: number
  priceUsd: number | null
  valueUsd: number | null
  pnlUsd: number | null
  pnlPct: number | null
}

type Trade = {
  id: string
  coinId: string
  symbol: string
  side: 'buy' | 'sell'
  amount: number
  priceUsd: number
  totalUsd: number
  realizedPnlUsd: number | null
  createdAt: string
}

type MarketCoin = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number | null
}

type SimState = {
  cashUsd: number
  startUsd: number
  holdingsValueUsd: number
  totalValueUsd: number
  totalPnlUsd: number
  totalPnlPct: number
  holdings: Holding[]
  trades: Trade[]
  market: MarketCoin[]
  marketUnavailable: boolean
}

function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtCoin(n: number): string {
  if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

function PnlText({ value, pct }: { value: number | null; pct?: number | null }) {
  if (value === null) return <span className="text-gray-400">—</span>
  const positive = value >= 0
  return (
    <span className={positive ? 'text-green-600' : 'text-red-500'}>
      {positive ? '+' : '−'}{fmtUsd(Math.abs(value))}
      {pct !== undefined && pct !== null && (
        <span className="text-xs ml-1 opacity-80">({fmtPct(pct)})</span>
      )}
    </span>
  )
}

export default function SimulatorClient() {
  const [data, setData] = useState<SimState | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Trade modal state
  const [tradeCoin, setTradeCoin] = useState<MarketCoin | null>(null)
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amountInput, setAmountInput] = useState('')
  const [sellAll, setSellAll] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tradeError, setTradeError] = useState('')

  const [confirmReset, setConfirmReset] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/simulator')
      if (!res.ok) throw new Error()
      setData(await res.json())
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  function openTrade(coin: MarketCoin, initialSide: 'buy' | 'sell') {
    setTradeCoin(coin)
    setSide(initialSide)
    setAmountInput('')
    setSellAll(false)
    setTradeError('')
  }

  const holdingForTrade = tradeCoin
    ? data?.holdings.find((h) => h.coinId === tradeCoin.id) ?? null
    : null

  function setQuickAmount(fraction: number) {
    if (!data || !tradeCoin) return
    if (side === 'buy') {
      setSellAll(false)
      setAmountInput((Math.floor(data.cashUsd * fraction * 100) / 100).toFixed(2))
    } else {
      const positionValue = (holdingForTrade?.amount ?? 0) * tradeCoin.current_price
      if (fraction === 1) {
        setSellAll(true)
        setAmountInput(positionValue.toFixed(2))
      } else {
        setSellAll(false)
        setAmountInput((Math.floor(positionValue * fraction * 100) / 100).toFixed(2))
      }
    }
  }

  async function submitTrade() {
    if (!tradeCoin || submitting) return
    const amountUsd = parseFloat(amountInput)
    if (!sellAll && (!Number.isFinite(amountUsd) || amountUsd < 1)) {
      setTradeError('Въведете сума от поне $1')
      return
    }
    setSubmitting(true)
    setTradeError('')
    try {
      const res = await fetch('/api/simulator/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          side === 'sell' && sellAll
            ? { coinId: tradeCoin.id, side, sellAll: true }
            : { coinId: tradeCoin.id, side, amountUsd }
        ),
      })
      const json = await res.json()
      if (!res.ok) {
        setTradeError(json.error || 'Грешка при изпълнение на сделката')
      } else {
        setTradeCoin(null)
        await load()
      }
    } catch {
      setTradeError('Грешка при връзка със сървъра')
    } finally {
      setSubmitting(false)
    }
  }

  async function resetPortfolio() {
    setConfirmReset(false)
    await fetch('/api/simulator/reset', { method: 'POST' })
    await load()
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <h3 className="text-gray-700 font-medium mb-1">Симулаторът не може да се зареди</h3>
        <p className="text-gray-400 text-sm mb-4">Проверете връзката и опитайте отново.</p>
        <button
          onClick={load}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white"
        >
          Опитай пак
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-100 rounded w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  const estQty = tradeCoin && amountInput
    ? parseFloat(amountInput) / tradeCoin.current_price
    : null

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gold mb-2">HODLClub</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Търговски симулатор</h1>
            <p className="text-gray-500 mt-2">
              Упражнявай покупки и продажби с виртуални пари и реални пазарни цени — без никакъв риск.
            </p>
          </div>
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Изтриване на всички сделки?</span>
              <button
                onClick={resetPortfolio}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-600"
              >
                Да, нулирай
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600"
              >
                Отказ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 transition"
            >
              ↺ Нулирай портфейла
            </button>
          )}
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg px-3 py-1.5">
          🎓 Учебна среда — парите са виртуални (започваш с {fmtUsd(data.startUsd)}), не се търгува с реални средства.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Обща стойност</p>
          <p className="text-2xl font-bold text-gray-900">{fmtUsd(data.totalValueUsd)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Наличен кеш</p>
          <p className="text-2xl font-bold text-gray-900">{fmtUsd(data.cashUsd)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">В позиции</p>
          <p className="text-2xl font-bold text-gray-900">{fmtUsd(data.holdingsValueUsd)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Общ резултат</p>
          <p className="text-2xl font-bold">
            <PnlText value={data.totalPnlUsd} pct={data.totalPnlPct} />
          </p>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="font-bold text-gray-900 text-lg mb-4">Моите позиции</h2>
        {data.holdings.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Нямаш отворени позиции. Избери монета от пазара по-долу и направи първата си покупка.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="py-2 pr-3">Монета</th>
                  <th className="py-2 px-3">Количество</th>
                  <th className="py-2 px-3">Ср. цена</th>
                  <th className="py-2 px-3">Тек. цена</th>
                  <th className="py-2 px-3">Стойност</th>
                  <th className="py-2 px-3">P&L</th>
                  <th className="py-2 pl-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((h) => {
                  const marketCoin = data.market.find((c) => c.id === h.coinId)
                  return (
                    <tr key={h.coinId} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          {h.image && <img src={h.image} alt={h.name} className="w-6 h-6" />}
                          <div>
                            <p className="font-semibold text-gray-900">{h.name}</p>
                            <p className="text-xs text-gray-400 uppercase">{h.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-700">{fmtCoin(h.amount)}</td>
                      <td className="py-3 px-3 text-gray-700">{fmtUsd(h.avgCostUsd)}</td>
                      <td className="py-3 px-3 text-gray-700">{fmtUsd(h.priceUsd)}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900">{fmtUsd(h.valueUsd)}</td>
                      <td className="py-3 px-3 font-medium">
                        <PnlText value={h.pnlUsd} pct={h.pnlPct} />
                      </td>
                      <td className="py-3 pl-3 text-right">
                        {marketCoin && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openTrade(marketCoin, 'buy')}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700"
                            >
                              Купи
                            </button>
                            <button
                              onClick={() => openTrade(marketCoin, 'sell')}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-600"
                            >
                              Продай
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Market */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">Пазар</h2>
          <span className="text-xs text-gray-400">Цените се обновяват на ~1 мин.</span>
        </div>
        {data.marketUnavailable ? (
          <p className="text-gray-400 text-sm">
            Пазарните данни в момента не са налични. Опитай отново след минута.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.market.map((coin) => {
              const change = coin.price_change_percentage_24h
              const positive = (change ?? 0) >= 0
              return (
                <div key={coin.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{coin.name}</p>
                    <p className="text-xs text-gray-500">
                      ${coin.current_price.toLocaleString('en-US', { maximumFractionDigits: coin.current_price >= 1 ? 2 : 6 })}
                      {change !== null && (
                        <span className={`ml-1.5 font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
                          {positive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => openTrade(coin, 'buy')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white flex-shrink-0"
                  >
                    Търгувай
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Trade history */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4">История на сделките</h2>
        {data.trades.length === 0 ? (
          <p className="text-gray-400 text-sm">Все още нямаш сделки.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="py-2 pr-3">Дата</th>
                  <th className="py-2 px-3">Тип</th>
                  <th className="py-2 px-3">Монета</th>
                  <th className="py-2 px-3">Количество</th>
                  <th className="py-2 px-3">Цена</th>
                  <th className="py-2 px-3">Сума</th>
                  <th className="py-2 pl-3">Реализиран P&L</th>
                </tr>
              </thead>
              <tbody>
                {data.trades.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 pr-3 text-gray-500 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${t.side === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {t.side === 'buy' ? 'Покупка' : 'Продажба'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 uppercase font-medium">{t.symbol}</td>
                    <td className="py-2.5 px-3 text-gray-700">{fmtCoin(t.amount)}</td>
                    <td className="py-2.5 px-3 text-gray-700">{fmtUsd(t.priceUsd)}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{fmtUsd(t.totalUsd)}</td>
                    <td className="py-2.5 pl-3 font-medium">
                      {t.realizedPnlUsd === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <PnlText value={t.realizedPnlUsd} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade modal */}
      {tradeCoin && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => !submitting && setTradeCoin(null)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <img src={tradeCoin.image} alt={tradeCoin.name} className="w-10 h-10" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{tradeCoin.name}</h3>
                <p className="text-sm text-gray-500">
                  ${tradeCoin.current_price.toLocaleString('en-US', { maximumFractionDigits: tradeCoin.current_price >= 1 ? 2 : 6 })}
                </p>
              </div>
              <button
                onClick={() => setTradeCoin(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Затвори"
              >
                ✕
              </button>
            </div>

            {/* Side toggle */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => { setSide('buy'); setSellAll(false); setTradeError('') }}
                className={`py-2 rounded-xl text-sm font-semibold transition ${side === 'buy' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
              >
                Купи
              </button>
              <button
                onClick={() => { setSide('sell'); setSellAll(false); setTradeError('') }}
                className={`py-2 rounded-xl text-sm font-semibold transition ${side === 'sell' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
              >
                Продай
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-1.5">
              {side === 'buy'
                ? <>Наличен кеш: <span className="font-semibold text-gray-900">{fmtUsd(data.cashUsd)}</span></>
                : <>Позиция: <span className="font-semibold text-gray-900">{holdingForTrade ? `${fmtCoin(holdingForTrade.amount)} ${holdingForTrade.symbol.toUpperCase()} (${fmtUsd(holdingForTrade.amount * tradeCoin.current_price)})` : 'няма'}</span></>}
            </p>

            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setSellAll(false); setTradeError('') }}
                placeholder="Сума в USD"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-7 pr-3 text-gray-900 text-sm focus:outline-none focus:border-indigo-300"
              />
            </div>

            <div className="flex gap-2 mb-4">
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <button
                  key={f}
                  onClick={() => setQuickAmount(f)}
                  className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-50 transition"
                >
                  {f === 1 ? 'Макс' : `${f * 100}%`}
                </button>
              ))}
            </div>

            {estQty !== null && Number.isFinite(estQty) && estQty > 0 && (
              <p className="text-xs text-gray-500 mb-4">
                ≈ {fmtCoin(estQty)} {tradeCoin.symbol.toUpperCase()} по текущата цена
              </p>
            )}

            {tradeError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{tradeError}</p>
            )}

            <button
              onClick={submitTrade}
              disabled={submitting || (side === 'sell' && !holdingForTrade)}
              className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 ${side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {submitting
                ? 'Изпълнява се…'
                : side === 'buy'
                  ? `Купи ${tradeCoin.symbol.toUpperCase()}`
                  : `Продай ${tradeCoin.symbol.toUpperCase()}`}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-3">
              Сделката се изпълнява по актуалната сървърна цена. Виртуални средства — само с учебна цел.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
