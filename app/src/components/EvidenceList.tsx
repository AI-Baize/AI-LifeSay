import { Link } from 'react-router-dom';
import type { ActivityRecord } from '../content/types';
export function EvidenceList({ records }: { records: readonly ActivityRecord[] }) {
  if (!records.length) return <p className="notice">没有可引用的证据记录。</p>;
  return (
    <ul>
      {records.map(row => (
        <li key={row.id}>
          <Link to={`/records/${row.id}`}>
            {new Date(row.occurred_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} ·{' '}
            {row.selection_snapshot.target_label_snapshot} · {row.outcome ?? '未知'}
          </Link>
        </li>
      ))}
    </ul>
  );
}
