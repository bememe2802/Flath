export type ApiEnvelope<T> = {
  code: number
  result: T
}

export type UserProfile = {
  id: string
  userId: string
  username: string
  avatar?: string | null
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  dob?: string | null
  city?: string | null
}

export type Post = {
  id: string
  content: string | null
  userId: string
  username: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  city?: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  likedByMe: boolean
  sharedPostId?: string | null
  sharedPost?: Post | null
  created: string
  createdDate?: string
  modifiedDate?: string
}

export type PostComment = {
  id: string
  postId: string
  userId: string
  parentCommentId?: string | null
  username: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  content: string
  likeCount: number
  likedByMe: boolean
  replies: PostComment[]
  created: string
  createdDate?: string
}

export type PostReaction = {
  liked: boolean
  likeCount: number
}

export type PageResponse<T> = {
  currentPage: number
  pageSize: number
  totalPages: number
  totalElements: number
  data: T[]
}

export type ParticipantInfo = {
  userId: string
  username: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
}

export type Conversation = {
  id: string
  type: string
  participantsHash?: string
  conversationAvatar?: string | null
  conversationName?: string | null
  participants: ParticipantInfo[]
  createdDate?: string
  modifiedDate?: string
}

export type ChatMessage = {
  id: string
  conversationId: string
  me: boolean
  message: string
  sender: ParticipantInfo
  createdDate?: string
}

export type ChatSocketEvent = {
  type: 'MESSAGE' | 'ERROR'
  message?: ChatMessage
  error?: string
}

export type FileUpload = {
  originalFileName: string
  url: string
}

export type EmailReceipt = {
  messageId: string
}

export type InAppNotification = {
  id: string
  actorUserId: string
  actorUsername?: string | null
  actorFirstName?: string | null
  actorLastName?: string | null
  actorAvatar?: string | null
  type: string
  title: string
  message: string
  postId?: string | null
  read: boolean
  createdDate?: string
}

export type NotificationFeed = {
  data: InAppNotification[]
  unreadCount: number
}

export type StudySession = {
  id: string
  userId: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  focusLabel?: string | null
  createdDate?: string
}

export type StudyChartPoint = {
  dateKey: string
  label: string
  totalSeconds: number
}

export type StudyStats = {
  totalSeconds: number
  todaySeconds: number
  weekSeconds: number
  monthSeconds: number
  yearSeconds: number
  streakDays: number
  chart: StudyChartPoint[]
}

export type StudyLeaderboardEntry = {
  userId: string
  username: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  city?: string | null
  totalSeconds: number
  weekSeconds: number
  streakDays: number
}

export type HomeBffResponse = {
  profile: UserProfile | null
  feed: PageResponse<Post>
  studyStats: StudyStats
}

export type MeBffResponse = {
  profile: UserProfile | null
  posts: PageResponse<Post>
  studyStats: StudyStats
}

export type LeagueBffResponse = {
  profile: UserProfile | null
  entries: StudyLeaderboardEntry[]
}
