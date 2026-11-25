/**
 * 全局错误边界（React class 组件，位于 Provider 树最外层）。
 *
 * 架构位置：在 main.tsx 中包裹 QueryClientProvider 与整个应用，捕获子树渲染期异常，
 * 用 antd Result 展示 500 页面并提供「重试」（清空 error 触发重新渲染），避免白屏。
 * 与 useTelemetryErrors 互补：那边负责采集上报，这里负责展示与恢复。
 */
import { Button, Result } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** 需要被保护的子树 */
  children: ReactNode;
}
interface State {
  /** 捕获到的错误；非空时渲染错误页 */
  error: Error | null;
}

/** 全局错误边界：捕获渲染期异常，展示错误页而不是白屏 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  /**
   * React 在子树抛错时调用，把错误写入 state 以切换到错误 UI。
   * @param error 被捕获的渲染错误
   */
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  /**
   * 捕获后的副作用：把错误与组件栈打到控制台（不上报埋点，避免与 useTelemetryErrors 重复）。
   * @param error 被捕获的错误
   * @param info React 提供的组件栈信息
   */
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <Result
          status="500"
          title="页面出错了"
          subTitle={this.state.error.message}
          extra={
            <Button type="primary" onClick={() => this.setState({ error: null })}>
              重试
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
