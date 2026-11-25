import { useQuery } from '@tanstack/react-query';
import type { Paginated, User } from '@template/shared';
import { apiClient } from './client';

async function fetchUsers(page = 1, pageSize = 20): Promise<Paginated<User>> {
  const { data } = await apiClient.get('/users', { params: { page, pageSize } });
  return data;
}

export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => fetchUsers(page, pageSize),
  });
}
