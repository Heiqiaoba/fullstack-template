/**
 * 待办（Todo）数据访问与状态管理 hooks。
 *
 * 架构位置：位于 api/client（HTTP 底座）与 routes/Todos（页面组件）之间，
 * 用 TanStack Query 把「请求 + 缓存 + 失效 + 乐观更新」封装成可复用的 hooks，
 * 页面只调用 hooks，不直接发起请求或维护 loading/error 状态。
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTodoInput, Paginated, Todo, UpdateTodoInput } from '@template/shared';
import { api } from './client';
import { todoKeys } from './keys';

/**
 * 拉取分页待办列表。
 * @param page 页码
 * @param pageSize 每页条数
 * @returns 分页结果
 */
async function fetchTodos(page: number, pageSize: number): Promise<Paginated<Todo>> {
  return api.get<Paginated<Todo>>('/todos', { params: { page, pageSize } });
}

/**
 * 新建待办。
 * @param input 新建入参
 * @returns 创建出的待办
 */
async function createTodo(input: CreateTodoInput): Promise<Todo> {
  return api.post<Todo>('/todos', input);
}

/**
 * 更新待办：把 id 从参数中剥离，仅把剩余字段作为 PATCH 请求体。
 * @param input 含 id 的更新入参
 * @returns 更新后的待办
 */
async function updateTodo({ id, ...input }: UpdateTodoInput & { id: string }): Promise<Todo> {
  return api.patch<Todo>(`/todos/${id}`, input);
}

/**
 * 删除待办。
 * @param id 待办 id
 */
async function deleteTodo(id: string): Promise<void> {
  return api.delete<void>(`/todos/${id}`);
}

/**
 * 查询待办列表（按分页参数缓存）。
 * @param page 页码，默认 1
 * @param pageSize 每页条数，默认 20
 * @returns useQuery 结果（data/loading/error 等）
 */
export function useTodos(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: todoKeys.list(page, pageSize),
    queryFn: () => fetchTodos(page, pageSize),
  });
}

/**
 * 新建待办 mutation；成功后失效所有 todos 查询以刷新列表。
 * @returns useMutation 结果
 */
export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

/**
 * 更新待办 mutation：采用乐观更新——先改缓存让 UI 立即响应，失败时回滚到变更前快照，
 * 无论成功失败最终都失效查询以与服务端对齐。
 * @returns useMutation 结果
 */
export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTodo,
    // 乐观更新：先改缓存，失败自动回滚
    onMutate: async ({ id, ...input }) => {
      await qc.cancelQueries({ queryKey: todoKeys.all });
      const previous = qc.getQueriesData<Paginated<Todo>>({ queryKey: todoKeys.all });
      qc.setQueriesData<Paginated<Todo>>({ queryKey: todoKeys.all }, (old) =>
        old ? { ...old, items: old.items.map((t) => (t.id === id ? { ...t, ...input } : t)) } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, value] of ctx.previous) qc.setQueryData(key, value);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

/**
 * 删除待办 mutation；成功后失效所有 todos 查询以刷新列表。
 * @returns useMutation 结果
 */
export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  });
}
