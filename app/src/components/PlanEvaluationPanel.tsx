import { useState } from 'react';
import type { Level } from '../content/types';
import {
  PLAN_EVAL_BOUNDARY_ZH,
  PLAN_EVAL_MODES,
  PLAN_EVAL_MODE_NOTE_ZH,
  isPlanEvalChoice,
  planEvalSuggestion,
  supportLevelLabel,
  type PlanEvalChoice,
  type PlanEvalDirection,
  type PlanEvalKind,
  type PlanEvalModeId,
  type StoredPlanEval
} from '../domain/planEvaluation';
import { decidePlanEval, loadPlanEval, savePlanEval } from '../services/planEvaluationStore';
import { StatusNotice } from './StatusNotice';

// P2 · B2d（1009 分支）：「本次评估」轻量入口。
//
// 硬边界：
// - 评估的是这次安排，不是孩子的等级；选择结果只作下一次活动的推荐建议。
// - 不改本次已记录事实、不写能力记录、不自动升档（红线 12）；家长可覆盖建议。
// - 「换玩法」只挂课内玩法变体（不建 session、不写 record）；action_rhythm 不在选项中。

const KIND_OPTIONS: { kind: PlanEvalKind; label: string }[] = [
  { kind: 'keep_level', label: '难度适中' },
  { kind: 'change_level', label: '调整下次帮助方式' },
  { kind: 'switch_mode', label: '更换玩法' },
  { kind: 'switch_scene', label: '切换场景' }
];

function buildChoice(kind: PlanEvalKind, direction: PlanEvalDirection, modeId: PlanEvalModeId): PlanEvalChoice | null {
  const draft: PlanEvalChoice =
    kind === 'change_level'
      ? { kind, direction }
      : kind === 'switch_mode'
        ? { kind, mode_id: modeId }
        : { kind };
  return isPlanEvalChoice(draft) ? draft : null;
}

export function PlanEvaluationPanel({
  sessionId,
  recordId = null,
  level
}: {
  sessionId: string;
  recordId?: string | null;
  level: Level;
}) {
  const [kind, setKind] = useState<PlanEvalKind | null>(null);
  const [direction, setDirection] = useState<PlanEvalDirection>('down');
  const [modeId, setModeId] = useState<PlanEvalModeId>('listen_identify');
  const [saved, setSaved] = useState<StoredPlanEval | null>(() => { return loadPlanEval(sessionId); });
  const [skipped, setSkipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = kind === 'change_level'
    ? planEvalSuggestion({ kind: 'change_level', direction }, level)
    : null;

  const save = () => {
    if (!kind) return;
    const choice = buildChoice(kind, direction, modeId);
    if (!choice) {
      setError('评估选项无效，请重新选择。');
      return;
    }
    const result = savePlanEval({ session_id: sessionId, record_id: recordId, choice, level });
    if (result.ok) {
      setSaved(result.data);
      setSkipped(false);
      setError(null);
    } else {
      setError(result.error.message);
    }
  };

  const decide = (decision: 'accepted' | 'dismissed') => {
    const result = decidePlanEval(decision, sessionId);
    if (result.ok && result.data) setSaved(result.data);
    else if (!result.ok) setError(result.error.message);
  };

  if (saved) {
    return (
      <section className="card" aria-label="本次评估">
        <h2>本次评估</h2>
        <p className="notice">{PLAN_EVAL_BOUNDARY_ZH}</p>
        <h3>下一次推荐建议：{saved.suggestion.title_zh}</h3>
        <p>{saved.suggestion.detail_zh}</p>
        <p className="notice">评估已保存在本机评估状态（与学习表现分开存储），不写入学习记录。</p>
        {saved.decision === 'pending' ? (
          <div className="row">
            <button type="button" onClick={() => decide('accepted')}>留作下次参考</button>
            <button type="button" onClick={() => decide('dismissed')}>不采纳这条参考</button>
          </div>
        ) : (
          <p className="notice">
            {saved.decision === 'accepted'
              ? '已接受建议：只作为下次活动的推荐，确认目标前仍可修改。'
              : '已保持当前计划；该建议仅作参考，家长可随时覆盖。'}
          </p>
        )}
      </section>
    );
  }

  if (skipped) {
    return (
      <section className="card" aria-label="本次评估">
        <h2>本次评估</h2>
        <p className="notice">已跳过本次评估；跳过不写任何值，也不影响已记录事实。</p>
        <button type="button" onClick={() => setSkipped(false)}>重新评估</button>
      </section>
    );
  }

  return (
    <section className="card" aria-label="本次评估">
      <h2>本次评估</h2>
      <p className="notice">{PLAN_EVAL_BOUNDARY_ZH}</p>
      <fieldset>
        <legend>这次安排怎么样？（可跳过）</legend>
        {KIND_OPTIONS.map(option => (
          <label key={option.kind}>
            <input
              type="radio"
              name="plan-eval-kind"
              value={option.kind}
              checked={kind === option.kind}
              onChange={() => setKind(option.kind)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {kind === 'change_level' ? (
        <fieldset>
          <legend>换难度方向</legend>
          <label>
            <input
              type="radio"
              name="plan-eval-direction"
              value="down"
              checked={direction === 'down'}
              onChange={() => setDirection('down')}
            />
            降一档（给更多支持）
          </label>
          <label>
            <input
              type="radio"
              name="plan-eval-direction"
              value="up"
              checked={direction === 'up'}
              onChange={() => setDirection('up')}
            />
            升一档（给更少提示）
          </label>
          {preview ? <p className="notice">下次建议档位：{supportLevelLabel(preview.target_level ?? level)}（L0–L2 内调整，确认前可改）</p> : null}
        </fieldset>
      ) : null}

      {kind === 'switch_mode' ? (
        <fieldset>
          <legend>换哪个玩法（课内变体）</legend>
          {PLAN_EVAL_MODES.map(mode => (
            <label key={mode.mode_id}>
              <input
                type="radio"
                name="plan-eval-mode"
                value={mode.mode_id}
                checked={modeId === mode.mode_id}
                onChange={() => setModeId(mode.mode_id as PlanEvalModeId)}
              />
              {mode.title_zh}
            </label>
          ))}
          <p className="notice">{PLAN_EVAL_MODE_NOTE_ZH}</p>
        </fieldset>
      ) : null}

      {error ? <StatusNotice error message={error} /> : null}
      <div className="row">
        <button type="button" disabled={kind === null} onClick={save}>保存本次评估</button>
        <button type="button" onClick={() => setSkipped(true)}>跳过本次评估</button>
      </div>
    </section>
  );
}

export default PlanEvaluationPanel;
