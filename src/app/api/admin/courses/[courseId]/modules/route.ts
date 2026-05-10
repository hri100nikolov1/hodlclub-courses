import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId } = await params
  const { title, description, videoUrl } = await request.json()

  if (!title) return Response.json({ error: 'title required' }, { status: 400 })

  // Get next order number
  const lastModule = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
  })

  const order = (lastModule?.order ?? 0) + 1

  const module = await prisma.module.create({
    data: { courseId, title, description: description || null, videoUrl: videoUrl || null, order },
  })

  return Response.json({ module })
}
