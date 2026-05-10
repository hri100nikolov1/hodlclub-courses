'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg">CourseHub</span>
            </Link>

            {role === 'admin' && (
              <div className="hidden md:flex items-center gap-4">
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
              </div>
            )}
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

            <button
              onClick={handleLogout}
              className="ml-2 text-sm text-gray-500 hover:text-red-600 font-medium transition flex items-center gap-1"
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
