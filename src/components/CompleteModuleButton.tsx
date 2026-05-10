'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  moduleId: string
  courseId: string
  isCompleted: boolean
  nextModuleId?: string
}

export default function CompleteModuleButton({
  moduleId,
  courseId,
  isCompleted,
  nextModuleId,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)

  async function handleComplete() {
    if (done) {
      // Navigate to next module if already completed
      if (nextModuleId) {
        router.push(`/course/${courseId}/module/${nextModuleId}`)
      } else {
        router.push(`/course/${courseId}`)
      }
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      })

      if (res.ok) {
        setDone(true)
        router.refresh()

        // Auto-navigate to next module after short delay
        setTimeout(() => {
          if (nextModuleId) {
            router.push(`/course/${courseId}/module/${nextModuleId}`)
          } else {
            router.push(`/course/${courseId}`)
          }
        }, 1500)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (done && !loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Модулът е завършен!</span>
        </div>
        {nextModuleId && (
          <button
            onClick={handleComplete}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
          >
            Следващ модул
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
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
          Завърших модула
          {nextModuleId ? ' → Следващ' : ' → Към курса'}
        </>
      )}
    </button>
  )
}
