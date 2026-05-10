import Link from 'next/link'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const accessList = await prisma.userCourseAccess.findMany({
    where: { userId: session.userId },
    include: {
      course: {
        include: {
          modules: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  const progress = await prisma.moduleProgress.findMany({
    where: { userId: session.userId },
    select: { moduleId: true },
  })

  const completedIds = new Set(progress.map((p) => p.moduleId))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Добре дошъл, {session.name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Вашите курсове</p>
      </div>

      {accessList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-gray-700 font-medium mb-1">Нямате достъп до курсове</h3>
          <p className="text-gray-400 text-sm">Свържете се с администратора за достъп.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessList.map(({ course }) => {
            const totalModules = course.modules.length
            const completedModules = course.modules.filter((m) => completedIds.has(m.id)).length
            const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

            return (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
              >
                {/* Course Image / Header */}
                <div className="h-36 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description}</p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{completedModules}/{totalModules} модула</span>
                      <span className="font-medium text-indigo-600">{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-indigo-600 text-sm font-medium">
                    {progressPct === 100 ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Завършен!
                      </>
                    ) : progressPct > 0 ? (
                      <>Продължи →</>
                    ) : (
                      <>Започни →</>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
