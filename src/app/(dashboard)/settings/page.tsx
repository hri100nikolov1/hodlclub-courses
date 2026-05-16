'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  async function handleChangePassword() {
    setPasswordError('')
    setPasswordSuccess(false)

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Всички полета са задължителни')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Новата парола трябва да е поне 6 символа')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Новите пароли не съвпадат')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPasswordError(data.error || 'Грешка при смяна на паролата')
        return
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch {
      setPasswordError('Нещо се обърка. Опитайте отново.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      setDeleteError('Въведете паролата си за потвърждение')
      return
    }
    setDeleting(true)
    setDeleteError('')

    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setDeleteError(data.error || 'Грешка при изтриване')
        setDeleting(false)
        return
      }

      // Акаунтът е изтрит — пренасочи към началната страница
      router.push('/login')
      router.refresh()
    } catch {
      setDeleteError('Нещо се обърка. Опитайте отново.')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Настройки на акаунта</h1>

      {/* Поверителност */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Поверителност и данни</h2>
        <p className="text-sm text-gray-500 mb-4">
          Информация как обработваме личните ви данни съгласно GDPR.
        </p>
        <Link
          href="/privacy"
          target="_blank"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Прочетете Политиката за поверителност
        </Link>
      </div>

      {/* Смяна на парола */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Смяна на парола</h2>
        <p className="text-sm text-gray-500 mb-4">
          Въведете текущата си парола и изберете нова.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текуща парола</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Въведете текущата парола"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Нова парола</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символа"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Потвърди нова парола</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Повторете новата парола"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
            />
          </div>

          {passwordError && (
            <p className="text-red-600 text-sm">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-green-600 text-sm font-medium">Паролата е сменена успешно!</p>
          )}

          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition"
          >
            {changingPassword ? 'Запазване...' : 'Смени паролата'}
          </button>
        </div>
      </div>

      {/* Опасна зона */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-700 mb-1">Опасна зона</h2>
        <p className="text-sm text-gray-500 mb-4">
          Изтриването на акаунта е необратимо. Всички ваши данни, прогрес и достъп до курсовете
          ще бъдат изтрити завинаги.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm px-4 py-2.5 rounded-xl border border-red-200 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Изтрий акаунта ми
        </button>
      </div>

      {/* Modal за потвърждение */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Изтриване на акаунт</h3>
                <p className="text-sm text-gray-500">Това действие е необратимо</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Всички ваши данни, прогрес и достъп до курсовете ще бъдат изтрити завинаги.
              Въведете паролата си за потвърждение.
            </p>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Вашата парола"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 text-gray-900 text-sm mb-3"
              onKeyDown={(e) => e.key === 'Enter' && handleDeleteAccount()}
            />

            {deleteError && (
              <p className="text-red-600 text-sm mb-3">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletePassword('')
                  setDeleteError('')
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                Откажи
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition"
              >
                {deleting ? 'Изтриване...' : 'Да, изтрий акаунта'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
