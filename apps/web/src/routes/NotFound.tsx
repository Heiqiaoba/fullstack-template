/**
 * 404 页面：App.tsx 路由表中的 `*` 兜底路由对应的组件。
 * 使用 antd Result 展示「页面不存在」，并提供「回首页」按钮。
 */
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * 404 页面组件。
 * @returns 含返回首页按钮的结果页 JSX
 */
export function NotFound() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="页面不存在"
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          回首页
        </Button>
      }
    />
  );
}
