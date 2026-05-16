import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/session'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, token } = await request.json()

    if (!name || !email || !password || !token) {
      return Response.json({ error: 'Моля, попълнете всички полета' }, { status: 400 })
    }

    // Check invite token
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { course: true },
    })

    if (!invite) {
      return Response.json({ error: 'Невалиден инвайт линк' }, { status: 400 })
    }

    if (invite.usedById) {
      return Response.json({ error: 'Инвайт линкът вече е използван' }, { status: 400 })
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return Response.json({ error: 'Инвайт линкът е изтекъл' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: 'Имейлът вече е регистриран' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    // Create user and grant course access
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'student',
        courseAccess: {
          create: { courseId: invite.courseId },
        },
      },
    })

    // Mark invite as used
    await prisma.inviteToken.update({
      where: { token },
      data: { usedById: user.id },
    })

    // Send welcome email (don't await - don't block registration if email fails)
    sendWelcomeEmail(user.email, user.name).catch(console.error)

    const sessionToken = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    await setSessionCookie(sessionToken)

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}
