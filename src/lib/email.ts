import { Resend } from 'resend'

const FROM = 'HODLClub <noreply@hodlclub.bg>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://courses.hodlclub.eu'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key || key.startsWith('re_placeholder')) return null
  return new Resend(key)
}

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Добре дошъл в HODLClub! 🎉',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #4f46e5;">Добре дошъл, ${name}! 👋</h1>
        <p>Радваме се, че се присъедини към HODLClub.</p>
        <p>Вече имаш достъп до своя курс. Можеш да започнеш веднага:</p>
        <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Към курса →
        </a>
        <p style="color:#888;font-size:13px;margin-top:24px;">
          Напомняме, че всички курсове са само с образователна цел и не представляват финансов съвет.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;">© 2026 HODLClub. Всички права запазени.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resend = getResend()
  if (!resend) return
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Смяна на парола — HODLClub',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #4f46e5;">Смяна на парола</h1>
        <p>Получихме заявка за смяна на паролата ти в HODLClub.</p>
        <p>Кликни на бутона по-долу, за да зададеш нова парола. Линкът е валиден 1 час.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Смени паролата →
        </a>
        <p style="color:#888;font-size:13px;">Ако не си поискал смяна на парола, игнорирай този имейл.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;">© 2026 HODLClub. Всички права запазени.</p>
      </div>
    `,
  })
}
