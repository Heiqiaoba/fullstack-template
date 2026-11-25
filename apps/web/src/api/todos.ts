import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTodoInput, Paginated, Todo, UpdateTodoInput } from '@template/shared';
import { api } from './client';
import { todoKeys } from './keys';

async function fetchTodos(page: number, pageSize: number): Promise<Paginated<Todo>> {
  return api.get<Paginated<Todo>>('/todos', { params: { page, pageSize } });
}

async function createTodo(input: CreateTodoInput): Promise<Todo> {
  return api.post<Todo>('/todos', input);
}

async function updateTodo({ id, ...input }: UpdateTodoInput & { id: string }): Promise<Todo> {
  return api.patch<Todo>(`/todos/${id}`, input);
}

async function deleteTodo(id: string): Promise<void> {
  return api.delete<void>(`/todos/${id}`);
}

export function useTodos(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: todoKeys.list(page, pageSize),
    queryFn: () => fetchTodos(page, pageSize),
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  });
}

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

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  });
}
