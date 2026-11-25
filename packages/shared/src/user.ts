import { z } from 'zod';

/** 用户基础信息（对外暴露，不含敏感字段） */
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.email(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

/** 注册请求 */
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** 登录请求 */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** 用户档案 */
export const profileSchema = z.object({
  userId: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

/** 更新用户资料（昵称、头像） */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
