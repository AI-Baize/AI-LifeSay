import { findContext } from "../content/contexts";
import { fail, ok, type Result } from "../content/types";
import type { CourseUnit } from "./courseCatalog";

// 默认情境切换（I-6 / I-7；SC08-01）。
//
// 约束来源：
// - 每个课程单元固定绑定 1 个主情境（= observation_condition_key）+ 1 个迁移情境（*-C03）。
// - 主情境即单元的观察条件；选它不改变任何冻结字段，可原地生效。
// - 迁移情境是**另一个观察条件**，跨条件证据不得合并（presentation.ts、11 R02、B-5）。
// - 迁移情境**会话路径已开放**（依据 13-内容审校记录-第一轮 §4：CR-06 初审通过，
//   迁移独立分桶、不参与晋级）。开放后：
//     1) 必须经家长显式确认才生效（requires_explicit_confirmation=true）；
//     2) 生效时新建会话、冻结迁移条件，不原地改课程身份；
//     3) 迁移证据独立分桶，绝不与主情境合并，不参与晋级/退阶；
//     4) 迁移 ≠ 进阶、≠ 新能力。
// - 开放的是**会话路径**，不是**内容发布**：内容仍为 draft。
// - 不自动推断 E 级、不把迁移当新能力、不显示积分/评分/连胜链。

export type ContextSwitchKind = "main" | "transfer";

export interface ContextSwitchDecision {
  kind: ContextSwitchKind;
  context_id: string;
  observation_condition_key: string;
  is_transfer: boolean;
  /** 是否可立即生效（主情境 true；迁移情境经显式确认后 true）。 */
  applied: boolean;
  /** 生效后是否改变当前单元的观察条件。 */
  changes_condition: boolean;
  requires_new_session: boolean;
  /** 是否必须经家长显式确认才生效（迁移情境为 true，绝不静默生效）。 */
  requires_explicit_confirmation: boolean;
  /** 非空表示该路径被具名门控关闭，不得静默生效。 */
  gate: string | null;
  reason_zh: string;
  unlock_zh: string | null;
}

// 纯函数：给定单元与候选情境，判定能否切换、是否改变观察条件、是否需要新会话。
export function resolveContextSwitch(
  unit: CourseUnit,
  contextId: string
): Result<ContextSwitchDecision> {
  if (!unit.context_ids.includes(contextId)) {
    return fail("INVALID_INPUT", "该情境不属于当前课程单元，不能作为本次默认情境。");
  }
  const ctx = findContext(contextId);
  if (!ctx.ok) return fail(ctx.error.code, ctx.error.message);

  if (contextId === unit.default_context_id) {
    return ok({
      kind: "main",
      context_id: contextId,
      observation_condition_key: unit.observation_condition_key,
      is_transfer: false,
      applied: true,
      changes_condition: false,
      requires_new_session: false,
      requires_explicit_confirmation: false,
      gate: null,
      reason_zh: "主情境即本单元的观察条件，切换不改变课程身份，可原地生效。",
      unlock_zh: null
    });
  }

  if (ctx.data.is_transfer) {
    return ok({
      kind: "transfer",
      context_id: contextId,
      observation_condition_key: ctx.data.observation_condition_key,
      is_transfer: true,
      applied: true,
      changes_condition: true,
      requires_new_session: true,
      requires_explicit_confirmation: true,
      gate: null,
      reason_zh:
        "迁移情境是另一个观察条件（" +
        ctx.data.observation_condition_key +
        "），跨条件证据不得合并。确认后会新建会话、按该条件独立分桶，证据不与主情境合并，也不参与晋级判定；迁移 ≠ 进阶，不冒充新能力。",
      unlock_zh: null
    });
  }

  return fail("INVALID_INPUT", "该情境既不是主情境也不是迁移情境，目录异常。");
}

// 单元的默认情境 ID；目录缺失时回退为主观察条件，绝不猜测。
export function defaultContextIdFor(unit: CourseUnit): string {
  return unit.default_context_id || unit.observation_condition_key;
}
