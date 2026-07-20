import fs from 'fs'
import path from 'path'
import { getSession } from '@/lib/session'
import { hasBookAccess } from '@/lib/access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getSession()
  if (!(await hasBookAccess(session))) {
    return new Response('Forbidden', { status: 403 })
  }

  // Only the in-app reader may fetch the file. A direct browser navigation to
  // this URL (address bar, "open in new tab") sends Sec-Fetch-Dest: document —
  // block that so the raw PDF can't be opened/saved outside the flipbook.
  // The reader's fetch() sends Sec-Fetch-Dest: empty. Missing header (older
  // browsers) is allowed so the reader keeps working.
  if (request.headers.get('sec-fetch-dest') === 'document') {
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
