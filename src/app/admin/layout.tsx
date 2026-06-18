import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import Navbar from '@/components/Navbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  return (
    <div className="theme-dark min-h-screen flex flex-col">
      <Navbar name={session.name} role={session.role} hasAI hasBook />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
