import { useRole } from '@/lib/role';
import { Spin } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  allow: ('admin' | 'user')[];
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * 细粒度角色渲染门禁（客户端体验层）：
 * - 真正的安全边界永远在后端 requireAdmin 守卫，这里只控制展示
 * - 用法：<RoleGate allow={['admin']}><AdminPanel /></RoleGate>
 */
export function RoleGate({ allow, children, fallback = null }: Props) {
  const role = useRole();
  if (!role) return <Spin size="small" />;
  return <>{allow.includes(role) ? children : fallback}</>;
}
