import z from 'zod'

export const RegisterBody = z
  .object({
    username: z.string().trim().min(4).max(256),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100)
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu không khớp',
        path: ['confirmPassword']
      })
    }
  })

export type RegisterBodyType = z.TypeOf<typeof RegisterBody>

export const RegisterRes = z.object({
  code: z.number(),
  result: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().nullable().optional(),
    emailVerified: z.boolean().optional()
  })
})

export type RegisterResType = z.TypeOf<typeof RegisterRes>

export const LoginBody = z
  .object({
    username: z.string().min(3).max(100),
    password: z.string().min(3).max(100)
  })
  .strict()

export type LoginBodyType = z.TypeOf<typeof LoginBody>

export const LoginRes = z.object({
  code: z.number(),
  result: z.object({
    token: z.string(),
    expiryTime: z.string().nullable()
  })
})

export type LoginResType = z.TypeOf<typeof LoginRes>
