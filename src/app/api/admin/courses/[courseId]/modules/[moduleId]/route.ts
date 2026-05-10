import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { moduleId } = await params
  const { title, description, videoUrl, order, isPublished } = await request.json()

  const module = await prisma.module.update({
    where: { id: moduleId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(order !== undefined && { order }),
      ...(isPublished !== undefined && { isPublished }),
    },
  })

  return Response.json({ module })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { moduleId } = await params
  await prisma.module.delete({ where: { id: moduleId } })
  return Response.json({ ok: true })
}
