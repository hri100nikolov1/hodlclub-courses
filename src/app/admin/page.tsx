import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const [coursesCount, usersCount, unusedInvites, totalCompletions, mostCompletedGroup, allStudentIds, studentsWithProgress] = await Promise.all([
    prisma.course.count(),
    prisma.user.count({ where: { role: 'student' } }),
    prisma.inviteToken.count({ where: { usedById: null } }),
    prisma.lessonProgress.count(),
    prisma.lessonProgress.groupBy({
      by: ['lessonId'],
      _count: { lessonId: true },
      orderBy: { _count: { lessonId: 'desc' } },
      take: 1,
    }),
    prisma.user.findMany({ where: { role: 'student' }, select: { id: true } }),
    prisma.lessonProgress.findMany({ select: { userId: true }, distinct: ['userId'] }),
  ])

  // Most completed lesson title
  let mostCompletedTitle = '—'
  if (mostCompletedGroup.length > 0) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: mostCompletedGroup[0].lessonId },
      select: { title: true },
    })
    if (lesson) mostCompletedTitle = lesson.title
  }

  // Students with 0 progress
  const studentsWithProgressIds = new Set(studentsWithProgress.map((p) => p.userId))
  const studentsWithoutProgress = allStudentIds.filter((u) => !studentsWithProgressIds.has(u.id)).length

  // Average lessons per student
  const avgLessons = usersCount > 0 ? (totalCompletions / usersCount).toFixed(1) : '0.0'

  const recentUsers = await prisma.user.findMany({
    where: { role: 'student' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { courseAccess: { include: { course: { select: { title: true } } } } },
  })

  const stats = [
    { label: 'Курсове', value: coursesCount, icon: '📚', href: '/admin/courses', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Студенти', value: usersCount, icon: '👥', href: '/admin/users', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'Неизползвани инвайти', value: unusedInvites, icon: '🔗', href: '/admin/invites', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Административен панел</h1>
        <p className="text-gray-500 mt-1">Управлявайте курсовете, потребителите и инвайт линковете</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-white rounded-2xl border-2 ${stat.color} p-6 flex items-center gap-4 hover:shadow-md transition`}
          >
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Analytics */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-5 text-lg">Аналитики на обучението</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Завършени урока общо</p>
            <p className="text-3xl font-bold text-gray-900">{totalCompletions}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Средно урока на студент</p>
            <p className="text-3xl font-bold text-gray-900">{avgLessons}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Студенти без прогрес</p>
            <p className="text-3xl font-bold text-gray-900">{studentsWithoutProgress}</p>
          </div>
        </div>
        {mostCompletedGroup.length > 0 && (
          <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-sm text-indigo-500 mb-0.5">Най-завършван урок</p>
            <p className="font-semibold text-indigo-900">{mostCompletedTitle}</p>
            <p className="text-xs text-indigo-400 mt-0.5">{mostCompletedGroup[0]._count.lessonId} завършвания</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Бързи действия</h2>
          <div className="space-y-2">
            <Link href="/admin/courses" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-gray-700">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-base">📚</span>
              <span className="font-medium">Управление на курсове</span>
              <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-gray-700">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-base">👥</span>
              <span className="font-medium">Управление на потребители</span>
              <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/admin/invites" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-gray-700">
              <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-base">🔗</span>
              <span className="font-medium">Генериране на инвайт линкове</span>
              <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Последно регистрирани</h2>
          {recentUsers.length === 0 ? (
            <p className="text-gray-400 text-sm">Все още няма регистрирани студенти</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-700 font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString('bg-BG')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
