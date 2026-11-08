import { Component, type ReactNode } from 'react';
interface Props { children: ReactNode }
interface State { hasError: boolean }
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(): void {
    // 仅记录固定技术码；不写异常正文、昵称或备注。
  }
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main>
          <h1>页面暂时无法显示</h1>
          <p>请返回今日重新进入；本机数据不会被清除。</p>
          <a href="#/today">回到今日</a>
        </main>
      );
    }
    return this.props.children;
  }
}
