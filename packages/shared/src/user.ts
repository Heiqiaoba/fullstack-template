import { z } from 'zod';

/** 用户基础信息（对外暴露，不含敏感字段） */
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

/** 注册请求 */
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** 登录请求 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
