import z from 'zod'

export const UserProfileRes = z.object({
  code: z.number(),
  result: z.object({
    id: z.string(),
    userId: z.string(),
    username: z.string(),
    avatar: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    dob: z.string().nullable().optional(),
    city: z.string().nullable().optional()
  })
})
export type UserProfileResType = z.TypeOf<typeof UserProfileRes>

export const UpdateProfileBody = z.object({
  firstName: z.string().min(1, 'Cannot be empty').max(100).nullable().optional(),
  lastName: z.string().min(1, 'Cannot be empty').max(100).nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional(),
  dob: z.string().nullable().optional(),
  city: z.string().max(100).nullable().optional()
})
export type UpdateProfileBodyType = z.TypeOf<typeof UpdateProfileBody>
