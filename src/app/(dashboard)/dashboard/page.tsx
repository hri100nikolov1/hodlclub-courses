import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import CryptoPrices from '@/components/CryptoPrices'
import CryptoNews from '@/components/CryptoNews'
import CourseGrid from '@/components/CourseGrid'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const accessList = await prisma.userCourseAccess.findMany({
    where: { userId: session.userId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: { lessons: { select: { id: true } } },
          },
        },
      },
    },
  })

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId: session.userId },
    select: { lessonId: true },
  })

  const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId))

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
        <CourseGrid
          courses={accessList.map(({ course }) => {
            const allLessons = course.modules.flatMap((m) => m.lessons)
            const totalLessons = allLessons.length
            const completedLessons = allLessons.filter((l) => completedLessonIds.has(l.id)).length
            return {
              id: course.id,
              title: course.title,
              description: course.description,
              imageUrl: course.imageUrl,
              totalLessons,
              completedLessons,
            }
          })}
        />
      )}
      {/* Crypto Prices */}
      <div className="mt-10">
        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-32 mb-4" />
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        }>
          <CryptoPrices />
        </Suspense>
      </div>

      {/* Crypto News */}
      <div className="mt-6 mb-6">
        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-36 mb-5" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        }>
          <CryptoNews />
        </Suspense>
      </div>
    </div>
  )
}
