import { fail, ok, type Level, type Result } from '../content/types';
import {
  PLAN_EVAL_NAMESPACE,
  PLAN_EVAL_RULE_VERSION,
  isPlanEvalChoice,
  planEvalSuggestion,
  sanitizeStoredPlanEval,
  type PlanEvalChoice,
  type PlanEvalDecision,
  type StoredPlanEval
} from '../domain/planEvaluation';

// P2 · B2d：计划评估的本机持久化。
//
// 关键：**与学习表现分开存储**（与播放进度同构的独立命名空间）。
// - 不做进 Dexie 学习表，不进 records / reports / nextStep；主观评估不构成能力事实。
// - 读取失败/损坏 → 当作无评估，不抛错、不猜值、不静默改写学习数据。
// - 无 localStorage（SSR/受限环境）→ 内存回退，功能降级但可用。

let memoryFallback: StoredPlanEval | null = null;
const memoryHistory=new Map<string,StoredPlanEval>();
const sessionKey=(id:string)=>PLAN_EVAL_NAMESPACE+":session:"+encodeURIComponent(id);

const storage = (): Storage | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
};

export function loadPlanEval(sessionId?:string): StoredPlanEval | null {
  const s=storage();
  if(!s)return sessionId?memoryHistory.get(sessionId)??(memoryFallback?.session_id===sessionId?memoryFallback:null):memoryFallback;
  try {
    const raw=sessionId?s.getItem(sessionKey(sessionId))??s.getItem(PLAN_EVAL_NAMESPACE):s.getItem(PLAN_EVAL_NAMESPACE);
    if(!raw)return null;
    const rec=sanitizeStoredPlanEval(JSON.parse(raw));
    return !sessionId||rec?.session_id===sessionId?rec:null;
  } catch{return null;}
}

function persist(rec: StoredPlanEval | null,updateLatest=true): Result<null> {
  const s = storage();
  if (!s) {
    if(updateLatest)memoryFallback = rec;
    if(rec)memoryHistory.set(rec.session_id,rec);
    else memoryHistory.clear();
    return ok(null);
  }
  try {
    if (rec === null) {
      const keys=Array.from({length:s.length},(_,i)=>s.key(i)).filter((k):k is string=>!!k&&(k===PLAN_EVAL_NAMESPACE||k.startsWith(PLAN_EVAL_NAMESPACE+':session:')));
      keys.forEach(k=>s.removeItem(k));
    } else {s.setItem(sessionKey(rec.session_id),JSON.stringify(rec));if(updateLatest)s.setItem(PLAN_EVAL_NAMESPACE, JSON.stringify(rec));}
    return ok(null);
  } catch {
    return fail('UNSUPPORTED', '本机存储不可用，本次评估不保存');
  }
}

/** 保存「本次评估」：只写本机评估命名空间，不写任何学习记录。 */
export function savePlanEval(input: {
  session_id: string;
  record_id?: string | null;
  choice: PlanEvalChoice;
  level: Level;
  now?: number;
}): Result<StoredPlanEval> {
  if (!input.session_id.trim()) return fail('INVALID_INPUT', '缺少活动标识，评估不保存');
  if (!isPlanEvalChoice(input.choice)) return fail('INVALID_INPUT', '评估选项无效');
  const now = input.now ?? Date.now();
  const rec: StoredPlanEval = {
    session_id: input.session_id,
    record_id: input.record_id ?? null,
    choice: input.choice,
    suggestion: planEvalSuggestion(input.choice, input.level),
    saved_at: now,
    decision: 'pending',
    rule_version: PLAN_EVAL_RULE_VERSION
  };
  const saved = persist(rec);
  if (!saved.ok) return saved;
  return ok(rec);
}

/** 家长覆盖语义（沿用「下一次支架调整」）：接受建议 / 保持当前。 */
export function decidePlanEval(decision: Exclude<PlanEvalDecision, 'pending'>, sessionId?: string): Result<StoredPlanEval | null> {
  const current = loadPlanEval(sessionId);
  if (!current || (sessionId && current.session_id!==sessionId)) return fail('NOT_FOUND', '这次活动的建议已变化，请重新打开');
  const next: StoredPlanEval = { ...current, decision };
  const latest=loadPlanEval();
  const saved = persist(next,!latest||latest.session_id===current.session_id);
  if (!saved.ok) return saved;
  return ok(next);
}

/** 清除评估建议（设置/清除数据时用）。不影响学习记录。 */
export function clearPlanEval(): Result<null> {
  memoryFallback = null;
  memoryHistory.clear();
  return persist(null);
}
