'use client'

import { useState, useEffect, useCallback } from 'react'

type CourseAccess = {
  courseId: string
  course: { title: string }
}

type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  courseAccess: CourseAccess[]
  productAccess: { product: string }[]
}

type Course = {
  id: string
  title: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const loadData = useCallback(async () => {
    const [usersRes, coursesRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/courses'),
    ])
    const usersData = await usersRes.json()
    const coursesData = await coursesRes.json()
    setUsers(usersData.users || [])
    setCourses(coursesData.courses || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function toggleAccess(userId: string, courseId: string, hasAccess: boolean) {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId, action: hasAccess ? 'revoke' : 'grant' }),
    })
    loadData()
    // Update selected user
    if (selectedUser) {
      setSelectedUser((prev) => {
        if (!prev) return null
        const updated = {
          ...prev,
          courseAccess: hasAccess
            ? prev.courseAccess.filter((a) => a.courseId !== courseId)
            : [...prev.courseAccess, { courseId, course: { title: courses.find(c => c.id === courseId)?.title || '' } }]
        }
        return updated
      })
    }
  }

  async function toggleProduct(userId: string, product: 'book' | 'ai', hasAccess: boolean) {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, product, action: hasAccess ? 'revoke' : 'grant' }),
    })
    loadData()
    if (selectedUser) {
      setSelectedUser((prev) => {
        if (!prev) return null
        return {
          ...prev,
          productAccess: hasAccess
            ? prev.productAccess.filter((p) => p.product !== product)
            : [...prev.productAccess, { product }],
        }
      })
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Изтрийте потребителя?')) return
    await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' })
    setSelectedUser(null)
    loadData()
  }

  const students = users.filter((u) => u.role === 'student')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Потребители</h1>
        <p className="text-gray-500 mt-1">Управлявайте студентите и техния достъп до курсове</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-700 text-sm">{students.length} студента</p>
              </div>
              {students.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Все още няма регистрирани студенти
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left ${selectedUser?.id === user.id ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {user.courseAccess.length} курса
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Detail */}
          <div className="lg:col-span-2">
            {!selectedUser ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center h-full flex items-center justify-center">
                <div>
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-400">Изберете студент от списъка</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                      <span className="text-indigo-700 font-bold text-xl">{selectedUser.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                      <p className="text-gray-500">{selectedUser.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Регистриран: {new Date(selectedUser.createdAt).toLocaleDateString('bg-BG')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteUser(selectedUser.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                  >
                    Изтрий
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Достъп до курсове</h3>
                  <div className="space-y-2">
                    {courses.map((course) => {
                      const hasAccess = selectedUser.courseAccess.some((a) => a.courseId === course.id)
                      return (
                        <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                          <span className="text-sm font-medium text-gray-700">{course.title}</span>
                          <button
                            onClick={() => toggleAccess(selectedUser.id, course.id, hasAccess)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                              hasAccess
                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                : 'bg-gray-200 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                          >
                            {hasAccess ? '✓ Има достъп' : '+ Дай достъп'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Product access: Book + AI */}
                <div className="mt-6">
                  <h3 className="font-bold text-gray-900 mb-3">Достъп до продукти</h3>
                  <div className="space-y-2">
                    {/* Book */}
                    {(() => {
                      const hasBook = selectedUser.productAccess.some((p) => p.product === 'book')
                      return (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                          <span className="text-sm font-medium text-gray-700">📕 Книга „Криптогенезис“</span>
                          <button
                            onClick={() => toggleProduct(selectedUser.id, 'book', hasBook)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                              hasBook
                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                : 'bg-gray-200 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                          >
                            {hasBook ? '✓ Има достъп' : '+ Дай достъп'}
                          </button>
                        </div>
                      )
                    })()}

                    {/* AI — bundled with course access; standalone grant otherwise */}
                    {(() => {
                      const hasCourse = selectedUser.courseAccess.length > 0
                      const hasAIProduct = selectedUser.productAccess.some((p) => p.product === 'ai')
                      return (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                          <span className="text-sm font-medium text-gray-700">🤖 AI Анализатор</span>
                          {hasCourse ? (
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-100 text-green-700">
                              ✓ Има достъп (през курса)
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleProduct(selectedUser.id, 'ai', hasAIProduct)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                                hasAIProduct
                                  ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                  : 'bg-gray-200 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                              }`}
                            >
                              {hasAIProduct ? '✓ Има достъп' : '+ Дай достъп'}
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    AI Анализаторът е включен автоматично за всеки с достъп до курс. Самостоятелен достъп се дава тук само на хора без курс.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
