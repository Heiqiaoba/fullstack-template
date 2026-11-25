/**
 * 登录守卫（路由级组件）。
 *
 * 架构位置：在 App.tsx 中包裹需要登录的路由（首页、待办页），
 * 通过 lib/auth-client 的 useSession 判断会话状态。
 *
 * 安全说明：这是纯客户端体验层——未登录时跳转到登录页并记录来源以便登录后返回，
 * 真正的安全边界在后端受保护接口；前端守卫可被绕过，不能作为权限依据。
 */
import { useSession } from '@/lib/auth-client';
import { Spin } from 'antd';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * 受保护路由容器。
 * @param children 已登录时才渲染的子树
 * @returns 加载中显示 Spin；未登录时重定向到 /login（state.from 记录来源）；否则渲染 children
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
