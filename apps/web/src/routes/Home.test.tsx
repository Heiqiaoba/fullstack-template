import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/users', () => ({
  useUsers: () => ({ data: [], isLoading: false, error: null }),
}));

import { Home } from './Home';

describe('Home', () => {
  it('renders the connected banner', () => {
    render(<Home />);
    expect(screen.getByText(/前后端已连通/)).toBeInTheDocument();
  });
});
