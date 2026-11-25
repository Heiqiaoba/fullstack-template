/**
 * 用户领域契约：角色、用户资料与注册/登录/资料更新的输入 schema。
 *
 * 这些 schema 是「单一契约源」：server 用来校验请求与约束响应，web 用来推导类型。
 * 角色仅区分 `user` / `admin`，权限的最终裁决永远在后端。
 */
import { z } from 'zod';

/** 用户角色枚举：默认 user，管理员由 ADMIN_USER_IDS 或 admin 插件授予 */
export const userRoleSchema = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * 对外暴露的用户信息：不含密码哈希等敏感字段。
 * email/role 由服务端填充，客户端不可伪造。
 */
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.email(),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

/** 注册请求：昵称 2~100，邮箱合法，密码 8~128（存储由服务端哈希） */
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** 登录请求：邮箱 + 非空密码，密码长度校验交给注册环节以避免泄露策略细节 */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** 用户档案（扩展资料）：与用户基础信息分离，按 userId 关联 */
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
