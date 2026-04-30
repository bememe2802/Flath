import ProfilePageClient from '@/src/components/profile/ProfilePageClient'
import { getMeBff } from '@/src/server/bff'

export default async function ProfilePage() {
  const meData = await getMeBff()

  return (
    <ProfilePageClient
      initialProfile={meData.profile}
      initialPosts={meData.posts.data}
      initialStudyStats={meData.studyStats}
    />
  )
}
