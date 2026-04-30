import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Welcome, {session?.user?.name} ({session?.user?.role})
      </p>
    </div>
  )
}
