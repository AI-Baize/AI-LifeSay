import type { ScenePackUnit } from "./types";
import { C01A } from "./c01a";
import { C01B_C02 } from "./c01b-c02";
import { C03_REST } from "./c03-rest";

// 场景课程库汇总入口（2026-10-11）。
//
// 范围：C01 家庭 15 + C02 生活知识 3 + C03 幼儿园 9（004/007/010 已在 kindergarten 主题中，
// 不重复计入本库，避免同一 scene 双份内容）。
//
// 口径：
// - 本库为「内容包收编视图」，与 themes/kindergarten.json（主题课程视图）互补：
//   主题视图服务「今日活动」主流程，本库服务「场景课程库」浏览入口。
// - new_goal 单元 record_enabled=false（观察合同 schema 未落地，P2-A1 决定）；
//   input_only 单元无观察项。
// - 音频门控 auto_play=false 的行（观察段刺激/答案行）禁止自动播放。

export const SCENE_PACKS: readonly ScenePackUnit[] = Object.freeze([
  ...C01A,
  ...C01B_C02,
  ...C03_REST
]);

export function scenePackById(sceneId: string): ScenePackUnit | undefined {
  return SCENE_PACKS.find((u) => u.scene_id === sceneId);
}

export function scenePacksByClass(classId: "C01" | "C02" | "C03"): readonly ScenePackUnit[] {
  return SCENE_PACKS.filter((u) => u.class_id === classId);
}

/** 可开放能力记录的单元（existing goal）。 */
export function recordableScenePacks(): readonly ScenePackUnit[] {
  return SCENE_PACKS.filter((u) => u.record_enabled);
}

/** 需要禁止自动播放的音频行。 */
export function gatedAudioLines(u: ScenePackUnit): readonly string[] {
  return u.audio.lines.filter((l) => !l.auto_play).map((l) => l.id);
}
