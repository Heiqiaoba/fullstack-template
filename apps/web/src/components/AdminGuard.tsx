/**
 * 管理端路由守卫（组合式守卫组件）。
 *
 * 架构位置：在 App.tsx 中包裹 /admin 路由，复用 AuthGuard（先登录）+ RoleGate（再校验角色）。
 *
 * 安全说明：双重校验都属于客户端体验层，仅用于给出「需要管理员权限」的友好提示；
 * 即使绕过此守卫进入页面，数据接口仍由后端 admin 插件拦截，真正的安全边界永远在后端。
 */
import { Alert } from 'antd';
import type { ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';
import { RoleGate } from './RoleGate';

/**
 * 登录 + admin 角色双重校验的容器。
 * @param children 通过校验后才渲染的子树
 * @returns 未登录跳登录页；已登录但非 admin 显示警告；否则渲染 children
 */
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
