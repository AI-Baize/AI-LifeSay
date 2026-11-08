import {
  fail,
  isEntryBand,
  ok,
  type EnglishExposure,
  type EntryBand,
  type EntryBandSource,
  type Result
} from "../content/types";

// E0–E3 起点推荐（D-3 / D1.2-01）。
//
// 硬约束：映射表尚未通过内容审校前，**不自动推断 E**，只展示家长自选 E。
// 年龄不进入任何候选公式；support_level0–2 与 E 级无自动换算。
// 即便家长自选高档位，也不能解锁未制作内容。

// 内容审校未完成前保持 false；审校通过后置 true 并给出 mapping_version。
export const ENTRY_MAPPING_REVIEWED = false;
export const ENTRY_MAPPING_VERSION: string | null = null;
export const ENTRY_RULE_VERSION: string | null = null;

// 映射草案（产品假设，未审定；仅在 reviewed=true 时可用于派生候选）。
const DRAFT_MAPPING: Record<EnglishExposure, EntryBand> = {
  none: "E0",
  familiar_words: "E1",
  familiar_responses: "E2",
  flexible_simple_use: "E3",
  unsure: "E0"
};

const EXPOSURE_LABELS: Record<EnglishExposure, string> = {
  none: "尚无稳定接触",
  familiar_words: "接触过少量词句，常需共同参与",
  familiar_responses: "熟悉场景中能回应简单表达",
  flexible_simple_use: "能在不同熟悉场景主动使用简单表达",
  unsure: "不确定"
};

const BAND_LABELS: Record<EntryBand, string> = {
  E0: "可以从熟悉声音和共同参与开始",
  E1: "可从熟悉词句的互动开始",
  E2: "可以尝试熟悉场景的简短交流",
  E3: "可查看更换场景的交流任务"
};

const EXPOSURES: readonly EnglishExposure[] = [
  "none",
  "familiar_words",
  "familiar_responses",
  "flexible_simple_use",
  "unsure"
];

export function isEnglishExposure(v: unknown): v is EnglishExposure {
  return EXPOSURES.includes(v as EnglishExposure);
}

export function exposureLabel(v: EnglishExposure | null): string {
  return v === null ? "未填写" : EXPOSURE_LABELS[v];
}

export function entryBandLabel(v: EntryBand | null): string {
  return v === null ? "尚未判断；先浏览入门场景" : BAND_LABELS[v];
}

export interface EntryBandCandidate {
  exposure: EnglishExposure | null;
  suggested: EntryBand | null;
  preference: EntryBand | null;
  source: EntryBandSource;
  mapping_reviewed: boolean;
  mapping_version: string | null;
  requires_confirmation: boolean;
  explanation_zh: string;
}

// 自述 → E 候选（生产函数）。
//
// R03：生产入口**不接受任何外部“已审”开关**，只依赖编译期常量与已发布的
// 映射版本。未审校时 suggested 恒为 null，只回显自选偏好；即便调用方试图
// 传入 reviewed 参数，也不会被读取。草案模拟请改用 simulateDraftEntryBand。
export function suggestEntryBand(input: {
  english_exposure?: EnglishExposure | null;
  preference?: EntryBand | null;
}): Result<EntryBandCandidate> {
  const exposure = input.english_exposure ?? null;
  const preference = input.preference ?? null;
  if (exposure !== null && !isEnglishExposure(exposure)) {
    return fail("INVALID_INPUT", "英语接触情况取值无效。");
  }
  if (preference !== null && !isEntryBand(preference)) {
    return fail("INVALID_INPUT", "起点偏好取值无效。");
  }

  // 只有常量已审且给出映射版本时才可能派生候选。
  const reviewed = ENTRY_MAPPING_REVIEWED && ENTRY_MAPPING_VERSION !== null;

  if (!reviewed) {
    // 未审：绝不自动推断。有自选则回显自选，否则提示先浏览入门场景。
    return ok({
      exposure,
      suggested: null,
      preference,
      source: "self_reported",
      mapping_reviewed: false,
      mapping_version: null,
      requires_confirmation: preference === null,
      explanation_zh:
        preference === null
          ? "映射尚未审校，暂不自动推荐；先浏览入门场景，或自行选择起点。"
          : `当前按你自选的 ${preference}：${entryBandLabel(preference)}。未审校，不作为测得等级。`
    });
  }

  const suggested =
    exposure === null || exposure === "unsure"
      ? null
      : DRAFT_MAPPING[exposure];

  return ok({
    exposure,
    suggested,
    preference,
    source: suggested === null ? "self_reported" : "rule",
    mapping_reviewed: true,
    mapping_version: ENTRY_MAPPING_VERSION,
    requires_confirmation: true,
    explanation_zh:
      suggested === null
        ? "资料不足或不确定，先浏览入门场景，不保存为测得等级。"
        : `根据自述“${exposureLabel(exposure)}”建议 ${suggested}：${entryBandLabel(suggested)}。需家长确认。`
  });
}

// 草案模拟（仅测试/评审用）：显式命名，明确标注不是生产门控。
// 它允许在未审校时演练“若映射通过”的候选，但结果标记 draft=true，
// 生产代码不得调用，也不得据此写入档案。
export function simulateDraftEntryBand(input: {
  english_exposure?: EnglishExposure | null;
  preference?: EntryBand | null;
  reviewed: true;
}): Result<EntryBandCandidate & { draft: true }> {
  const exposure = input.english_exposure ?? null;
  const preference = input.preference ?? null;
  if (exposure !== null && !isEnglishExposure(exposure)) {
    return fail("INVALID_INPUT", "英语接触情况取值无效。");
  }
  if (preference !== null && !isEntryBand(preference)) {
    return fail("INVALID_INPUT", "起点偏好取值无效。");
  }
  const suggested =
    exposure === null || exposure === "unsure"
      ? null
      : DRAFT_MAPPING[exposure];
  return ok({
    exposure,
    suggested,
    preference,
    source: suggested === null ? "self_reported" : "rule",
    mapping_reviewed: true,
    mapping_version: ENTRY_MAPPING_VERSION,
    requires_confirmation: true,
    draft: true,
    explanation_zh:
      suggested === null
        ? "草案模拟：资料不足或不确定，不给出候选。"
        : `草案模拟：若映射通过，自述“${exposureLabel(exposure)}”将建议 ${suggested}。未经审校，不得写入。`
  });
}
