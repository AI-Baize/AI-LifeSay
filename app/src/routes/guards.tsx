import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { landing } from '../services/bootstrap';
import { MigrationFailurePanel } from '../components/MigrationFailurePanel';

// 启动与同意门禁：未完成必要说明或未建立档案时，不进入家长区。
export function RequireReady({ children }: { children: ReactNode }) {
  const status = useAppStore(s => s.status);
  const snapshot = useAppStore(s => s.snapshot);
  const errorCode = useAppStore(s => s.errorCode);

  if (status === 'loading') return <p className="notice">读取本机数据中…</p>;
  if (status === 'error' || !snapshot) {
    // C-10/G-4：升级失败给专用提示，不落成普通读取失败文案。
    if (errorCode === 'MIGRATION_FAILED') return <MigrationFailurePanel />;
    return <p className="notice error">本机数据读取失败，请重试。</p>;
  }

  const target = landing(snapshot);
  if (target !== '/today') return <Navigate to={target} replace />;
  return <>{children}</>;
}
