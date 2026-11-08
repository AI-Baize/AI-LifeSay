import type { SaveStatus } from '../stores/uiStore';
const LABEL: Record<SaveStatus, string> = { idle: '', saving: '保存中…', saved: '已保存', error: '保存失败' };
export function SaveStateIndicator({ status }: { status: SaveStatus }) {
  return (
    <p className="save-state" aria-live="polite">
      {LABEL[status]}
    </p>
  );
}
