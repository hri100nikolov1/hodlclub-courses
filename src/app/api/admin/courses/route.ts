import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courses = await prisma.course.findMany({
    include: {
      modules: { orderBy: { order: 'asc' } },
      _count: { select: { userAccess: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ courses })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, imageUrl } = await request.json()
  if (!title || !description) {
    return Response.json({ error: 'title and description required' }, { status: 400 })
  }

  const course = await prisma.course.create({
    data: { title, description, imageUrl: imageUrl || null },
  })

  return Response.json({ course })
}
