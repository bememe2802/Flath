import http from '@/src/lib/http'
import {
  LoginBodyType,
  LoginResType,
  RegisterBodyType,
  RegisterResType
} from '@/src/schemaValidations/auth.schema'

const authApiRequest = {
  login: (body: LoginBodyType) =>
    http.post<LoginResType>('/identity/auth/token', body),
  register: (body: Omit<RegisterBodyType, 'confirmPassword'>) =>
    http.post<RegisterResType>('/identity/users/registration', body),
  auth: (body: { sessionToken: string; expiresAt: string }) =>
    http.post('/api/auth', body, {
      baseUrl: ''
    }),
  logoutClient: () =>
    http.post(
      '/api/auth/logout',
      {},
      {
        baseUrl: ''
      }
    )
}

export default authApiRequest
