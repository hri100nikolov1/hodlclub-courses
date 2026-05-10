'use client'

import { useState } from 'react'

type Lesson = {
  id: string
  title: string
  videoUrl: string | null
  order: number
}

type Props = {
  lessons: Lesson[]
  completedLessonIds: string[]
  moduleId: string
  courseId: string
  nextModuleId?: string
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

export default function LessonPlayer({
  lessons,
  completedLessonIds,
  moduleId,
  courseId,
  nextModuleId,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedLessonIds))
  const [loading, setLoading] = useState(false)

  const activeLesson = lessons[activeIndex]
  const embedUrl = activeLesson.videoUrl ? getEmbedUrl(activeLesson.videoUrl) : null
  const isCurrentDone = completed.has(activeLesson.id)
  const allDone = lessons.every((l) => completed.has(l.id))

  async function handleComplete() {
    setLoading(true)
    try {
      const res = await fetch('/api/lesson-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: activeLesson.id }),
      })
      if (res.ok) {
        const newCompleted = new Set(completed)
        newCompleted.add(activeLesson.id)
        setCompleted(newCompleted)

        // If there's a next lesson in this module, go to it
        if (activeIndex < lessons.length - 1) {
          setTimeout(() => setActiveIndex(activeIndex + 1), 600)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUncomplete() {
    setLoading(true)
    try {
      const res = await fetch('/api/lesson-progress', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: activeLesson.id }),
      })
      if (res.ok) {
        const newCompleted = new Set(completed)
        newCompleted.delete(activeLesson.id)
        setCompleted(newCompleted)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
            {activeLesson.videoUrl && isGoogleDrive(activeLesson.videoUrl) && (
              <div
                className="absolute top-0 right-0 z-10 flex items-center justify-center"
                style={{
                  width: '72px',
                  height: '72px',
                  background: '#111',
                  borderBottomLeftRadius: '100%',
                }}
              >
                <img
                  src="/logo.png"
                  alt="HODLClub"
                  style={{
                    height: '36px',
                    width: '36px',
                    objectFit: 'contain',
                    marginTop: '-12px',
                    marginRight: '-12px',
                  }}
                />
              </div>
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

      {/* Complete Lesson Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {isCurrentDone ? (
          <>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Урокът е завършен!</span>
            </div>
            <div className="flex gap-2">
              {activeIndex < lessons.length - 1 && (
                <button
                  onClick={() => setActiveIndex(activeIndex + 1)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center gap-2 text-sm"
                >
                  Следващ урок
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {allDone && nextModuleId && (
                <a
                  href={`/course/${courseId}/module/${nextModuleId}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center gap-2 text-sm"
                >
                  Следващ модул
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
              <button
                onClick={handleUncomplete}
                disabled={loading}
                className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 px-3 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition"
              >
                {loading ? '...' : 'Отмаркирай'}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Запазване...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Завърших урока
              </>
            )}
          </button>
        )}
      </div>

      {/* Lessons List (playlist) */}
      {lessons.length > 1 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 px-4 pt-3 pb-2 uppercase tracking-wide">
            Уроци в този модул
          </p>
          <div className="divide-y divide-gray-100">
            {lessons.map((lesson, index) => {
              const isDone = completed.has(lesson.id)
              return (
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
                    index === activeIndex
                      ? 'bg-indigo-600 text-white'
                      : isDone
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index === activeIndex ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    ) : isDone ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                  {isDone && index !== activeIndex && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
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
