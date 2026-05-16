import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ error: 'Не сте влезли в акаунта си' }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password) {
      return Response.json({ error: 'Моля, въведете паролата си за потвърждение' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return Response.json({ error: 'Потребителят не е намерен' }, { status: 404 })
    }

    // Потвърди паролата преди изтриване
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return Response.json({ error: 'Грешна парола' }, { status: 401 })
    }

    // Изтрий акаунта — cascade ще изтрие прогреса, достъпа до курсовете и т.н.
    await prisma.user.delete({ where: { id: session.userId } })

    // Изтрий сесийния cookie
    const cookieStore = await cookies()
    cookieStore.delete('session')

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}
