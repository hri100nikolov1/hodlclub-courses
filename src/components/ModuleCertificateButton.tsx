'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  moduleId: string
  eligible: boolean
  certificateId: string | null
}

export default function ModuleCertificateButton({ moduleId, eligible, certificateId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Already has a certificate → view it
  if (certificateId) {
    return (
      <a
        href={`/certificate/${certificateId}`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold text-xs shadow-sm transition whitespace-nowrap"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Виж сертификата
      </a>
    )
  }

  async function handleClaim() {
    setLoading(true)
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      })
      const data = await res.json()
      if (data.certificateId) {
        router.push(`/certificate/${data.certificateId}`)
      } else {
        alert(data.error || 'Грешка при генериране на сертификата')
        setLoading(false)
      }
    } catch {
      alert('Грешка при свързване. Опитайте отново.')
      setLoading(false)
    }
  }

  // Eligible (all module quizzes solved with 100%) → claim
  if (eligible) {
    return (
      <button
        onClick={handleClaim}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition whitespace-nowrap"
      >
        {loading ? (
          'Зареждане...'
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Вземи сертификата
          </>
        )}
      </button>
    )
  }

  // Not eligible yet → locked / disabled
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-400 font-semibold text-xs whitespace-nowrap cursor-not-allowed"
      title="Решете всички тестове от модула с максимален резултат, за да отключите сертификата"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Сертификат
    </span>
  )
}
