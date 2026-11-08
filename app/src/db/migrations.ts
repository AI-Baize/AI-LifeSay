import type { Entity, PlanFeedback, Result } from '../content/types';
import { fail, ok } from '../content/types';

// schema v2：新增 profile 与 activitySessions 增量字段；索引不变，仅补 null。
export const SCHEMA_VERSION = 2;

// 已发布版本不得重写；未来在新version升级事务中调用经过测试的纯转换。
// 旧english-demo-v1保留原样，本次不静默清库或把旧记录编造成完整会话。
export function normalizeLifecycle<T extends Entity>(row: T): Result<T> {
 if (!Number.isSafeInteger(row.revision) || row.revision<1) return fail('INVALID_INPUT','旧记录版本无效，需要人工核对');
 return ok({ ...row, lifecycle_state: row.deleted_at===null ? 'active' : 'deleted' });
}

export const MIGRATION_FAILURE_NOTICE = '升级未完成，原数据保留。请关闭其他窗口后重试；不要清除浏览器数据。';

// C-10/G-4：升级失败必须落成专用错误码，而不是普通 STORAGE_ERROR。
// 读取失败由调用方呈现为专用提示，不转换成 0，也不静默清库。
export const MIGRATION_FAILURE_CODE = 'MIGRATION_FAILED' as const;

// Dexie 升级事务在 open() 阶段失败时，抛出的是原生错误（name 常为 'Error'，
// message 为回调内异常文本），因此不能只按 name 判断；
// 这里按 dexie 的 DatabaseClosed/OpenFailed 名称与常见升级失败关键字做保守识别。
const UPGRADE_FAILURE_HINTS = [
  'upgrade',
  'schema',
  'versionerror',
  'version',
  'openfailed',
  'databaseclosed',
  'dexie'
] as const;

export function isMigrationFailure(error: unknown): boolean {
  if (error === null || error === undefined) return false;
  if (typeof error !== 'object') return false;
  const e = error as { name?: unknown; message?: unknown };
  const name = typeof e.name === 'string' ? e.name.toLowerCase() : '';
  const message = typeof e.message === 'string' ? e.message.toLowerCase() : '';
  if (name === 'upgrade' || name === 'version' || name === 'schema' || name === 'openfailed' || name === 'databaseclosed') {
    return true;
  }
  return UPGRADE_FAILURE_HINTS.some(hint => message.includes(hint));
}

// profile v2 增量：缺失一律填 null，不猜年龄、经验或起点。
export function fillProfileV2(row: unknown): void {
 if (!row || typeof row !== 'object') return;
 const p = row as Record<string, unknown>;
 for (const key of [
  'age_scope',
  'english_exposure',
  'entry_band_preference',
  'entry_band_source',
  'entry_rule_version',
  'scenario_preset',
  'onboarding_completed_at'
 ]) {
  if (p[key] === undefined) p[key] = null;
 }
}

// activitySessions v2 增量：课程/条件/评估缺失一律 null，旧会话不被编造课程。
export function fillSessionV2(row: unknown): void {
 if (!row || typeof row !== 'object') return;
 const s = row as Record<string, unknown>;
 for (const key of [
  'course_id',
  'unit_id',
  'initial_presentation_mode',
  'current_presentation_mode',
  'observation_condition_key',
  'proposed_next_preference'
 ]) {
  if (s[key] === undefined) s[key] = null;
 }
 if (s['plan_feedback'] === undefined) s['plan_feedback'] = null;
}

// R08：升级事务内对齐 appMeta.installed_schema_version，
// 避免物理 verno=2 而业务安装版本仍为 1。
// 注意：Dexie 的 Collection.modify 只采用对传入对象的原地修改，
// 返回值会被忽略，因此必须原地赋值而不能返回新对象。
export function alignInstalledSchemaVersion(
 meta: { installed_schema_version: number } & Record<string, unknown>
): void {
 meta.installed_schema_version = SCHEMA_VERSION;
}

// 评估（plan_feedback）纯构造（R09）：状态枚举、时间与值严格对齐。
// unanswered：无值、无时间；skipped：无值、必须有时间；answered：必须有值和时间。
// 该对象只记主观感受，不参与能力证据或 evidence_revision。
export function planFeedback(input: {
 state: PlanFeedback['state'];
 value?: PlanFeedback['value'];
 updated_at?: string | null;
 rule_version?: string | null;
}): Result<PlanFeedback> {
 const { state, value = null, updated_at = null, rule_version = null } = input;
 if (state !== 'unanswered' && state !== 'answered' && state !== 'skipped') {
  return fail('INVALID_INPUT', '评估状态取值无效');
 }
 if (rule_version !== null && (typeof rule_version !== 'string' || rule_version.trim() === '')) {
  return fail('INVALID_INPUT', '评估规则版本不能为空字符串');
 }
 if (state === 'unanswered') {
  if (value !== null) return fail('INVALID_INPUT', '未填写评估不能带值');
  if (updated_at !== null) return fail('INVALID_INPUT', '未填写评估不能带提交时间');
  return ok({ state, value: null, updated_at: null, rule_version });
 }
 if (updated_at === null || typeof updated_at !== 'string' || updated_at.trim() === '') {
  return fail('INVALID_INPUT', '评估需要记录提交时间');
 }
 if (state === 'answered') {
  if (value !== 'easier' && value !== 'about_right' && value !== 'harder' && value !== 'unsure') {
   return fail('INVALID_INPUT', '已填写的评估必须给出明确选项');
  }
  return ok({ state, value, updated_at, rule_version });
 }
 // skipped：不写值，但记录跳过事件时间。
 if (value !== null) return fail('INVALID_INPUT', '跳过或未填写时不能写入评估值');
 return ok({ state, value: null, updated_at, rule_version });
}
