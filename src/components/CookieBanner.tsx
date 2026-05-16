'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Малко закъснение за да не "светне" преди рендера
      const timer = setTimeout(() => setVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Иконка */}
        <div className="flex-shrink-0 text-2xl">🍪</div>

        {/* Текст */}
        <div className="flex-1 text-sm text-gray-300 leading-relaxed">
          Използваме само технически необходима бисквитка за поддържане на сесията ви (вход в акаунта).
          Нямаме рекламни или проследяващи бисквитки.{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Научете повече
          </Link>
        </div>

        {/* Бутон */}
        <button
          onClick={accept}
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition whitespace-nowrap"
        >
          Разбрах, приемам
        </button>
      </div>
    </div>
  )
}
