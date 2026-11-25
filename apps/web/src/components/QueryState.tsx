/**
 * 查询状态统一渲染组件（四态：loading / error / empty / success）。
 *
 * 架构位置：被 Home、Todos、Admin 等页面包裹 useQuery 结果使用，
 * 取代各页面重复的 `isLoading ? ... : error ? ... : ...` 三元嵌套，
 * 让页面只关注成功态的数据渲染（children 采用 Render Prop 形式）。
 */
import { Alert, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';

/**
 * 只取 useQuery 返回值中需要的三个字段，降低与 TanStack Query 的类型耦合。
 * 这样任何提供同形字段的对象（包括测试 mock）都可传入。
 */
type QueryLike<TData> = {
  isLoading: boolean;
  error: Error | null;
  data: TData | undefined;
};

type Props<TData> = {
  /** 传入 useQuery 的返回值 */
  query: QueryLike<TData>;
  /** Render Prop：仅在成功且有数据时调用，参数是解包后的 data */
  children: (data: TData) => ReactNode;
  /** 自定义空态；未提供时用 antd Empty */
  empty?: ReactNode;
};

/**
 * 按优先级渲染查询四态：loading → error → empty → success。
 * 优先级设计：加载/错误必须先于空态判断，避免加载中把 undefined 误判为「暂无数据」。
 * @param props 见 Props
 */
export function QueryState<TData>({ query, children, empty }: Props<TData>) {
  if (query.isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (query.error) {
    return <Alert type="error" showIcon message="加载失败" description={query.error.message} />;
  }
  if (query.data === undefined || query.data === null) {
    return <>{empty ?? <Empty description="暂无数据" />}</>;
  }
  return <>{children(query.data)}</>;
}
