'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Lesson = {
  id: string
  title: string
  videoUrl: string | null
  order: number
}

type Module = {
  id: string
  title: string
  description: string | null
  order: number
  isPublished: boolean
  lessons: Lesson[]
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

  // Module form
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [mTitle, setMTitle] = useState('')
  const [mDescription, setMDescription] = useState('')
  const [savingModule, setSavingModule] = useState(false)

  // Lesson form
  const [activeLessonModuleId, setActiveLessonModuleId] = useState<string | null>(null)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const [lTitle, setLTitle] = useState('')
  const [lVideoUrl, setLVideoUrl] = useState('')
  const [savingLesson, setSavingLesson] = useState(false)

  const loadCourse = useCallback(async () => {
    const res = await fetch(`/api/admin/courses/${courseId}`)
    const data = await res.json()
    setCourse(data.course)
    setLoading(false)
  }, [courseId])

  useEffect(() => { loadCourse() }, [loadCourse])

  // Module handlers
  function openCreateModule() {
    setEditModule(null); setMTitle(''); setMDescription(''); setShowModuleForm(true)
  }

  function openEditModule(mod: Module) {
    setEditModule(mod); setMTitle(mod.title); setMDescription(mod.description || ''); setShowModuleForm(true)
  }

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault()
    setSavingModule(true)
    if (editModule) {
      await fetch(`/api/admin/courses/${courseId}/modules/${editModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: mTitle, description: mDescription }),
      })
    } else {
      await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: mTitle, description: mDescription }),
      })
    }
    setSavingModule(false); setShowModuleForm(false); loadCourse()
  }

  async function deleteModule(moduleId: string) {
    if (!confirm('Изтрийте модула и всичките му уроци?')) return
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: swapModule.order }),
      }),
      fetch(`/api/admin/courses/${courseId}/modules/${swapModule.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: course.modules[idx].order }),
      }),
    ])
    loadCourse()
  }

  // Lesson handlers
  function openAddLesson(moduleId: string) {
    setActiveLessonModuleId(moduleId); setEditLesson(null); setLTitle(''); setLVideoUrl('')
  }

  function openEditLesson(moduleId: string, lesson: Lesson) {
    setActiveLessonModuleId(moduleId); setEditLesson(lesson); setLTitle(lesson.title); setLVideoUrl(lesson.videoUrl || '')
  }

  function closeLessonForm() {
    setActiveLessonModuleId(null); setEditLesson(null)
  }

  async function handleSaveLesson(e: React.FormEvent, moduleId: string) {
    e.preventDefault()
    setSavingLesson(true)
    if (editLesson) {
      await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${editLesson.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: lTitle, videoUrl: lVideoUrl }),
      })
    } else {
      await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: lTitle, videoUrl: lVideoUrl }),
      })
    }
    setSavingLesson(false); closeLessonForm(); loadCourse()
  }

  async function deleteLesson(moduleId: string, lessonId: string) {
    if (!confirm('Изтрийте урока?')) return
    await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: 'DELETE' })
    loadCourse()
  }

  async function moveLesson(moduleId: string, lessonId: string, direction: 'up' | 'down') {
    if (!course) return
    const mod = course.modules.find((m) => m.id === moduleId)
    if (!mod) return
    const idx = mod.lessons.findIndex((l) => l.id === lessonId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === mod.lessons.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const swapLesson = mod.lessons[swapIdx]
    await Promise.all([
      fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: swapLesson.order }),
      }),
      fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${swapLesson.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: mod.lessons[idx].order }),
      }),
    ])
    loadCourse()
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )

  if (!course) return <p>Курсът не е намерен</p>

  return (
    <div>
      {/* Header */}
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
        <button onClick={openCreateModule}
          className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Нов модул
        </button>
      </div>

      {/* Module Form */}
      {showModuleForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">{editModule ? 'Редактиране на модул' : 'Нов модул'}</h2>
          <form onSubmit={handleSaveModule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Заглавие</label>
              <input type="text" value={mTitle} onChange={(e) => setMTitle(e.target.value)} required
                placeholder="Напр. Въведение в Bitcoin"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание (незадължително)</label>
              <textarea value={mDescription} onChange={(e) => setMDescription(e.target.value)} rows={2}
                placeholder="Кратко описание..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingModule}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition">
                {savingModule ? 'Запазване...' : editModule ? 'Запази' : 'Създай модул'}
              </button>
              <button type="button" onClick={() => setShowModuleForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition">
                Отказ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules */}
      {course.modules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">Нямате добавени модули. Добавете първия!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {course.modules.map((mod, modIndex) => (
            <div key={mod.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Module Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveModule(mod.id, 'up')} disabled={modIndex === 0}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button onClick={() => moveModule(mod.id, 'down')} disabled={modIndex === course.modules.length - 1}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-sm">{modIndex + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{mod.title}</h3>
                  {mod.description && <p className="text-sm text-gray-500">{mod.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{mod.lessons.length} урока</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openAddLesson(mod.id)}
                    className="bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium px-3 py-2 rounded-xl transition flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Добави урок
                  </button>
                  <button onClick={() => openEditModule(mod)}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl transition">
                    Редактирай
                  </button>
                  <button onClick={() => deleteModule(mod.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-2 rounded-xl transition">
                    Изтрий
                  </button>
                </div>
              </div>

              {/* Lesson Form */}
              {activeLessonModuleId === mod.id && (
                <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">
                    {editLesson ? 'Редактиране на урок' : 'Нов урок'}
                  </h4>
                  <form onSubmit={(e) => handleSaveLesson(e, mod.id)} className="space-y-3">
                    <div>
                      <input type="text" value={lTitle} onChange={(e) => setLTitle(e.target.value)} required
                        placeholder="Заглавие на урока"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm" />
                    </div>
                    <div>
                      <input type="url" value={lVideoUrl} onChange={(e) => setLVideoUrl(e.target.value)}
                        placeholder="YouTube или Google Drive линк (незадължително)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={savingLesson}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                        {savingLesson ? 'Запазване...' : editLesson ? 'Запази' : 'Добави урок'}
                      </button>
                      <button type="button" onClick={closeLessonForm}
                        className="bg-white hover:bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition border border-gray-200">
                        Отказ
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lessons List */}
              {mod.lessons.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  Няма уроци — добавете първия с бутона горе
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {mod.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveLesson(mod.id, lesson.id, 'up')} disabled={lessonIndex === 0}
                          className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button onClick={() => moveLesson(mod.id, lesson.id, 'down')} disabled={lessonIndex === mod.lessons.length - 1}
                          className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <span className="text-xs text-gray-400 w-5 text-center">{lessonIndex + 1}</span>

                      <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                        {lesson.videoUrl ? (
                          <p className="text-xs text-green-600">✓ Видеото е добавено</p>
                        ) : (
                          <p className="text-xs text-amber-500">⚠ Без видео</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => openEditLesson(mod.id, lesson)}
                          className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg transition">
                          Редактирай
                        </button>
                        <button onClick={() => deleteLesson(mod.id, lesson.id)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg transition">
                          Изтрий
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
