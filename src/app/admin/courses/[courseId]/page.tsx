'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Module = {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  order: number
  isPublished: boolean
}

type Course = {
  id: string
  title: string
  description: string
  modules: Module[]
}

export default function AdminCourseDetailPage() {
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editModule, setEditModule] = useState<Module | null>(null)

  // Form state
  const [mTitle, setMTitle] = useState('')
  const [mDescription, setMDescription] = useState('')
  const [mVideoUrl, setMVideoUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCourse = useCallback(async () => {
    const res = await fetch(`/api/admin/courses/${courseId}`)
    const data = await res.json()
    setCourse(data.course)
    setLoading(false)
  }, [courseId])

  useEffect(() => {
    loadCourse()
  }, [loadCourse])

  function openEditForm(mod: Module) {
    setEditModule(mod)
    setMTitle(mod.title)
    setMDescription(mod.description || '')
    setMVideoUrl(mod.videoUrl || '')
    setShowForm(true)
  }

  function openCreateForm() {
    setEditModule(null)
    setMTitle('')
    setMDescription('')
    setMVideoUrl('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editModule) {
      await fetch(`/api/admin/courses/${courseId}/modules/${editModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: mTitle, description: mDescription, videoUrl: mVideoUrl }),
      })
    } else {
      await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: mTitle, description: mDescription, videoUrl: mVideoUrl }),
      })
    }

    setSaving(false)
    setShowForm(false)
    loadCourse()
  }

  async function deleteModule(moduleId: string) {
    if (!confirm('Изтрийте модула?')) return
    await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' })
    loadCourse()
  }

  async function moveModule(moduleId: string, direction: 'up' | 'down') {
    if (!course) return
    const idx = course.modules.findIndex((m) => m.id === moduleId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === course.modules.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const swapModule = course.modules[swapIdx]

    await Promise.all([
      fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: swapModule.order }),
      }),
      fetch(`/api/admin/courses/${courseId}/modules/${swapModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: course.modules[idx].order }),
      }),
    ])

    loadCourse()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!course) return <p>Курсът не е намерен</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/courses" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{course.description}</p>
        </div>
        <button
          onClick={openCreateForm}
          className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Нов модул
        </button>
      </div>

      {/* Module Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">
            {editModule ? 'Редактиране на модул' : 'Нов модул'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Заглавие на модула</label>
              <input
                type="text"
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
                required
                placeholder="Напр. Въведение в Bitcoin"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание (незадължително)</label>
              <textarea
                value={mDescription}
                onChange={(e) => setMDescription(e.target.value)}
                rows={2}
                placeholder="Кратко описание на модула..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Видео линк (YouTube или Google Drive)
              </label>
              <input
                type="url"
                value={mVideoUrl}
                onChange={(e) => setMVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-1">
                Поддържа YouTube (youtu.be, youtube.com/watch) и Google Drive линкове
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition"
              >
                {saving ? 'Запазване...' : editModule ? 'Запази промените' : 'Добави модул'}
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

      {/* Modules List */}
      {course.modules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">Нямате добавени модули. Добавете първия!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {course.modules.map((mod, index) => (
            <div key={mod.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition">
              {/* Order controls */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveModule(mod.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveModule(mod.id, 'down')}
                  disabled={index === course.modules.length - 1}
                  className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-700 font-bold text-sm">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{mod.title}</h3>
                {mod.description && <p className="text-sm text-gray-500 truncate">{mod.description}</p>}
                {mod.videoUrl ? (
                  <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Видеото е добавено
                  </p>
                ) : (
                  <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Без видео
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditForm(mod)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl transition"
                >
                  Редактирай
                </button>
                <button
                  onClick={() => deleteModule(mod.id)}
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
