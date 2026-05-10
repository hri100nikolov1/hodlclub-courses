'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Course = {
  id: string
  title: string
  description: string
  isPublished: boolean
  modules: { id: string }[]
  _count: { userAccess: number }
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCourses = useCallback(async () => {
    const res = await fetch('/api/admin/courses')
    const data = await res.json()
    setCourses(data.courses || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
    setTitle('')
    setDescription('')
    setShowForm(false)
    setSaving(false)
    loadCourses()
  }

  async function togglePublish(courseId: string, current: boolean) {
    await fetch(`/api/admin/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    loadCourses()
  }

  async function deleteCourse(courseId: string) {
    if (!confirm('Сигурни ли сте? Това ще изтрие курса и всички модули!')) return
    await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' })
    loadCourses()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Курсове</h1>
          <p className="text-gray-500 mt-1">Управлявайте всички курсове</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Нов курс
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Нов курс</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Заглавие</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Напр. Крипто основи"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Кратко описание на курса..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition"
              >
                {saving ? 'Запазване...' : 'Създай курс'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition"
              >
                Отказ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">Нямате създадени курсове. Създайте първия!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">📚</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-gray-900 truncate">{course.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {course.isPublished ? 'Публикуван' : 'Скрит'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{course.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{course.modules.length} модула</span>
                  <span>•</span>
                  <span>{course._count.userAccess} студента</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-2 rounded-xl transition"
                >
                  Модули
                </Link>
                <button
                  onClick={() => togglePublish(course.id, course.isPublished)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl transition"
                >
                  {course.isPublished ? 'Скрий' : 'Публикувай'}
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
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
  )
}
