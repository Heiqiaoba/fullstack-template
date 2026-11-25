/**
 * Home 页面组件测试：验证页面在空数据场景下仍能正常渲染连通提示横幅。
 *
 * 做法：mock useUsers 返回空列表、mock signOut 避免真实认证调用，
 * 用 MemoryRouter 提供 Link 所需的路由上下文；关键断言是连通提示文案存在。
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/users', () => ({
  useUsers: () => ({
    data: { items: [], total: 0, page: 1, pageSize: 10 },
    isLoading: false,
    error: null,
  }),
}));
vi.mock('@/lib/auth-client', () => ({ signOut: vi.fn() }));

import { Home } from './Home';

describe('Home', () => {
  it('renders the connected banner', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByText(/前后端已连通/)).toBeInTheDocument();
  });
});
