import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { moduleId } = await params
  const { title, videoUrl } = await request.json()

  if (!title) return Response.json({ error: 'title required' }, { status: 400 })

  const lastLesson = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: 'desc' },
  })

  const order = (lastLesson?.order ?? 0) + 1

  const lesson = await prisma.lesson.create({
    data: { moduleId, title, videoUrl: videoUrl || null, order },
  })

  return Response.json({ lesson })
}
