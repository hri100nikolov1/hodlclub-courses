import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import ModuleCertificateButton from '@/components/ModuleCertificateButton'

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { courseId } = await params

  // Check access
  const hasAccess =
    session.role === 'admin' ||
    !!(await prisma.userCourseAccess.findUnique({
      where: { userId_courseId: { userId: session.userId, courseId } },
    }))

  if (!hasAccess) redirect('/dashboard')

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: { select: { id: true, quiz: { select: { id: true } } } },
        },
      },
    },
  })

  if (!course) notFound()

  const moduleProgress = await prisma.moduleProgress.findMany({
    where: { userId: session.userId },
    select: { moduleId: true },
  })
  const completedModuleIds = new Set(moduleProgress.map((p) => p.moduleId))

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId: session.userId },
    select: { lessonId: true },
  })
  const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId))

  // All quiz ids across the course, and the user's perfect-score quiz ids
  const allQuizIds = course.modules.flatMap((m) =>
    m.lessons.map((l) => l.quiz?.id).filter((id): id is string => !!id)
  )
  const attempts = allQuizIds.length
    ? await prisma.quizAttempt.findMany({
        where: { userId: session.userId, quizId: { in: allQuizIds } },
        select: { quizId: true, score: true, total: true },
      })
    : []
  const perfectQuizIds = new Set(
    attempts.filter((a) => a.total > 0 && a.score === a.total).map((a) => a.quizId)
  )

  // Existing certificates per module for this user
  const certificates = await prisma.certificate.findMany({
    where: { userId: session.userId },
    select: { id: true, moduleId: true },
  })
  const certByModule = new Map(certificates.map((c) => [c.moduleId, c.id]))

  const modulesWithState = course.modules.map((mod, index) => {
    // A module with no lessons yet is "coming soon" (content being prepared)
    const comingSoon = mod.lessons.length === 0
    const isCompleted = completedModuleIds.has(mod.id)
    const prevModule = index === 0 ? null : course.modules[index - 1]
    const isLocked = index > 0 && !completedModuleIds.has(prevModule!.id)

    // Certificate eligibility: module has quizzes AND all are perfect
    const moduleQuizIds = mod.lessons
      .map((l) => l.quiz?.id)
      .filter((id): id is string => !!id)
    const certEligible =
      moduleQuizIds.length > 0 && moduleQuizIds.every((id) => perfectQuizIds.has(id))
    const certificateId = certByModule.get(mod.id) ?? null

    return { ...mod, comingSoon, isLocked, isCompleted, certEligible, certificateId }
  })

  const allLessons = course.modules.flatMap((m) => m.lessons)
  const totalLessons = allLessons.length
  const completedLessonsCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length
  const progressPct = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0
  const totalModules = course.modules.length
  const completedModulesCount = course.modules.filter((m) => completedModuleIds.has(m.id)).length

  return (
    <div>
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад към курсовете
      </Link>

      {/* Course Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="300" cy="100" r="150" fill="white" />
            <circle cx="50" cy="300" r="100" fill="white" />
          </svg>
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-indigo-100 mb-6 max-w-2xl">{course.description}</p>

          <div className="flex items-center gap-6 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {totalModules} модула
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {completedLessonsCount}/{totalLessons} урока
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Прогрес</span>
              <span className="font-bold">{progressPct}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Съдържание на курса</h2>

        {modulesWithState.map((mod, index) => (
          <div
            key={mod.id}
            className={`bg-white rounded-xl border-2 transition-all ${
              mod.comingSoon
                ? 'border-amber-200 border-dashed bg-amber-50/40'
                : mod.isCompleted
                ? 'border-green-200'
                : mod.isLocked
                ? 'border-gray-100 opacity-60'
                : 'border-indigo-100 hover:border-indigo-300'
            }`}
          >
            {mod.comingSoon ? (
              <div className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-500 font-medium mb-0.5">МОДУЛ {index + 1}</p>
                  <h3 className="font-semibold text-gray-700 truncate">{mod.title}</h3>
                  <p className="text-sm text-amber-700 mt-0.5">
                    🚧 Работим върху този модул — скоро ще бъде наличен.
                  </p>
                </div>
                <span className="text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0 font-medium whitespace-nowrap">
                  Идва скоро
                </span>
              </div>
            ) : (
            <div className="flex flex-col sm:flex-row sm:items-center">
              {mod.isLocked ? (
                <div className="flex-1 flex items-center gap-4 p-5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">МОДУЛ {index + 1}</p>
                    <h3 className="font-semibold text-gray-500 truncate">{mod.title}</h3>
                    {mod.description && <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{mod.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">Заключен</span>
                </div>
              ) : (
                <Link
                  href={`/course/${courseId}/module/${mod.id}`}
                  className="flex-1 flex items-center gap-4 p-5 group min-w-0"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      mod.isCompleted ? 'bg-green-100' : 'bg-indigo-100 group-hover:bg-indigo-200 transition'
                    }`}
                  >
                    {mod.isCompleted ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">МОДУЛ {index + 1}</p>
                    <h3 className={`font-semibold truncate group-hover:text-indigo-600 transition ${mod.isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                      {mod.title}
                    </h3>
                    {mod.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{mod.description}</p>}
                  </div>
                  <svg className="hidden sm:block w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {/* Certificate button — one per module */}
              <div className="flex-shrink-0 px-5 pb-5 pt-0 sm:p-0 sm:pr-5 sm:pl-2">
                <ModuleCertificateButton
                  moduleId={mod.id}
                  eligible={mod.certEligible}
                  certificateId={mod.certificateId}
                />
              </div>
            </div>
            )}
          </div>
        ))}
      </div>

      {progressPct === 100 && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold text-green-800">Поздравления!</h3>
          <p className="text-green-600 mt-1">Завършихте успешно курса!</p>
        </div>
      )}
    </div>
  )
}
