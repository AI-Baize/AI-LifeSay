export function ReportFreshnessBadge({ stale }: { stale: boolean }) {
  return <p className="notice">{stale ? '待重算：记录或目标已变化' : '当前：与最新记录一致'}</p>;
}
