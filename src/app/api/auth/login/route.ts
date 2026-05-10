import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Моля, попълнете всички полета' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return Response.json({ error: 'Невалиден имейл или парола' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return Response.json({ error: 'Невалиден имейл или парола' }, { status: 401 })
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    await setSessionCookie(token)

    return Response.json({ ok: true, role: user.role })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}
