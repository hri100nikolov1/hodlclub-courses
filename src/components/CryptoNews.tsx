type NewsItem = {
  id: string
  title: string
  url: string
  imageurl: string
  body: string
  source_info: { name: string; img: string }
  published_on: number
}

async function getNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=6&sortOrder=latest',
      { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.Data ?? []
  } catch {
    return []
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин. назад`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч. назад`
  return `${Math.floor(seconds / 86400)} дни назад`
}

export default async function CryptoNews() {
  const news = await getNews()

  if (news.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 text-lg">Последни новини</h2>
        <span className="text-xs text-gray-400">Крипто свят</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all duration-200"
          >
            {item.imageurl && (
              <div className="h-36 overflow-hidden bg-gray-100">
                <img
                  src={item.imageurl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-4 flex flex-col flex-1">
              <p className="text-xs text-indigo-600 font-medium mb-1">{item.source_info?.name}</p>
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-indigo-600 transition mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2 flex-1">{item.body}</p>
              <p className="text-xs text-gray-300 mt-3">{timeAgo(item.published_on)}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
