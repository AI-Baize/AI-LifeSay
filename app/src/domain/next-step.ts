import {
  isInstant,
  validRecord,
  type ActivityRecord,
  type Scope,
  type Suggestion
} from "../content/types";

export const DAY_MS = 86400000;

// 产品假设：14天窗口、跨2天、进阶跨2场景、2次退阶与3次进阶，待验证。
export const RULES = {
  lookback_days: 14,
  advance_samples: 3,
  regress_samples: 2
} as const;

export function chinaDay(time: number): string {
  return new Date(time + 8 * 3600000)
    .toISOString()
    .slice(0, 10);
}

// 先选最新版本，再排除软删除；旧版本不会复活。
export function latestActive(
  records: readonly ActivityRecord[]
): ActivityRecord[] {
  const map = new Map<string, ActivityRecord>();

  for (const row of records) {
    const previous = map.get(row.id);

    if (
      !previous ||
      row.revision > previous.revision ||
      (
        row.revision === previous.revision &&
        row.updated_at > previous.updated_at
      )
    ) {
      map.set(row.id, row);
    }
  }

  return [...map.values()].filter(
    row => row.deleted_at === null
  );
}

// D-2：拒绝/停止/未知单列，只有明确观察结果才进入能力证据样本。
export interface EvidenceSplit {
  observed: ActivityRecord[];
  refused: ActivityRecord[];
  stopped: ActivityRecord[];
  unknown: ActivityRecord[];
}

export function splitEvidence(
  records: readonly ActivityRecord[]
): EvidenceSplit {
  const observed: ActivityRecord[] = [];
  const refused: ActivityRecord[] = [];
  const stopped: ActivityRecord[] = [];
  const unknown: ActivityRecord[] = [];

  for (const row of records) {
    if (row.participation === "refused") refused.push(row);
    else if (row.participation === "stopped") stopped.push(row);
    else if (row.outcome === null) unknown.push(row);
    else observed.push(row);
  }

  return { observed, refused, stopped, unknown };
}

export function suggestNextStep(
  scope: Scope,
  records: readonly ActivityRecord[],
  asOf: number,
  rule_version = "next-step-v1",
  epoch: string | null = null
): Suggestion {
  const hold = (
    reason: string,
    evidence: ActivityRecord[] = [],
    pause = false
  ): Suggestion => ({
    action: "保持",
    target_level: scope.level,
    pause,
    reason,
    evidence_ids: evidence.map(r => r.id)
  });

  if (!isInstant(asOf) || !rule_version.trim()) {
    return hold("参考时间无效，不足以判断。");
  }

  // R02：缺课程/单元/观察条件身份时不足以判断；
  // 不能因为“双方同为 null”就当作同条件合并证据。
  const identityKnown =
    scope.course_id !== null &&
    scope.unit_id !== null &&
    scope.observation_condition_key !== null;

  if (!identityKnown) {
    return hold(
      "课程或观察条件身份缺失，不足以判断，先保持。"
    );
  }

  const candidates = latestActive(records).filter(
    r =>
      (epoch === null || r.selection_epoch_id === epoch) &&
      r.profile_id === scope.profile_id &&
      r.course_id === scope.course_id &&
      r.unit_id === scope.unit_id &&
      r.observation_condition_key === scope.observation_condition_key &&
      r.theme_id === scope.theme_id &&
      r.content_version === scope.content_version &&
      r.task_id === scope.task_id &&
      r.goal_id === scope.goal_id &&
      r.level === scope.level &&
      r.level_started_at === scope.level_started_at
  );

  if (candidates.some(r => !validRecord(r))) {
    return hold(
      "记录字段异常，不足以判断，请先修正。"
    );
  }

  const recent = candidates
    .filter(
      r =>
        r.occurred_at <= asOf &&
        r.occurred_at >= Math.max(
          scope.level_started_at,
          asOf - RULES.lookback_days * DAY_MS
        )
    )
    .sort(
      (a, b) =>
        b.occurred_at - a.occurred_at ||
        b.id.localeCompare(a.id)
    );

  const last = recent[0];

  if (!last) {
    return hold(
      "当前档缺少近期记录，不足以判断，先保持。"
    );
  }

  if (last.participation === "refused") {
    return hold(
      "最近一次明确拒绝，先暂停，待愿意参与时再试。",
      [last],
      true
    );
  }

  if (last.participation === "stopped") {
    return hold(
      "最近一次提前结束，保持当前档并缩短下次活动。",
      [last]
    );
  }

  if (last.outcome === null || last.participation === null) return hold("最近一次结果未知，不足以判断，先保持。", [last]);

  // 拒绝/停止/未知已被上面的提前返回短路；此处样本只取明确观察结果。
  const observedRecent = splitEvidence(recent).observed;

  const two = observedRecent.slice(
    0,
    RULES.regress_samples
  );

  if (
    two.length === 2 &&
    two.every(r => r.outcome === "not_yet") &&
    new Set(
      two.map(r => chinaDay(r.occurred_at))
    ).size >= 2
  ) {
    if (scope.level === 0) {
      return hold(
        "跨两天仍未完成，保持最低档并增加示范。",
        two
      );
    }

    return {
      action: "退阶",
      target_level: scope.level === 2 ? 1 : 0,
      pause: false,
      reason:
        "最近两次跨日期均未完成，下次退一档增加支持。",
      evidence_ids: two.map(r => r.id)
    };
  }

  const three = observedRecent.slice(
    0,
    RULES.advance_samples
  );

  if (
    three.length === 3 &&
    three.every(
      r => r.outcome === "independent"
    ) &&
    new Set(
      three.map(r => chinaDay(r.occurred_at))
    ).size >= 2 &&
    new Set(
      three
        .map(r => r.context_id?.trim())
        .filter(Boolean)
    ).size >= 2
  ) {
    if (scope.level === 2) {
      return hold(
        "跨日期、跨场景独立完成，保持最高档并继续巩固。",
        three
      );
    }

    return {
      action: "进阶",
      target_level: scope.level === 0 ? 1 : 2,
      pause: false,
      reason:
        "最近三次跨日期、跨场景独立完成，下次可尝试高一档。",
      evidence_ids: three.map(r => r.id)
    };
  }

  return hold(
    // 结果未知已在前面提前返回，这里只可能是“未满足调整条件”。
    /* v8 ignore next 3 */
    last.outcome === null
      ? "最近一次结果未知，不足以判断，先保持。"
      : "尚未满足调整条件，下次保持当前档。",
    [last]
  );
}
