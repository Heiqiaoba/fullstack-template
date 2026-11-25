import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTodoInput, Paginated, Todo, UpdateTodoInput } from '@template/shared';
import { apiClient } from './client';

async function fetchTodos(page: number, pageSize: number): Promise<Paginated<Todo>> {
  const { data } = await apiClient.get('/todos', { params: { page, pageSize } });
  return data;
}

async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const { data } = await apiClient.post('/todos', input);
  return data;
}

async function updateTodo({ id, ...input }: UpdateTodoInput & { id: string }): Promise<Todo> {
  const { data } = await apiClient.patch(`/todos/${id}`, input);
  return data;
}

async function deleteTodo(id: string): Promise<void> {
  await apiClient.delete(`/todos/${id}`);
}

export function useTodos(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['todos', page, pageSize],
    queryFn: () => fetchTodos(page, pageSize),
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTodo,
    // 乐观更新：先改缓存，失败自动回滚
    onMutate: async ({ id, ...input }) => {
      await qc.cancelQueries({ queryKey: ['todos'] });
      const previous = qc.getQueriesData<Paginated<Todo>>({ queryKey: ['todos'] });
      qc.setQueriesData<Paginated<Todo>>({ queryKey: ['todos'] }, (old) =>
        old ? { ...old, items: old.items.map((t) => (t.id === id ? { ...t, ...input } : t)) } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, value] of ctx.previous) qc.setQueryData(key, value);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}
