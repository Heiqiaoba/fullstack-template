/**
 * API 契约一致性测试（编译期断言）。
 *
 * 用 OpenAPI 生成的 `paths` 类型反向校验 shared 包中的 Paginated<User>/Paginated<Todo>：
 * 后端 schema 改动后若忘记重新生成类型，这里会先报类型不一致，避免前后端悄悄失配。
 */
import type { Paginated, Todo, User } from '@template/shared';
import { describe, expect, it } from 'vitest';
import type { paths } from './generated';

/**
 * 契约校验：用 OpenAPI 生成的类型反向约束 shared 契约。
 * 后端 schema 改动后若忘记 `pnpm api:generate`，这里会先报类型不一致。
 */
type UserList = paths['/api/v1/users']['get']['responses']['200']['content']['application/json'];
type TodoList = paths['/api/v1/todos']['get']['responses']['200']['content']['application/json'];

describe('API contract', () => {
  // 关键断言不是运行时 expect，而是赋值语句的类型检查：结构不兼容时 tsc 直接报错。
  it('OpenAPI user list shape matches the shared Paginated<User> type', () => {
    // 类型赋值即断言：结构不一致时 tsc 报错
    const check = (value: UserList): Paginated<User> => value;
    expect(typeof check).toBe('function');
  });

  it('OpenAPI todo list shape matches the shared Paginated<Todo> type', () => {
    const check = (value: TodoList): Paginated<Todo> => value;
    expect(typeof check).toBe('function');
  });
});
