import { useQuery } from '@tanstack/react-query';
import { type User, userSchema } from '@template/shared';
import { apiClient } from './client';

async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get('/users');
  // 用共享 schema 校验后端响应，前后端契约一致
  return (data.items as unknown[]).map((item) => userSchema.parse(item));
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}
