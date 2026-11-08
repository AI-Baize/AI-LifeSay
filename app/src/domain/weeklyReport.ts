import {
  fail,
  isInstant,
  ok,
  validRecord,
  type ActivityRecord,
  type Result,
  type WeeklyGroup,
  type WeeklySummary
} from "../content/types";

import {
  chinaDay,
  DAY_MS,
  latestActive,
  splitEvidence
} from "./next-step";

export function buildWeeklyReport(input: {
  profile_id: string;
  week_start: string;
  generated_at: number;
  records: readonly ActivityRecord[];
}): Result<WeeklySummary> {
  const calendar = Date.parse(
    `${input.week_start}T00:00:00.000Z`
  );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.week_start) ||
    !Number.isFinite(calendar) ||
    new Date(calendar)
      .toISOString()
      .slice(0, 10) !== input.week_start ||
    new Date(calendar).getUTCDay() !== 1 ||
    !isInstant(input.generated_at) ||
    !input.profile_id.trim()
  ) {
    return fail(
      "INVALID_INPUT",
      "请提供有效的周一日期、生成时间与档案 ID。"
    );
  }

  const start = calendar - 8 * 3600000;
  const end = start + 7 * DAY_MS;

  if (input.generated_at < start) {
    return fail(
      "INVALID_INPUT",
      "不能生成尚未开始的一周。"
    );
  }

  const own = latestActive(input.records).filter(
    r => r.profile_id === input.profile_id
  );

  if (own.some(r => !validRecord(r))) {
    return fail(
      "INVALID_INPUT",
      "记录字段异常，请修正后再生成周报。"
    );
  }

  const rows = own
    .filter(
      r =>
        r.occurred_at >= start &&
        r.occurred_at < end &&
        r.occurred_at <= input.generated_at
    )
    .sort(
      (a, b) =>
        a.occurred_at - b.occurred_at ||
        a.id.localeCompare(b.id)
    );

  const buckets = new Map<
    string,
    ActivityRecord[]
  >();

  for (const row of rows) {
    // R02：分组必须含课程/单元/观察条件身份；缺身份的记录不与他组混算。
    const key = JSON.stringify([
      row.course_id,
      row.unit_id,
      row.observation_condition_key,
      row.theme_id,
      row.content_version,
      row.task_id,
      row.goal_id,
      row.level
    ]);

    const bucket = buckets.get(key) ?? [];
    bucket.push(row);
    buckets.set(key, bucket);
  }

  const groups: WeeklyGroup[] = [];

  for (
    const [, bucket] of [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
  ) {
    const first = bucket[0];

    /* v8 ignore next 3 */
    if (!first) {
      continue;
    }

    const observed = bucket.filter(
      r => r.outcome !== null
    );

    // D-2：拒绝/停止/未知单列；只有明确观察结果进入分母，主观评估不参与。
    const split = splitEvidence(bucket);

    const independent = observed.filter(
      r => r.outcome === "independent"
    ).length;

    const prompted = observed.filter(
      r => r.outcome === "prompted"
    ).length;

    const notYet = observed.filter(
      r => r.outcome === "not_yet"
    ).length;

    // 产品假设：至少3次明确观察且跨2个中国自然日；不覆盖长期进步或教学效果。
    // R02：缺课程/条件身份时不参与可比较阈值，只出描述性计数。
    const comparable =
      first.course_id !== null &&
      first.unit_id !== null &&
      first.observation_condition_key !== null;
    const sufficient =
      comparable &&
      observed.length >= 3 &&
      new Set(
        observed.map(
          r => chinaDay(r.occurred_at)
        )
      ).size >= 2;

    groups.push({
      theme_id: first.theme_id,
      content_version: first.content_version,
      task_id: first.task_id,
      goal_id: first.goal_id,
      level: first.level,
      course_id: first.course_id ?? null,
      unit_id: first.unit_id ?? null,
      observation_condition_key: first.observation_condition_key ?? null,
      comparable,
      activities: bucket.length,
      independent,
      prompted,
      not_yet: notYet,
      unknown: split.unknown.length,

      refused: split.refused.length,

      stopped: split.stopped.length,

      independent_rate:
        !sufficient
          ? null
          : independent / observed.length,

      conclusion: sufficient
        ? (
            `本周观察到独立完成 ${independent} 次、` +
            `提示完成 ${prompted} 次、` +
            `尚未完成 ${notYet} 次；` +
            "不据此判断长期进步。"
          )
        : comparable
          ? "不足以判断：尚缺至少三次、跨两天的明确观察。"
          : "旧记录缺少课程或观察条件身份，单独列出，不参与可比较判断。",

      evidence_ids: observed.map(r => r.id)
    });
  }

  const complete =
    rows.length > 0 &&
    rows.every(
      r => r.duration_seconds !== null
    );

  return ok({
    profile_id: input.profile_id,
    week_start: input.week_start,

    week_end_exclusive: new Date(
      calendar + 7 * DAY_MS
    )
      .toISOString()
      .slice(0, 10),

    timezone: "Asia/Shanghai",
    generated_at: input.generated_at,
    activities: rows.length,

    active_days: new Set(
      rows.map(r => chinaDay(r.occurred_at))
    ).size,

    total_seconds: complete
      ? rows.reduce(
          (sum, r) =>
            sum + (r.duration_seconds ?? 0),
          0
        )
      : null,

    duration_complete: complete,

    conclusion:
      rows.length === 0
        ? "不足以判断：本周没有活动记录。"
        : "请分目标、版本和难度查看观察结果。",

    groups
  });
}
