'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'hodlclub-disclaimer-seen'

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto max-w-6xl px-4 py-3 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm text-amber-800 flex-1">
          <span className="font-semibold">Образователно съдържание:</span>{' '}
          Всички материали в тази платформа са с изцяло образователна цел и{' '}
          <span className="font-semibold">не представляват финансов съвет</span>,
          препоръка за инвестиция или покана за покупка/продажба на каквито и да е активи.
          Инвестирането е свързано с риск — винаги се консултирайте с лицензиран финансов консултант.
        </p>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-amber-500 hover:text-amber-700 transition ml-2"
          aria-label="Затвори"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
