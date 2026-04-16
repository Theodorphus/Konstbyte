import AdminTestimonialsClient from '@/components/AdminTestimonialsClient'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'

export default async function AdminTestimonialsPage() {
  const user = await getCurrentUser()
  if (!user || !isAdmin(user.email)) {
    redirect('/')
  }

  return <AdminTestimonialsClient />
}
