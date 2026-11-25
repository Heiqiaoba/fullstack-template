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
