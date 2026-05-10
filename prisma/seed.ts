import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@hodlclub.eu'
  const password = process.env.ADMIN_PASSWORD || 'Icko2501'
  const name = process.env.ADMIN_NAME || 'Администратор'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✓ Администраторът вече съществува: ${email}`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: 'admin',
    },
  })

  console.log(`✓ Администраторски акаунт създаден!`)
  console.log(`  Имейл: ${email}`)
  console.log(`  Парола: ${password}`)
  console.log(`  !! Смени паролата след първи вход !!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
