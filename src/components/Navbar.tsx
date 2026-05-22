'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type NavbarProps = {
  name: string
  role: string
}

export default function Navbar({ name, role }: NavbarProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
              <Image
                src="/hodlclub_logo.png"
                alt="HODLClub"
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
              <span className="font-bold text-lg" style={{ color: '#C9A84C' }}>HODLClub</span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {role === 'admin' && (
                <>
                  <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
                    Dashboard
                  </Link>
                  <Link href="/admin/courses" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
                    Курсове
                  </Link>
                  <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
                    Потребители
                </Link>
                  <Link href="/admin/invites" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
                    Инвайти
                  </Link>
                </>
              )}
              <Link
                href="/analyze"
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white transition shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Анализ
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-700 font-semibold text-sm">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">{role === 'admin' ? 'Администратор' : 'Студент'}</p>
              </div>
            </div>

            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition flex items-center gap-1"
              title="Настройки"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Настройки</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 font-medium transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Изход</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
