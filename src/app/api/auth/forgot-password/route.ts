import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return Response.json({ error: 'Моля, въведете имейл адрес' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return ok to avoid revealing if email exists
    if (!user) {
      return Response.json({ ok: true })
    }

    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    sendPasswordResetEmail(user.email, token.token).catch(console.error)

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}
