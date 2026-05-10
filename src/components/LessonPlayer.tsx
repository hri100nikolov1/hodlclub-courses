'use client'

import { useState } from 'react'

type Lesson = {
  id: string
  title: string
  videoUrl: string | null
  order: number
}

function getEmbedUrl(url: string): string {
  if (!url) return ''
  if (url.includes('youtube.com/embed/')) return url
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  return url
}

function isGoogleDrive(url: string): boolean {
  return url.includes('drive.google.com')
}

export default function LessonPlayer({ lessons }: { lessons: Lesson[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeLesson = lessons[activeIndex]
  const embedUrl = activeLesson.videoUrl ? getEmbedUrl(activeLesson.videoUrl) : null

  return (
    <div className="space-y-4">
      {/* Video Player */}
      {embedUrl ? (
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg">
          <div className="relative" style={{ paddingTop: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={activeLesson.title}
            />
            {/* Покрива бутона за сваляне на Google Drive */}
            {activeLesson.videoUrl && isGoogleDrive(activeLesson.videoUrl) && (
              <div
                className="absolute top-0 right-0 z-10"
                style={{ width: '220px', height: '50px', background: '#000' }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-2xl flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p>Видеото ще бъде добавено скоро</p>
          </div>
        </div>
      )}

      {/* Active Lesson Title */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          {activeIndex + 1}. {activeLesson.title}
        </h2>
        <span className="text-sm text-gray-400">{activeIndex + 1} / {lessons.length}</span>
      </div>

      {/* Lessons List (playlist) */}
      {lessons.length > 1 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 px-4 pt-3 pb-2 uppercase tracking-wide">
            Уроци в този модул
          </p>
          <div className="divide-y divide-gray-100">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => setActiveIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                  index === activeIndex
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-white text-gray-700'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  index === activeIndex ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {index === activeIndex ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  ) : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                  {!lesson.videoUrl && (
                    <p className="text-xs text-gray-400">Скоро</p>
                  )}
                </div>
                {index === activeIndex && (
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Сега
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {lessons.length > 1 && (
        <div className="flex gap-3">
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Предишен урок
          </button>
          <button
            onClick={() => setActiveIndex(Math.min(lessons.length - 1, activeIndex + 1))}
            disabled={activeIndex === lessons.length - 1}
            className="flex-1 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-700 font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1"
          >
            Следващ урок
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
