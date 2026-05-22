'use client'

import { useState, useEffect, useRef } from 'react'
import QuizPlayer from './QuizPlayer'

type Lesson = {
  id: string
  title: string
  videoUrl: string | null
  order: number
}

type QuizQuestion = {
  id: string
  text: string
  options: string[]
  correctIndex: number
  order: number
}

type Quiz = {
  id: string
  lessonId: string
  questions: QuizQuestion[]
}

type QuizAttempt = {
  quizId: string
  answers: number[]
  score: number
  total: number
}

type Props = {
  lessons: Lesson[]
  completedLessonIds: string[]
  moduleId: string
  courseId: string
  nextModuleId?: string
  quizzes?: Quiz[]
  quizAttempts?: QuizAttempt[]
}

// YouTube player types
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          videoId?: string
          playerVars?: Record<string, number | string>
          events?: {
            onStateChange?: (e: { data: number }) => void
            onReady?: () => void
          }
        }
      ) => YTPlayerInstance
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayerInstance {
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}

function getYouTubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function getGoogleDriveEmbedUrl(url: string): string | null {
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null
}

const MIN_WATCH_PERCENT = 80 // % of video to watch before "done" unlocks

export default function LessonPlayer({
  lessons,
  completedLessonIds,
  moduleId,
  courseId,
  nextModuleId,
  quizzes = [],
  quizAttempts = [],
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedLessonIds))
  const [loading, setLoading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0) // 0–100
  const [showModules, setShowModules] = useState(false)

  // Local quiz attempts state — initialized from server, updated after each submission
  const [localAttempts, setLocalAttempts] = useState<Record<string, QuizAttempt>>(
    () => Object.fromEntries(quizAttempts.map((a) => [a.quizId, a]))
  )

  function handleAttemptSaved(attempt: QuizAttempt) {
    setLocalAttempts((prev) => ({ ...prev, [attempt.quizId]: attempt }))
  }

  const playerRef = useRef<YTPlayerInstance | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ytApiLoaded = useRef(false)

  const activeLesson = lessons[activeIndex]
  const isCurrentDone = completed.has(activeLesson.id)
  const activeQuiz = quizzes.find((q) => q.lessonId === activeLesson.id)
  const allDone = lessons.every((l) => completed.has(l.id))

  const ytVideoId = activeLesson.videoUrl ? getYouTubeVideoId(activeLesson.videoUrl) : null
  const driveEmbedUrl = activeLesson.videoUrl ? getGoogleDriveEmbedUrl(activeLesson.videoUrl) : null
  const isYouTube = !!ytVideoId
  const isGoogleDrive = !!driveEmbedUrl
  const hasVideo = isYouTube || isGoogleDrive

  // Button unlocks when: already done, or Google Drive, or watched >= MIN_WATCH_PERCENT
  const canMarkDone = isCurrentDone || !isYouTube || videoProgress >= MIN_WATCH_PERCENT

  // ── YouTube Player lifecycle ──────────────────────────────────────────────
  function startProgressPolling(player: YTPlayerInstance) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      try {
        const cur = player.getCurrentTime()
        const dur = player.getDuration()
        if (dur > 0) setVideoProgress(Math.round((cur / dur) * 100))
      } catch {
        // player may be destroyed
      }
    }, 2000)
  }

  function createYTPlayer(videoId: string) {
    const divId = `yt-player-${activeLesson.id}`
    if (!document.getElementById(divId)) return

    playerRef.current = new window.YT.Player(divId, {
      videoId,
      playerVars: { rel: 0, modestbranding: 1 },
      events: {
        onStateChange: (e) => {
          if (e.data === 1 /* PLAYING */) {
            startProgressPolling(playerRef.current!)
          } else {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          }
        },
      },
    })
  }

  // Load the YouTube iframe API script once
  useEffect(() => {
    if (ytApiLoaded.current || !isYouTube) return
    ytApiLoaded.current = true

    if (window.YT && window.YT.Player) return // already loaded

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    document.head.appendChild(script)
  }, [isYouTube])

  // Create / destroy YT player when active lesson changes
  useEffect(() => {
    // Clean up previous player
    if (intervalRef.current) clearInterval(intervalRef.current)
    playerRef.current?.destroy()
    playerRef.current = null
    setVideoProgress(0)

    if (!ytVideoId) return

    const tryCreate = () => {
      if (window.YT && window.YT.Player) {
        createYTPlayer(ytVideoId)
      } else {
        const prev = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          prev?.()
          createYTPlayer(ytVideoId)
        }
      }
    }

    // Small delay to let the div render
    const t = setTimeout(tryCreate, 100)
    return () => {
      clearTimeout(t)
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson.id])

  // ── Handlers ─────────────────────────────────────────────────────────────
  function changeLesson(index: number) {
    setActiveIndex(index)
    setShowModules(false)
  }

  async function handleComplete() {
    setLoading(true)
    try {
      const res = await fetch('/api/lesson-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: activeLesson.id }),
      })
      if (res.ok) {
        const next = new Set(completed)
        next.add(activeLesson.id)
        setCompleted(next)
        if (activeIndex < lessons.length - 1) {
          setTimeout(() => changeLesson(activeIndex + 1), 600)
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
        const next = new Set(completed)
        next.delete(activeLesson.id)
        setCompleted(next)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Video Player ── */}
      {hasVideo ? (
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg">
          <div className="relative" style={{ paddingTop: '56.25%' }}>

            {/* YouTube — div replaced by YT.Player */}
            {isYouTube && (
              <div
                id={`yt-player-${activeLesson.id}`}
                className="absolute inset-0 w-full h-full"
              />
            )}

            {/* Google Drive */}
            {isGoogleDrive && (
              <>
                <iframe
                  id={`drive-player-${activeLesson.id}`}
                  src={driveEmbedUrl!}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                  title={activeLesson.title}
                />
                {/* HODLClub watermark */}
                <div
                  className="absolute top-0 right-0 z-10 flex items-center justify-center"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: '#111',
                    borderBottomLeftRadius: '100%',
                    pointerEvents: 'none',
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
                {/* Fullscreen button */}
                <button
                  onClick={() => {
                    const iframe = document.getElementById(`drive-player-${activeLesson.id}`) as HTMLIFrameElement | null
                    if (iframe?.requestFullscreen) {
                      iframe.requestFullscreen()
                    } else {
                      window.open(activeLesson.videoUrl!.replace('/view', '').replace('drive.google.com/file/d/', 'drive.google.com/file/d/') + '/view', '_blank')
                    }
                  }}
                  className="absolute bottom-3 right-3 z-20 bg-black/60 hover:bg-black/80 text-white rounded-lg p-2 transition"
                  title="Цял екран"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* YouTube progress bar */}
          {isYouTube && videoProgress > 0 && (
            <div className="h-1 bg-gray-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-1000"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 rounded-2xl flex items-center justify-center h-48 sm:h-64">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Видеото ще бъде добавено скоро</p>
          </div>
        </div>
      )}

      {/* ── Lesson Title ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
          {activeIndex + 1}. {activeLesson.title}
        </h2>
        <span className="text-sm text-gray-400 flex-shrink-0 ml-2">{activeIndex + 1} / {lessons.length}</span>
      </div>

      {/* ── YouTube watch hint ── */}
      {isYouTube && !isCurrentDone && videoProgress < MIN_WATCH_PERCENT && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Изгледайте поне {MIN_WATCH_PERCENT}% от видеото, за да отключите бутона.
            {videoProgress > 0 && ` (${videoProgress}% изгледано)`}
          </span>
        </div>
      )}

      {/* ── Complete Button ── */}
      <div className="flex flex-wrap gap-2 items-center">
        {isCurrentDone ? (
          <>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Урокът е завършен!</span>
            </div>

            {activeIndex < lessons.length - 1 && (
              <button
                onClick={() => changeLesson(activeIndex + 1)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 text-sm"
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 text-sm"
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
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition"
            >
              {loading ? '...' : 'Отмаркирай'}
            </button>
          </>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading || !canMarkDone}
            title={!canMarkDone ? `Изгледайте поне ${MIN_WATCH_PERCENT}% от видеото` : undefined}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
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

      {/* ── Quiz ── */}
      {activeQuiz && (
        <QuizPlayer
          key={activeLesson.id}
          quizId={activeQuiz.id}
          questions={activeQuiz.questions}
          previousAttempt={localAttempts[activeQuiz.id] ?? null}
          onAttemptSaved={handleAttemptSaved}
        />
      )}

      {/* ── Lesson Playlist ── */}
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
                  onClick={() => changeLesson(index)}
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
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      Сега
                    </span>
                  )}
                  {isDone && index !== activeIndex && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Prev / Next Buttons ── */}
      {lessons.length > 1 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => changeLesson(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Предишен
          </button>
          <button
            onClick={() => changeLesson(Math.min(lessons.length - 1, activeIndex + 1))}
            disabled={activeIndex === lessons.length - 1}
            className="bg-indigo-100 hover:bg-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-700 font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1"
          >
            Следващ
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
