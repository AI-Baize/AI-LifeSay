import { GAME_MODES, POINT_LISTEN, type GameModeDef } from '../content/gameModes';
import type { Level } from '../content/types';

// P2 · B2d（1009 分支）：计划评估——评估的是「这次安排」，产出的是**下一次活动的推荐建议**。
//
// 硬边界（红线 12 / 批次3 27 号硬边界）：
// - 评估结果只作下一次活动的推荐建议：不改本次已记录事实、不产生能力 record、不自动升级。
// - 「换玩法」只挂接课内玩法变体 point_listen / listen_identify（不建 session、不写 record）。
// - action_rhythm（动作律动）改变回应模态，需另立决策，**不出现在选项中**，解析时显式拒绝。
// - 评估与能力证据彻底解耦：不进 records / reports / nextStep，存于独立本机命名空间。

export type PlanEvalKind = 'keep_level' | 'change_level' | 'switch_mode' | 'switch_scene';
export type PlanEvalModeId = 'point_listen' | 'listen_identify';
export type PlanEvalDirection = 'down' | 'up';
export type PlanEvalDecision = 'pending' | 'accepted' | 'dismissed';

export type PlanEvalChoice =
  | { kind: 'keep_level' }
  | { kind: 'change_level'; direction: PlanEvalDirection }
  | { kind: 'switch_mode'; mode_id: PlanEvalModeId }
  | { kind: 'switch_scene' };

export interface PlanEvalSuggestion {
  title_zh: string;
  detail_zh: string;
  /** 支架档建议（L0–L2）；换玩法/换场景不涉及档位时为 null。 */
  target_level: Level | null;
  /** 建议的课内玩法变体；仅 point_listen / listen_identify。 */
  mode_id: PlanEvalModeId | null;
  switch_scene: boolean;
}

/** 评估本机状态（与学习表现分开存储，同构于播放进度命名空间）。 */
export interface StoredPlanEval {
  session_id: string;
  record_id: string | null;
  choice: PlanEvalChoice;
  suggestion: PlanEvalSuggestion;
  saved_at: number;
  decision: PlanEvalDecision;
  rule_version: string;
}

export const PLAN_EVAL_RULE_VERSION = 'plan-eval-v1';
export const PLAN_EVAL_NAMESPACE = 'children-english-local:plan-eval:v1';
export const SUPPORT_LEVEL_LABELS = ['一起说', '先等再帮', '换个场景'] as const;

/** UI 边界声明：评估只作推荐建议，家长可覆盖。 */
export const PLAN_EVAL_BOUNDARY_ZH =
  '本次评估只作为下一次活动的推荐建议：不改本次已记录事实、不写能力记录、不自动升档；家长可随时覆盖建议。';
/** action_rhythm 不入选项的原因明写（透明但不提供入口）。 */
export const PLAN_EVAL_MODE_NOTE_ZH =
  '「动作律动」改变回应模态，需另立决策，不在选项中。';

export const PLAN_EVAL_MODE_IDS: readonly PlanEvalModeId[] = ['point_listen', 'listen_identify'];

/** 可推荐的玩法变体：只取回应模态不变的课内变体（27 号硬边界：不建 session、不写 record）。 */
export const PLAN_EVAL_MODES: readonly GameModeDef[] = GAME_MODES.filter(
  m => !m.changes_response_modality
);

export function supportLevelLabel(level: Level): string {
  return `L${level} ${SUPPORT_LEVEL_LABELS[level]}`;
}

export function isPlanEvalModeId(value: unknown): value is PlanEvalModeId {
  return typeof value === 'string' && (PLAN_EVAL_MODE_IDS as readonly string[]).includes(value);
}

export function isPlanEvalChoice(value: unknown): value is PlanEvalChoice {
  if (!value || typeof value !== 'object') return false;
  const choice = value as { kind?: unknown; direction?: unknown; mode_id?: unknown };
  switch (choice.kind) {
    case 'keep_level':
    case 'switch_scene':
      return true;
    case 'change_level':
      return choice.direction === 'down' || choice.direction === 'up';
    case 'switch_mode':
      // 显式拒绝 action_rhythm（改变回应模态，需另立决策）。
      return isPlanEvalModeId(choice.mode_id);
    default:
      return false;
  }
}

/**
 * 分支映射：每个评估选项给出正确的下一次建议。
 * 支架档夹取在 L0–L2 内（红线 12：不自动升级，也不设档外档位）。
 */
export function planEvalSuggestion(choice: PlanEvalChoice, currentLevel: Level): PlanEvalSuggestion {
  const label = supportLevelLabel;
  if (choice.kind === 'keep_level') {
    return {
      title_zh: '下次保持当前支架档',
      detail_zh: `继续 ${label(currentLevel)}；是否调整由跨日期、跨场景的记录证据决定，不自动升级。`,
      target_level: currentLevel,
      mode_id: null,
      switch_scene: false
    };
  }
  if (choice.kind === 'change_level') {
    const target = choice.direction === 'down' ? currentLevel - 1 : currentLevel + 1;
    if (target < 0) {
      return {
        title_zh: '下次保持最低档',
        detail_zh: `已在最低档 ${label(0)}，不设更低档；下次保持并增加示范。`,
        target_level: 0,
        mode_id: null,
        switch_scene: false
      };
    }
    if (target > 2) {
      return {
        title_zh: '下次保持最高档',
        detail_zh: `已在最高档 ${label(2)}，不设更高档；下次保持并继续巩固。`,
        target_level: 2,
        mode_id: null,
        switch_scene: false
      };
    }
    const level = target as Level;
    return {
      title_zh: choice.direction === 'down' ? '下次降一档支架' : '下次升一档支架',
      detail_zh: `下次可试 ${label(level)}；这是推荐建议，确认前家长可改。`,
      target_level: level,
      mode_id: null,
      switch_scene: false
    };
  }
  if (choice.kind === 'switch_mode') {
    // 不可达回退：PLAN_EVAL_MODE_IDS 内的玩法均已在 GAME_MODES 定义。
    const mode = PLAN_EVAL_MODES.find(m => m.mode_id === choice.mode_id) ?? POINT_LISTEN;
    return {
      title_zh: '下次换个玩法',
      detail_zh: `下次可试「${mode.title_zh}」（${mode.parent_zh}）；课内玩法变体：不新建会话、不写表现记录、不计分。`,
      target_level: null,
      mode_id: choice.mode_id,
      switch_scene: false
    };
  }
  return {
    title_zh: '下次切换场景',
    detail_zh: '下次换同级其他场景继续同一目标（如家庭问候 ↔ 幼儿园）；换场景会新建活动，证据分开记录，不合并。',
    target_level: null,
    mode_id: null,
    switch_scene: true
  };
}

export function serializePlanEval(choice: PlanEvalChoice): string {
  return JSON.stringify(choice);
}

export function parsePlanEval(raw: string | null | undefined): PlanEvalChoice | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isPlanEvalChoice(value) ? value : null;
  } catch {
    return null;
  }
}

function isPlanEvalSuggestion(value: unknown): value is PlanEvalSuggestion {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  const levelOk = s.target_level === null || s.target_level === 0 || s.target_level === 1 || s.target_level === 2;
  const modeOk = s.mode_id === null || isPlanEvalModeId(s.mode_id);
  return (
    typeof s.title_zh === 'string' &&
    typeof s.detail_zh === 'string' &&
    levelOk &&
    modeOk &&
    typeof s.switch_scene === 'boolean'
  );
}

/** 本机状态清洗：损坏/非法负载当作「无评估」，不抛错、不猜值。 */
export function sanitizeStoredPlanEval(value: unknown): StoredPlanEval | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const decisionOk = v.decision === 'pending' || v.decision === 'accepted' || v.decision === 'dismissed';
  if (
    typeof v.session_id !== 'string' || !v.session_id.trim() ||
    (v.record_id !== null && typeof v.record_id !== 'string') ||
    !isPlanEvalChoice(v.choice) ||
    !isPlanEvalSuggestion(v.suggestion) ||
    typeof v.saved_at !== 'number' || !Number.isFinite(v.saved_at) ||
    !decisionOk ||
    v.rule_version !== PLAN_EVAL_RULE_VERSION
  ) return null;
  return {
    session_id: v.session_id,
    record_id: (v.record_id as string | null) ?? null,
    choice: v.choice,
    suggestion: v.suggestion,
    saved_at: v.saved_at,
    decision: v.decision as PlanEvalDecision,
    rule_version: PLAN_EVAL_RULE_VERSION
  };
}

/** 已接受的「更换难度」建议 → 下次目标确认页的预选档位（家长可改，确认前不生效）。 */
export function planEvalPrefillLevel(rec: StoredPlanEval | null): Level | null {
  if (!rec || rec.decision !== 'accepted' || rec.choice.kind !== 'change_level') return null;
  return rec.suggestion.target_level;
}
