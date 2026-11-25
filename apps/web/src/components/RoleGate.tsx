/**
 * 细粒度角色门禁组件（按 allow 列表控制子树是否渲染）。
 *
 * 架构位置：被 AdminGuard 组合使用，也可单独用于页面内的按钮/区块级展示控制。
 *
 * 安全说明：这只是客户端体验层——只控制「看不看得见」，不构成安全边界；
 * 用户可通过 DevTools 绕过前端判断，真正的权限校验必须由后端 requireAdmin 守卫完成。
 */
import { useSession } from '@/lib/auth-client';
import { useRole } from '@/lib/role';
import { Alert, Spin } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  /** 允许看到的角色白名单 */
  allow: ('admin' | 'user')[];
  /** 角色命中时渲染的子树 */
  children: ReactNode;
  /** 角色不匹配时的替代内容，默认不渲染任何内容 */
  fallback?: ReactNode;
};

/**
 * 按当前用户角色决定渲染 children 还是 fallback。
 *
 * 三态区分（避免「未知角色永远转圈」）：
 * - isPending：会话还在加载 → Spin 占位，避免权限就绪前的闪烁；
 * - 会话加载完成但角色未知/未登录 → 直接渲染 fallback（明确「无权限」而非无限 loading）；
 * - 会话接口报错 → 显式错误提示，与「无权限」区分开。
 */
export function RoleGate({ allow, children, fallback = null }: Props) {
  const { isPending, error } = useSession();
  const role = useRole();
  if (isPending) return <Spin size="small" />;
  if (error) {
    return <Alert type="error" showIcon message="会话状态获取失败，请刷新重试" />;
  }
  if (!role) return <>{fallback}</>;
  return <>{allow.includes(role) ? children : fallback}</>;
}
