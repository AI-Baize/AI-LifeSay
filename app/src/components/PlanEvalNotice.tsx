import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Level } from '../content/types';
import { planEvalPrefillLevel, type StoredPlanEval } from '../domain/planEvaluation';
import { loadPlanEval } from '../services/planEvaluationStore';
import { useAppStore } from '../stores/appStore';
function scopedEvaluation(themeId?:string,taskId?:string){
  const rec=loadPlanEval();
  if(!rec||!themeId)return rec;
  const session=useAppStore.getState().snapshot?.sessions.find(s=>s.id===rec.session_id&&s.deleted_at===null);
  return session?.selection_snapshot.theme_id===themeId&&(!taskId||session.selection_snapshot.task_id===taskId)?rec:null;
}

// P2 · B2d：下一次活动入口的「上次评估建议」提示（仅推荐，家长可覆盖）。
// - 读取本机评估状态；已保持当前（dismissed）的建议不再提示。
// - 不改目标、不写记录；真正的调整走既有目标确认（支架调整）与玩法/场景切换入口。

function formatDate(ts: number): string {
  return new Date(ts + 8 * 3600000).toISOString().slice(0, 10);
}

export function PlanEvalNotice({themeId,taskId}:{themeId?:string;taskId?:string}={}) {
  const [rec] = useState<StoredPlanEval | null>(() => scopedEvaluation(themeId,taskId));
  if (!rec || rec.decision === 'dismissed') return null;
  return (
    <section className="card" aria-label="上次评估建议">
      <h2>上次评估建议（仅推荐）</h2>
      <p>
        {rec.suggestion.title_zh}：{rec.suggestion.detail_zh}
      </p>
      <p className="notice">
        来自 {formatDate(rec.saved_at)} 的活动评估。家长可覆盖：在下方自行选择支持方式即覆盖本建议；不自动升档、不写能力记录。
      </p>
      {rec.suggestion.mode_id ? (
        <p>
          <Link to="/modes">去看玩法一览（课内玩法变体，不建会话不写记录）</Link>
        </p>
      ) : null}
    </section>
  );
}

/** 已接受的「更换难度」建议 → 目标确认页支架档预选（家长可改，确认前不生效）。 */
export function planEvalLevelPrefill(themeId?:string,taskId?:string): Level | null {
  return planEvalPrefillLevel(scopedEvaluation(themeId,taskId));
}

export default PlanEvalNotice;
