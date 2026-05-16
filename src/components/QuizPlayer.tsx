'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Question = {
  id: string
  text: string
  options: string[]
  correctIndex: number
  order: number
}

type PreviousAttempt = {
  answers: number[]
  score: number
  total: number
}

type Props = {
  questions: Question[]
  quizId: string
  previousAttempt?: PreviousAttempt | null
  onAttemptSaved?: (attempt: { quizId: string; answers: number[]; score: number; total: number }) => void
}

export default function QuizPlayer({ questions, quizId, previousAttempt, onAttemptSaved }: Props) {
  const sorted = [...questions].sort((a, b) => a.order - b.order)
  const router = useRouter()

  const [answers, setAnswers] = useState<(number | null)[]>(
    previousAttempt ? previousAttempt.answers : Array(sorted.length).fill(null)
  )
  const [submitted, setSubmitted] = useState(!!previousAttempt)
  const [current, setCurrent] = useState(0)
  const [saving, setSaving] = useState(false)
  const [claimingCert, setClaimingCert] = useState(false)

  const q = sorted[current]
  const selected = answers[current]
  const isLast = current === sorted.length - 1
  const allAnswered = answers.every((a) => a !== null)

  const score = submitted
    ? sorted.filter((q, i) => answers[i] === q.correctIndex).length
    : 0
  const pct = submitted ? Math.round((score / sorted.length) * 100) : 0

  function select(idx: number) {
    if (submitted) return
    const next = [...answers]
    next[current] = idx
    setAnswers(next)
  }

  async function handleSubmit() {
    setSaving(true)
    const finalScore = sorted.filter((q, i) => answers[i] === q.correctIndex).length
    try {
      await fetch('/api/quiz-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          answers,
          score: finalScore,
          total: sorted.length,
        }),
      })
      onAttemptSaved?.({ quizId, answers: answers as number[], score: finalScore, total: sorted.length })
    } catch (err) {
      console.error('Failed to save quiz attempt:', err)
    } finally {
      setSaving(false)
    }
    setSubmitted(true)
    setCurrent(0)
  }

  function handleReset() {
    setAnswers(Array(sorted.length).fill(null))
    setSubmitted(false)
    setCurrent(0)
  }

  async function handleClaimCertificate() {
    setClaimingCert(true)
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      })
      const data = await res.json()
      if (data.certificateId) {
        router.push(`/certificate/${data.certificateId}`)
      }
    } catch (err) {
      console.error('Failed to claim certificate:', err)
    } finally {
      setClaimingCert(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">Тест за разбиране</span>
          </div>
          {!submitted && (
            <span className="text-indigo-200 text-sm">
              {current + 1} / {sorted.length}
            </span>
          )}
          {submitted && previousAttempt && (
            <span className="text-indigo-200 text-xs">Предишен резултат</span>
          )}
        </div>

        {/* Progress dots */}
        {!submitted && (
          <div className="flex gap-1.5 mt-3">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current
                    ? 'bg-white w-6'
                    : answers[i] !== null
                    ? 'bg-indigo-300 w-3'
                    : 'bg-indigo-400/50 w-3'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-6">
        {!submitted ? (
          <>
            {/* Question */}
            <p className="font-semibold text-gray-900 text-base mb-4">
              {current + 1}. {q.text}
            </p>

            {/* Options */}
            <div className="space-y-2 mb-6">
              {(q.options as string[]).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => select(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition text-sm font-medium ${
                    selected === i
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs mr-2 flex-shrink-0 ${
                    selected === i ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {current > 0 && (
                <button
                  onClick={() => setCurrent(current - 1)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
                >
                  ← Назад
                </button>
              )}
              {!isLast ? (
                <button
                  onClick={() => setCurrent(current + 1)}
                  disabled={selected === null}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition"
                >
                  Напред →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || saving}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition"
                >
                  {saving ? 'Запазване...' : 'Предай теста ✓'}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="text-center mb-6">
              <div className={`text-5xl font-black mb-1 ${
                pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {score}/{sorted.length}
              </div>
              <p className="text-gray-500 text-sm">{pct}% верни отговори</p>
              {pct === 100 && <p className="text-green-600 font-semibold mt-1">🎉 Перфектен резултат!</p>}
              {pct >= 60 && pct < 100 && <p className="text-yellow-600 font-semibold mt-1">👍 Добре се справи!</p>}
              {pct < 60 && <p className="text-red-500 font-semibold mt-1">Прегледай урока и опитай отново.</p>}

              {/* Certificate button for perfect score */}
              {pct === 100 && (
                <button
                  onClick={handleClaimCertificate}
                  disabled={claimingCert}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition"
                >
                  {claimingCert ? (
                    'Зареждане...'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Вземи сертификата
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Answer review */}
            <div className="space-y-4 mb-6">
              {sorted.map((q, i) => {
                const userAnswer = answers[i]
                const isCorrect = userAnswer === q.correctIndex
                return (
                  <div key={q.id} className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`text-lg flex-shrink-0 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <p className="text-sm font-semibold text-gray-800">{q.text}</p>
                    </div>
                    {!isCorrect && (
                      <div className="ml-7 space-y-1">
                        {userAnswer !== null && (
                          <p className="text-xs text-red-600">
                            Твоят отговор: <span className="font-medium">{(q.options as string[])[userAnswer]}</span>
                          </p>
                        )}
                        <p className="text-xs text-green-700">
                          Верен отговор: <span className="font-medium">{(q.options as string[])[q.correctIndex]}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Retake button */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Реши теста отново
            </button>
          </>
        )}
      </div>
    </div>
  )
}
