import { readCatalog } from '../content/catalog';
import { findContext } from '../content/contexts';
import type { Result, WeeklySummary } from '../content/types';
export function OutcomeCountList({ result }: { result: Result<WeeklySummary> | null }) {
  if (!result) return <p className="notice">尚未生成周报。</p>;
  if (!result.ok) return <p className="notice error">{result.error.message}</p>;
  const summary = result.data;
  const catalog=readCatalog();
  return (
    <section className="card">
      <p>本周活动 {summary.activities} 次，活跃 {summary.active_days} 天。</p>
      <p>{summary.conclusion}</p>
      {summary.groups.map((group,index) => (
        <div key={`${group.theme_id}-${group.task_id}-${group.goal_id}-${group.level}-${group.course_id}-${group.unit_id}-${group.observation_condition_key}-${index}`}>
          <h3>{catalog.ok?catalog.data.find(t=>t.id===group.theme_id)?.tasks.find(t=>t.id===group.task_id)?.goal_zh??'观察目标':'观察目标'} · {['一起说','先等再帮','换个场景'][group.level]}</h3>
          <p>{group.course_id==='dialogue'?'对话课':group.course_id==='word_card'?'词卡课':'早期记录'}{(()=>{const c=group.observation_condition_key?findContext(group.observation_condition_key):null;return c?.ok?' · '+c.data.title_zh:'';})()}</p>
          <p>
            独立 {group.independent}／提示 {group.prompted}／尚未 {group.not_yet}／未知 {group.unknown}
          </p>
          <p>
            独立率：{group.independent_rate === null ? '不足以判断' : `${Math.round(group.independent_rate * 100)}%`}
          </p>
          <p>{group.conclusion}</p>
        </div>
      ))}
    </section>
  );
}
