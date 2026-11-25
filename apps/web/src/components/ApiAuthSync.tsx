/**
 * API 401 事件总线接线组件（无 UI 输出）。
 *
 * 架构位置：在 main.tsx 中挂载于 BrowserRouter 内，把 api/client 的 401 回调
 * （setUnauthorizedHandler）与路由、会话、查询缓存打通：
 * - 清掉 TanStack Query 缓存，防止上一个用户的缓存数据泄漏；
 * - 调 getSession() 刷新会话状态，让 AuthGuard 拿到最新登录态；
 * - 用 navigate 跳转 /login 并带上 from（来源路径），登录后可直接返回。
 *
 * 设计决策：api 层只负责「报告 401」，由本组件集中处理跳转与清理，
 * 避免各业务组件重复写 401 逻辑，也避免 api 层反向依赖 react-router。
 */
import { setUnauthorizedHandler } from '@/api/client';
import { getSession } from '@/lib/auth-client';
import { queryClient } from '@/lib/queryClient';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 注册/注销 401 处理器；组件本身不渲染任何内容。
 * 依赖 navigate，确保跳转使用当前路由上下文。
 */
export function ApiAuthSync() {
  const navigate = useNavigate();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // 先取消在途请求再清缓存：避免飞行中的响应把旧用户数据写回空缓存
      void queryClient.cancelQueries();
      queryClient.clear();
      // 刷新会话状态，让 AuthGuard 拿到最新登录态；不阻塞跳转（登录页不依赖它完成）
      void getSession();
      // from 用当前路由路径；登录成功后由 Login 页读取并跳回
      navigate('/login', { replace: true });
    });
    // 卸载时彻底注销（而非置 noop）：401 信号不会被子组件意外吞掉
    return () => setUnauthorizedHandler(undefined);
  }, [navigate]);
  return null;
}
