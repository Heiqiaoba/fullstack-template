/**
 * 用户（User）数据访问 hooks。
 *
 * 架构位置：位于 api/client 之上，为 Home、Admin 等页面提供带缓存的用户列表查询；
 * 该接口在后端受保护，未登录时 api/client 的 401 处理器会统一跳登录。
 */
import { useQuery } from '@tanstack/react-query';
import type { Paginated, User } from '@template/shared';
import { api } from './client';
import { userKeys } from './keys';

/**
 * 拉取分页用户列表。
 * @param page 页码，默认 1
 * @param pageSize 每页条数，默认 20
 * @returns 分页用户结果
 */
async function fetchUsers(page = 1, pageSize = 20): Promise<Paginated<User>> {
  return api.get<Paginated<User>>('/users', { params: { page, pageSize } });
}

/**
 * 查询用户列表（按分页参数缓存，key 来自 userKeys 工厂）。
 * @param page 页码，默认 1
 * @param pageSize 每页条数，默认 20
 * @returns useQuery 结果（data/loading/error 等）
 */
export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: userKeys.list(page, pageSize),
    queryFn: () => fetchUsers(page, pageSize),
  });
}
