export function PauseSheet({
  open,
  onResume,
  onEnd
}: {
  open: boolean;
  onResume: () => void;
  onEnd: () => void;
}) {
  if (!open) return null;
  return (
    <div className="card" role="dialog" aria-label="活动已暂停">
      <p>活动已暂停。</p>
      <div className="row">
        <button type="button" onClick={onResume}>
          继续活动
        </button>
        <button type="button" onClick={onEnd}>
          结束并记录
        </button>
      </div>
    </div>
  );
}
