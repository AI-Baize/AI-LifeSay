import type { NextStep } from '../content/types';
export function NextStepCard({
  value,
  onAccept,
  onDismiss
}: {
  value: NextStep;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { suggestion } = value;
  return (
    <section className="card">
      <h2>{suggestion.action}</h2>
      <p>{suggestion.reason}</p>
      <p>下次帮助：{['一起说','先等再帮','换个场景'][suggestion.target_level]??'按当前安排'}；证据 {suggestion.evidence_ids.length} 条。</p>
      {value.decision_state&&value.decision_state!=='pending'?<p role="status">{value.decision_state==='accepted'?'已采用观察建议，下次准备时可查看。':'已保留当前安排。'}</p>:<div className="row">
        <button type="button" onClick={onAccept}>
          接受建议
        </button>
        <button type="button" onClick={onDismiss}>
          保持当前
        </button>
      </div>}
      {suggestion.pause && <p>建议先暂停，待孩子愿意参与时再试。</p>}
    </section>
  );
}
