import fs from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new Response('Forbidden', { status: 403 })

  const { id } = await params
  const bonus = await prisma.courseBonus.findUnique({ where: { id } })
  if (!bonus) return new Response('Not found', { status: 404 })

  // Must have access to the bonus's course (or be admin)
  if (session.role !== 'admin') {
    const access = await prisma.userCourseAccess.findUnique({
      where: { userId_courseId: { userId: session.userId, courseId: bonus.courseId } },
    })
    if (!access) return new Response('Forbidden', { status: 403 })
  }

  // Guard against path traversal — only allow a bare filename
  const safeName = path.basename(bonus.fileName)
  const filePath = path.join(process.cwd(), 'course-bonuses', safeName)
  const ext = path.extname(safeName).toLowerCase()

  try {
    const file = fs.readFileSync(filePath)
    const encoded = encodeURIComponent(bonus.downloadName)
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Content-Disposition': `inline; filename*=UTF-8''${encoded}`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('Course bonus read error:', err)
    return new Response('Not found', { status: 404 })
  }
}
