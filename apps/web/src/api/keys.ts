/**
 * TanStack Query 的 queryKey 工厂（缓存键的单一事实来源）。
 *
 * 架构位置：被 api/todos、api/users 的 hooks 与业务组件的 invalidateQueries 共同引用，
 * 是查询缓存与失效逻辑之间的契约。
 *
 * 设计决策（为什么集中管理能避免 invalidate 遗漏）：
 * - 所有 key 由同一处生成，调用方只通过工厂取键，不再手写字符串数组；
 * - 层级化设计：`all`（根）→ `lists()`（列表集合）→ `list(page, pageSize)`（带参数的具体页），
 *   TanStack Query 按前缀匹配失效，因此 invalidate `all` 可覆盖全部派生 key，
 *   invalidate `lists()` 只影响列表而保留详情；
 * - 带参数的 key 由函数统一构造，新增分页/筛选参数时只需改这里，
 *   不会出现「查询用了 { page, filter } 而失效只写了 ['todos','list']」这类前缀对不上导致的漏刷。
 */

/** 待办相关的 queryKey 工厂 */
export const todoKeys = {
  /** 根 key：失效它可命中所有 todos 派生 key */
  all: ['todos'] as const,
  /** 列表集合 key：用于只失效待办列表 */
  lists: () => [...todoKeys.all, 'list'] as const,
  /**
   * 带分页参数的列表 key。
   * @param page 页码
   * @param pageSize 每页条数
   */
  list: (page: number, pageSize: number) => [...todoKeys.lists(), { page, pageSize }] as const,
};

/** 用户相关的 queryKey 工厂（结构与 todoKeys 一致） */
export const userKeys = {
  /** 根 key：失效它可命中所有 users 派生 key */
  all: ['users'] as const,
  /** 列表集合 key：用于只失效用户列表 */
  lists: () => [...userKeys.all, 'list'] as const,
  /**
   * 带分页参数的列表 key。
   * @param page 页码
   * @param pageSize 每页条数
   */
  list: (page: number, pageSize: number) => [...userKeys.lists(), { page, pageSize }] as const,
};
