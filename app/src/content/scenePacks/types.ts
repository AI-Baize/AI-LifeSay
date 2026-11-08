import type { CourseId } from "../types";

// 场景课程库数据契约（2026-10-11，founder 指令：27 个内容包补收编进部署包）。
//
// 口径（与 内容生产/ 02/03/04 号审校记录一致）：
// - 数据来源 = 内容生产/ 下 30 个 SC-*.md 内容包（逐字转写 §3 单词卡 / §4 词卡课 / §5 对话课 / §7 音频脚本）。
// - goal_kind：existing=复用 reply-hello/reply-color/reply-animal；new_goal=已解禁新 goal（record 仍关）；input_only=纯熏听无观察。
// - record_enabled：existing=true；new_goal=**false**（观察合同 schema 未落地，P2-A1 决定）；input_only=false。
// - 两课独立（08 合同）：mode_fit=对话-only 的场景 word_card 课 supported=false，绝不假装有第二课。
// - 音频门控：auto_play=false 的行（观察段刺激/answer_hint）禁止自动播放（04 号记录 B2 规范）。
// - 不内嵌任何受版权保护素材；音频为本机 TTS 合成 m4a（I-7）。

export interface ScenePackAudioLine {
  /** 对应 audio/<scene_id>/<id>.m4a 的行号（如 A1/B2/C4/5）。 */
  id: string;
  text_en: string;
  /** false = 观察段刺激或答案行，禁止自动播放/随包预播。 */
  auto_play: boolean;
}

export interface ScenePackStep {
  phase: "prepare" | "practice" | "observe" | "finish";
  instruction_zh: string;
  line_en: string;
  expected_response_en: string | null;
  /** 指向 audio.lines 的 id，可空（纯文字步骤）。 */
  audio_line?: string;
}

export interface ScenePackCourse {
  course_id: CourseId;
  /** false = 该场景此课程不适配不交付（09 §3.1 mode_fit）。 */
  supported: boolean;
  /** 不适配时的理由说明（supported=false 必填）。 */
  unsupported_note_zh?: string;
  steps: readonly ScenePackStep[];
}

export interface ScenePackWordCard {
  word_en: string;
  ipa: string;
  hint_zh: string;
}

export interface ScenePackUnit {
  scene_id: string;
  class_id: "C01" | "C02" | "C03";
  title_zh: string;
  goal_kind: "existing" | "new_goal" | "input_only";
  /** existing=reply-hello/reply-color/reply-animal；new_goal=正式 ID；input_only=null。 */
  goal_id: string | null;
  record_enabled: boolean;
  target_version: string;
  word_cards: readonly ScenePackWordCard[];
  audio: {
    /** 目录名，如 audio/SC-C01-001/。 */
    dir: string;
    lines: readonly ScenePackAudioLine[];
  };
  courses: readonly ScenePackCourse[];
  /** input_only 包的熏听说明（goal_kind=input_only 必填）。 */
  listen_only_note_zh?: string;
}

const PHASES = ["prepare", "practice", "observe", "finish"] as const;

export function validateScenePackUnit(u: unknown): string[] {
  const errs: string[] = [];
  if (typeof u !== "object" || u === null) return ["not an object"];
  const p = u as Record<string, unknown>;
  if (typeof p.scene_id !== "string" || !/^SC-C0[123]-\d{3}$/.test(p.scene_id)) errs.push("bad scene_id");
  if (!["C01", "C02", "C03"].includes(String(p.class_id))) errs.push("bad class_id");
  if (typeof p.title_zh !== "string" || !p.title_zh) errs.push("bad title_zh");
  if (!["existing", "new_goal", "input_only"].includes(String(p.goal_kind))) errs.push("bad goal_kind");
  const gk = String(p.goal_kind);
  if (gk === "existing" && !["reply-hello", "reply-color", "reply-animal"].includes(String(p.goal_id))) errs.push("existing must use one of three anchor goals");
  if (gk === "input_only" && p.goal_id !== null) errs.push("input_only goal_id must be null");
  if (gk === "input_only" && typeof p.listen_only_note_zh !== "string") errs.push("input_only needs listen_only_note_zh");
  if (typeof p.record_enabled !== "boolean") errs.push("bad record_enabled");
  if (gk === "input_only" && p.record_enabled !== false) errs.push("input_only record must be false");
  if (typeof p.audio !== "object" || p.audio === null) errs.push("bad audio");
  else {
    const a = p.audio as Record<string, unknown>;
    if (typeof a.dir !== "string" || !a.dir.includes(String(p.scene_id))) errs.push("audio.dir mismatch");
    if (!Array.isArray(a.lines) || a.lines.length === 0) errs.push("audio.lines empty");
    else for (const l of a.lines as Record<string, unknown>[]) {
      if (typeof l.id !== "string" || typeof l.text_en !== "string" || typeof l.auto_play !== "boolean") errs.push("bad audio line");
    }
  }
  if (!Array.isArray(p.courses) || p.courses.length !== 2) errs.push("need exactly 2 courses (word_card + dialogue)");
  else for (const c of p.courses as Record<string, unknown>[]) {
    if (!["word_card", "dialogue"].includes(String(c.course_id))) errs.push("bad course_id");
    if (typeof c.supported !== "boolean") errs.push("bad supported");
    if (c.supported === false && typeof c.unsupported_note_zh !== "string") errs.push("unsupported course needs note");
    if (c.supported === true) {
      const steps = c.steps as Record<string, unknown>[];
      if (!Array.isArray(steps) || steps.length !== 4) errs.push("supported course needs 4 steps");
      else steps.forEach((s, i) => {
        if (s.phase !== PHASES[i]) errs.push(`bad phase order at ${i}`);
        if (typeof s.instruction_zh !== "string" || typeof s.line_en !== "string") errs.push("bad step text");
      });
    }
  }
  return errs;
}

export function validateScenePackList(list: readonly ScenePackUnit[]): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const u of list) {
    errs.push(...validateScenePackUnit(u).map((e) => `${(u as ScenePackUnit).scene_id ?? "?"}: ${e}`));
    if (seen.has(u.scene_id)) errs.push(`${u.scene_id}: duplicate`);
    seen.add(u.scene_id);
  }
  return errs;
}
