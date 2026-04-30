import HomePageClient from '@/src/components/home/HomePageClient'
import { getHomeBff } from '@/src/server/bff'

export default async function HomePage() {
  const homeData = await getHomeBff()

  return (
    <HomePageClient initialPosts={homeData.feed.data} />
  )
}
