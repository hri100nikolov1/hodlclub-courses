import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/session'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Вземи IP адреса за rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Моля, попълнете всички полета' }, { status: 400 })
    }

    // Rate limiting — по IP + имейл
    const rateLimitKey = `login:${ip}:${email.toLowerCase()}`
    const { allowed, retryAfter } = checkRateLimit(rateLimitKey)

    if (!allowed) {
      const minutes = Math.ceil((retryAfter ?? 900) / 60)
      return Response.json(
        { error: `Твърде много неуспешни опити. Опитайте отново след ${minutes} минути.` },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Не нулирай — броят опити продължава
      return Response.json({ error: 'Невалиден имейл или парола' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return Response.json({ error: 'Невалиден имейл или парола' }, { status: 401 })
    }

    // Успешен вход — нулирай лимита
    resetRateLimit(rateLimitKey)

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
