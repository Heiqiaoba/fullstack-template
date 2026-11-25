import { Alert } from 'antd';
import type { ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';
import { RoleGate } from './RoleGate';

/** 管理端路由守卫：登录 + 管理员角色，双重校验（客户端体验层） */
export function AdminGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <RoleGate
        allow={['admin']}
        fallback={<Alert type="warning" message="需要管理员权限" showIcon />}
      >
        {children}
      </RoleGate>
    </AuthGuard>
  );
}
