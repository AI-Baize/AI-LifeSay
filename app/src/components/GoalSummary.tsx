import type { TargetSelection } from '../content/types';
export function GoalSummary({ selection }: { selection: TargetSelection | null }) {
  if (!selection) return <p className="notice">还没有确认目标。</p>;
  return (
    <section className="card">
      <p>当前目标：{selection.target_label_snapshot}</p>
      <p>支持方式：{selection.support_label_snapshot}</p>
      <p><small>按孩子这次的状态给予帮助，可以随时调整。</small></p>
    </section>
  );
}
