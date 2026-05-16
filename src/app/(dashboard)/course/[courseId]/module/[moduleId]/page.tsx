import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import LessonPlayer from '@/components/LessonPlayer'

export default async function ModulePage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { courseId, moduleId } = await params

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
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!course) notFound()

  const moduleIndex = course.modules.findIndex((m) => m.id === moduleId)
  if (moduleIndex === -1) notFound()

  const currentModule = course.modules[moduleIndex]

  const progress = await prisma.moduleProgress.findMany({
    where: { userId: session.userId },
    select: { moduleId: true },
  })

  const completedIds = new Set(progress.map((p) => p.moduleId))

  // Fetch lesson-level progress for this module
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.userId,
      lessonId: { in: currentModule.lessons.map((l) => l.id) },
    },
    select: { lessonId: true },
  })
  const completedLessonIds = lessonProgress.map((lp) => lp.lessonId)

  // Fetch quizzes for lessons in this module
  const quizzes = await prisma.quiz.findMany({
    where: { lessonId: { in: currentModule.lessons.map((l) => l.id) } },
    include: { questions: { orderBy: { order: 'asc' } } },
  })

  // Fetch quiz attempts for current user
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.userId,
      quizId: { in: quizzes.map((q) => q.id) },
    },
    select: { quizId: true, answers: true, score: true, total: true },
  })

  const isLocked = moduleIndex > 0 && !completedIds.has(course.modules[moduleIndex - 1].id)
  if (isLocked) redirect(`/course/${courseId}`)

  const isCompleted = completedIds.has(moduleId)
  const nextModule = course.modules[moduleIndex + 1]

  return (
    <div>
      {/* Back */}
      <Link href={`/course/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад към {course.title}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Header */}
          <div>
            <p className="text-sm font-medium text-indigo-600 mb-1">
              МОДУЛ {moduleIndex + 1} от {course.modules.length}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{currentModule.title}</h1>
            {currentModule.description && (
              <p className="text-gray-600 mt-2">{currentModule.description}</p>
            )}
          </div>

          {/* Lessons */}
          {currentModule.lessons.length === 0 ? (
            <div className="bg-gray-100 rounded-2xl flex items-center justify-center h-48">
              <div className="text-center text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Съдържанието ще бъде добавено скоро</p>
              </div>
            </div>
          ) : (
            <LessonPlayer
              lessons={currentModule.lessons}
              completedLessonIds={completedLessonIds}
              moduleId={moduleId}
              courseId={courseId}
              nextModuleId={nextModule?.id}
              quizzes={quizzes.map(q => ({
                id: q.id,
                lessonId: q.lessonId,
                questions: q.questions.map(qq => ({
                  id: qq.id,
                  text: qq.text,
                  options: qq.options as string[],
                  correctIndex: qq.correctIndex,
                  order: qq.order,
                }))
              }))}
              quizAttempts={quizAttempts.map(a => ({
                quizId: a.quizId,
                answers: a.answers as number[],
                score: a.score,
                total: a.total,
              }))}
            />
          )}
        </div>

        {/* Sidebar - Module List */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-900 mb-4">Модули на курса</h3>
          {course.modules.map((mod, index) => {
            const isCurrent = mod.id === moduleId
            const isDone = completedIds.has(mod.id)
            const isModLocked = index > 0 && !completedIds.has(course.modules[index - 1].id)

            return (
              <div key={mod.id}>
                {isModLocked ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 opacity-50">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 truncate">{mod.title}</p>
                      <p className="text-xs text-gray-400">{mod.lessons.length} урока</p>
                    </div>
                  </div>
                ) : (
                  <Link href={`/course/${courseId}/module/${mod.id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                      isCurrent ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : isDone ? 'border-green-200 bg-green-50 hover:bg-green-100'
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isCurrent ? 'bg-indigo-600 text-white'
                      : isDone ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{mod.title}</p>
                      <p className="text-xs text-gray-400">{mod.lessons.length} урока</p>
                    </div>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
