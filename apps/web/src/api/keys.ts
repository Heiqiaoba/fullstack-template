/** TanStack Query 的 queryKey 工厂：集中管理，避免 invalidate 漏掉带参数的 key */
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) => [...todoKeys.lists(), { page, pageSize }] as const,
};

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) => [...userKeys.lists(), { page, pageSize }] as const,
};
