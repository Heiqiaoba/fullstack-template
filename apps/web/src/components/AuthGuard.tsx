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
import { Alert, Spin } from 'antd';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * 受保护路由容器。
 *
 * 四态区分（避免把「接口异常」误判为「未登录」导致丢失当前页）：
 * - isPending：会话加载中 → Spin；
 * - error：会话接口报错（网络抖动/后端 5xx）→ 显式错误提示，让用户手动刷新，
 *   而不是跳去登录页（用户可能本来就登录着）；
 * - 无会话 → 重定向 /login（state.from 记录来源）；
 * - 有会话 → 渲染 children。
 * @param children 已登录时才渲染的子树
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Alert
          type="error"
          showIcon
          message="会话状态获取失败"
          description="请检查网络后刷新页面重试"
        />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
