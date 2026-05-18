import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import Navbar from '@/components/Navbar'
import DisclaimerBanner from '@/components/DisclaimerBanner'
import Footer from '@/components/Footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar name={session.name} role={session.role} />
      <DisclaimerBanner />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
