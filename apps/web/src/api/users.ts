import { useQuery } from '@tanstack/react-query';
import type { Paginated, User } from '@template/shared';
import { api } from './client';
import { userKeys } from './keys';

async function fetchUsers(page = 1, pageSize = 20): Promise<Paginated<User>> {
  return api.get<Paginated<User>>('/users', { params: { page, pageSize } });
}

export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: userKeys.list(page, pageSize),
    queryFn: () => fetchUsers(page, pageSize),
  });
}
