import {
  fail,
  isPresentationMode,
  ok,
  type ActivitySession,
  type CourseId,
  type PresentationMode,
  type Result
} from "../content/types";

// 课程维度与会话冻结（D-1 / I-1，SC08-01/02/03）。
//
// 约束：
// - 跨 word_card / dialogue 始终属跨课程切换 → 必须新建会话，不得原地改 mode。
// - 同课程内呈现模式在会话开始时冻结；翻卡/换角色不改课程身份，也不改 mode。
// - 观察条件（observation_condition_key）变化必须新会话，避免跨条件合并证据。
// - 旧会话缺 course/mode（null）时不猜课程，要求重新确认。

export const isCourseId = (v: unknown): v is CourseId =>
  v === "word_card" || v === "dialogue";

export interface SessionTarget {
  course_id: CourseId | null;
  unit_id: string | null;
  observation_condition_key: string | null;
}

export interface CourseSwitchDecision {
  reuse: boolean;
  requires_new_session: boolean;
  reason_zh: string;
}

// 判定能否复用当前会话；任何课程/单元/条件变化都要求新会话。
export function resolveCourseSwitch(
  current: ActivitySession,
  target: SessionTarget
): Result<CourseSwitchDecision> {
  if (target.course_id !== null && !isCourseId(target.course_id)) {
    return fail("INVALID_INPUT", "课程取值无效。");
  }
  const currentCourse = current.course_id ?? null;

  if (currentCourse === null) {
    return ok({
      reuse: false,
      requires_new_session: true,
      reason_zh: "当前会话缺少课程标识，无法确认同课；请重新确认后新建会话。"
    });
  }
  if (target.course_id === null) {
    return fail("INVALID_INPUT", "请提供目标课程。");
  }

  if (currentCourse !== target.course_id) {
    return ok({
      reuse: false,
      requires_new_session: true,
      reason_zh: "跨课程切换：请先结束或保留当前课程，另一课程将重新开始。"
    });
  }
  if ((current.unit_id ?? null) !== (target.unit_id ?? null)) {
    return ok({
      reuse: false,
      requires_new_session: true,
      reason_zh: "课程单元已变化，需要新建会话。"
    });
  }
  if (
    (current.observation_condition_key ?? null) !==
    (target.observation_condition_key ?? null)
  ) {
    return ok({
      reuse: false,
      requires_new_session: true,
      reason_zh: "观察条件已变化，不能跨条件合并证据，需要新建会话。"
    });
  }
  return ok({
    reuse: true,
    requires_new_session: false,
    reason_zh: "同一课程单元与观察条件，可继续当前会话。"
  });
}

// 课内呈现模式冻结：同值放行且不产生变更，异值拒绝。
export function switchPresentationMode(
  session: ActivitySession,
  mode: PresentationMode
): Result<{ changed: boolean; mode: PresentationMode | null }> {
  if (!isPresentationMode(mode)) {
    return fail("INVALID_INPUT", "呈现模式取值无效。");
  }
  if (session.initial_presentation_mode === null || session.initial_presentation_mode === undefined) {
    return fail("UNSUPPORTED", "旧会话缺少呈现模式，不能推断；请新建会话。");
  }
  if (session.initial_presentation_mode !== mode) {
    return fail(
      "INVALID_INPUT",
      "课程与呈现模式在会话内冻结；请新建另一门课程的会话。"
    );
  }
  return ok({ changed: false, mode: session.initial_presentation_mode });
}
