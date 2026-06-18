import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { hasBookAccess } from '@/lib/access'
import { prisma } from '@/lib/prisma'
import BookView from '@/components/BookView'

export default async function BookPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!(await hasBookAccess(session))) redirect('/dashboard')

  const book = await prisma.book.findFirst({
    where: { isPublished: true },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })

  if (!book) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-gray-500">Книгата ще бъде налична скоро.</p>
      </div>
    )
  }

  return (
    <BookView
      title={book.title}
      description={book.description}
      coverUrl={book.coverUrl}
      pdfUrl={book.pdfUrl}
      chapters={book.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        audioUrl: c.audioUrl,
        order: c.order,
      }))}
    />
  )
}
