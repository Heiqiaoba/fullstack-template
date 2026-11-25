import { setUnauthorizedHandler } from '@/api/client';
import { getSession } from '@/lib/auth-client';
import { queryClient } from '@/lib/queryClient';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 把「API 401」与路由/会话状态接通：
 * - 清掉查询缓存中的旧数据
 * - 直接跳转登录页（带 from），避免各业务组件重复处理 401
 */
export function ApiAuthSync() {
  const navigate = useNavigate();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      void getSession();
      navigate('/login', { replace: true, state: { from: window.location.pathname } });
    });
    return () => setUnauthorizedHandler(() => {});
  }, [navigate]);
  return null;
}
