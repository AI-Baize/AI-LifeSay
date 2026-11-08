export function ConflictResolutionPanel({ onReload, onRetry }: { onReload: () => void; onRetry: () => void }) {
  return (
    <section className="card" role="alertdialog" aria-label="保存冲突">
      <p>保存未确认：可能其他窗口已修改数据。</p>
      <div className="row">
        <button type="button" onClick={onReload}>
          重新读取最新数据
        </button>
        <button type="button" onClick={onRetry}>
          用同一提交重试
        </button>
      </div>
    </section>
  );
}
