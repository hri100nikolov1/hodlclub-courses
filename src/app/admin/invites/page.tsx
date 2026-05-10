'use client'

import { useState, useEffect, useCallback } from 'react'

type Invite = {
  id: string
  token: string
  createdAt: string
  expiresAt: string | null
  course: { title: string }
  usedBy: { name: string; email: string } | null
}

type Course = {
  id: string
  title: string
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [invitesRes, coursesRes] = await Promise.all([
      fetch('/api/invites'),
      fetch('/api/admin/courses'),
    ])
    const invitesData = await invitesRes.json()
    const coursesData = await coursesRes.json()
    setInvites(invitesData.invites || [])
    setCourses(coursesData.courses || [])
    if (coursesData.courses?.length > 0) {
      setSelectedCourse(coursesData.courses[0].id)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function createInvite() {
    if (!selectedCourse) return
    setCreating(true)
    await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: selectedCourse }),
    })
    setCreating(false)
    loadData()
  }

  async function deleteInvite(id: string) {
    await fetch(`/api/invites?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  function getInviteUrl(token: string) {
    return `${window.location.origin}/register?token=${token}`
  }

  async function copyLink(invite: Invite) {
    const url = getInviteUrl(invite.token)
    await navigator.clipboard.writeText(url)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const unused = invites.filter((i) => !i.usedBy)
  const used = invites.filter((i) => i.usedBy)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Инвайт линкове</h1>
        <p className="text-gray-500 mt-1">Генерирайте линкове за регистрация и ги изпратете на студентите</p>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Как работи?
        </h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Генерирате инвайт линк за конкретен курс</li>
          <li>Изпращате линка на студента (имейл, Telegram, Viber и т.н.)</li>
          <li>Студентът се регистрира чрез линка и автоматично получава достъп до курса</li>
          <li>Всеки линк може да се използва само веднъж</li>
        </ol>
      </div>

      {/* Create Invite */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Генерирай нов инвайт</h2>
        {courses.length === 0 ? (
          <p className="text-gray-400 text-sm">Нямате създадени курсове. Първо създайте курс.</p>
        ) : (
          <div className="flex gap-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button
              onClick={createInvite}
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {creating ? 'Генериране...' : 'Генерирай линк'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unused Invites */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Неизползвани ({unused.length})
            </h3>
            {unused.length === 0 ? (
              <p className="text-gray-400 text-sm bg-white rounded-xl border border-gray-200 p-4">Няма неизползвани инвайти</p>
            ) : (
              <div className="space-y-2">
                {unused.map((invite) => (
                  <div key={invite.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Свободен</span>
                        <span className="text-sm font-medium text-gray-900">{invite.course.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono truncate">
                        {typeof window !== 'undefined' ? getInviteUrl(invite.token) : invite.token}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Създаден: {new Date(invite.createdAt).toLocaleDateString('bg-BG')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyLink(invite)}
                        className={`text-sm font-medium px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                          copiedId === invite.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {copiedId === invite.id ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Копиран!
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Копирай линк
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteInvite(invite.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-2 rounded-xl transition"
                      >
                        Изтрий
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Used Invites */}
          {used.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Използвани ({used.length})
              </h3>
              <div className="space-y-2">
                {used.map((invite) => (
                  <div key={invite.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-70">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Използван</span>
                        <span className="text-sm font-medium text-gray-700">{invite.course.title}</span>
                      </div>
                      {invite.usedBy && (
                        <p className="text-sm text-gray-600">
                          Регистриран: <span className="font-medium">{invite.usedBy.name}</span> ({invite.usedBy.email})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
