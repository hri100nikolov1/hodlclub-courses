import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { hasAnyCourseAccess } from '@/lib/access'
import SimulatorClient from './SimulatorClient'

export default async function SimulatorPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!(await hasAnyCourseAccess(session))) redirect('/dashboard')

  return <SimulatorClient />
}
