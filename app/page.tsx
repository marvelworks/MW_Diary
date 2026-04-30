import LoginCard from '@/components/LoginCard'
import HomeClient from '@/components/HomeClient'
import { getCurrentUser } from '@/lib/auth'

export default async function Home() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return <LoginCard />
  }

  return <HomeClient currentUser={currentUser} />
}
