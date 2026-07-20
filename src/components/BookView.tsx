'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const FlipBook = dynamic(() => import('@/components/FlipBook'), { ssr: false })

type Chapter = {
  id: string
  title: string
  audioUrl: string | null
  order: number
}

type Props = {
  title: string
  description: string | null
  coverUrl: string | null
  pdfUrl: string | null
  bonusPdfUrl?: string | null
  chapters: Chapter[]
}

export default function BookView({ title, description, coverUrl, pdfUrl, bonusPdfUrl, chapters }: Props) {
  const [tab, setTab] = useState<'read' | 'listen'>('read')
  const playable = chapters.filter((c) => c.audioUrl)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(playable[0]?.id ?? null)
  const activeChapter = playable.find((c) => c.id === activeChapterId) ?? null

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {coverUrl && (
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <Image
              src={coverUrl}
              alt={title}
              width={180}
              height={255}
              className="rounded-xl shadow-lg w-44 h-auto object-contain"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Електронна книга + аудиокнига</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
          {description && <p className="text-gray-600 leading-relaxed">{description}</p>}
        </div>
      </div>

      {/* Bonus checklist */}
      {bonusPdfUrl && (
        <div className="mb-6 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-2xl">📝</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-0.5">Бонус</p>
              <h3 className="font-bold text-gray-900">D.E.E.P. чеклист за печат</h3>
              <p className="text-sm text-gray-500">Принтируем чеклист, който да ползваш при анализ на проекти.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <a
              href={bonusPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
            >
              Отвори
            </a>
            <a
              href={bonusPdfUrl}
              download="Криптогенезис-DEEP-чеклист.pdf"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/15 text-sm font-semibold transition"
            >
              ⬇ Свали
            </a>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-200">
        <button
          onClick={() => setTab('read')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
            tab === 'read' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📖 Чети
        </button>
        <button
          onClick={() => setTab('listen')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
            tab === 'listen' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          🎧 Слушай
        </button>
      </div>

      {/* Read tab */}
      {tab === 'read' && (
        <div>
          {pdfUrl ? (
            <FlipBook pdfUrl={pdfUrl} title={title} />
          ) : (
            <p className="text-gray-500 text-center py-16">Текстовият вариант ще бъде наличен скоро.</p>
          )}
        </div>
      )}

      {/* Listen tab */}
      {tab === 'listen' && (
        <div>
          {playable.length === 0 ? (
            <div className="bg-amber-50 border border-dashed border-amber-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">🎙️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Аудиокнигата се записва в момента</h3>
              <p className="text-amber-700 text-sm">Скоро ще можеш да слушаш главите тук. Междувременно можеш да четеш книгата от таб „Чети“.</p>
            </div>
          ) : (
            <div className={playable.length > 1 ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}>
              {/* Player */}
              <div className={playable.length > 1 ? 'lg:col-span-2' : ''}>
                {activeChapter?.audioUrl ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                      <iframe
                        key={activeChapter.id}
                        src={activeChapter.audioUrl}
                        title={activeChapter.title}
                        loading="lazy"
                        allow="autoplay; encrypted-media"
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 'none' }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Избери глава, за да слушаш.</p>
                )}
                {activeChapter && playable.length > 1 && (
                  <h3 className="font-semibold text-gray-900 mt-3">{activeChapter.title}</h3>
                )}
              </div>

              {/* Chapter list — only when there are multiple chapters */}
              {playable.length > 1 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 mb-3">Глави</h3>
                  {playable.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChapterId(c.id)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition ${
                        c.id === activeChapterId
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        c.id === activeChapterId ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{c.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-8">
        ⚠️ Образователно издание — не представлява финансов съвет.
      </p>
    </div>
  )
}
