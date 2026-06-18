import fs from 'fs'
import path from 'path'
import { getSession } from '@/lib/session'
import { hasBookAccess } from '@/lib/access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!(await hasBookAccess(session))) {
    return new Response('Forbidden', { status: 403 })
  }

  const filePath = path.join(process.cwd(), 'book-assets', 'kriptogenesis.pdf')
  try {
    const file = fs.readFileSync(filePath)
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="kriptogenesis.pdf"',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('Book PDF read error:', err)
    return new Response('Not found', { status: 404 })
  }
}
