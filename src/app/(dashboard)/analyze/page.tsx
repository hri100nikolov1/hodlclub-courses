import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { hasAIAccess } from '@/lib/access'
import AnalyzeClient from './AnalyzeClient'

export default async function AnalyzePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!(await hasAIAccess(session))) redirect('/dashboard')

  return <AnalyzeClient />
}
