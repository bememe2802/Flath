import http from '@/src/lib/http'
import {
  UpdateProfileBodyType,
  UserProfileResType
} from '@/src/schemaValidations/profile.schema'
import type { ApiEnvelope, UserProfile } from '@/src/types/domain'

const profileApiRequest = {
  getMyProfile: () => http.get<UserProfileResType>('/profile/users/my-profile'),
  getAllProfiles: () => http.get<ApiEnvelope<UserProfile[]>>('/profile/users'),
  updateMyProfile: (body: UpdateProfileBodyType) =>
    http.put<UserProfileResType>('/profile/users/my-profile', body),
  updateAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.put<UserProfileResType>('/profile/users/avatar', formData)
  },
  searchProfiles: (keyword: string) =>
    http.post<ApiEnvelope<UserProfile[]>>('/profile/users/search', { keyword }),
  getMyProfileFromServer: (sessionToken: string) =>
    http.get<UserProfileResType>('/profile/users/my-profile', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    })
}

export default profileApiRequest
