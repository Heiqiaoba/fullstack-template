import { Alert, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';

type QueryLike<TData> = {
  isLoading: boolean;
  error: Error | null;
  data: TData | undefined;
};

type Props<TData> = {
  /** 传入 useQuery 的返回值 */
  query: QueryLike<TData>;
  children: (data: TData) => ReactNode;
  empty?: ReactNode;
};

/**
 * 统一渲染查询的 loading / error / empty / success 四态，
 * 避免每个页面重复写三元嵌套。
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
