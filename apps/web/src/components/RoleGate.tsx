/**
 * 细粒度角色门禁组件（按 allow 列表控制子树是否渲染）。
 *
 * 架构位置：被 AdminGuard 组合使用，也可单独用于页面内的按钮/区块级展示控制。
 *
 * 安全说明：这只是客户端体验层——只控制「看不看得见」，不构成安全边界；
 * 用户可通过 DevTools 绕过前端判断，真正的权限校验必须由后端 requireAdmin 守卫完成。
 */
import { useRole } from '@/lib/role';
import { Spin } from 'antd';
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
 * 角色尚未加载（undefined）时先显示 Spin 占位，避免权限就绪前的闪烁。
 * @param props 见 Props
 */
export function RoleGate({ allow, children, fallback = null }: Props) {
  const role = useRole();
  if (!role) return <Spin size="small" />;
  return <>{allow.includes(role) ? children : fallback}</>;
}
