import AdminTestimonialsClient from '../../../components/AdminTestimonialsClient'
import { getCurrentUser } from '../../../lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminTestimonialsPage() {
  const user = await getCurrentUser()
  const allowed = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').split(',').map(s=>s.trim()).filter(Boolean)
  if (!user || !user.email || !allowed.includes(user.email)) {
    redirect('/')
  }

  return <AdminTestimonialsClient />
}
