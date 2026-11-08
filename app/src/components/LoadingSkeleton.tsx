export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" aria-busy="true" aria-label="正在读取本机数据">
      {Array.from({ length: lines }, (_, i) => (
        <p key={i}>读取中…</p>
      ))}
    </div>
  );
}
