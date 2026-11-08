export type Instant = number; // UTC 毫秒；展示时固定使用中国时区。
export type Level = 0 | 1 | 2;
export type Outcome = "independent" | "prompted" | "not_yet";
export type Participation = "engaged" | "stopped" | "refused";

export type ErrorCode =
  | "INVALID_INPUT"
  | "CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "STORAGE_ERROR" | "MIGRATION_FAILED" | "CONSENT_REQUIRED" | "STALE_GENERATION" | "MAINTENANCE_BUSY" | "NOT_FOUND" | "STALE_EVIDENCE" | "UNSUPPORTED" | "RIGHTS_BLOCKED";

export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: ErrorCode;
        message: string;
        retryable: boolean;
      };
    };

export const ok = <T>(data: T): Result<T> => ({
  ok: true,
  data
});

export const fail = <T>(
  code: ErrorCode,
  message: string,
  retryable = false
): Result<T> => ({
  ok: false,
  error: { code, message, retryable }
});

export interface Entity {
  id: string;
  idempotency_key: string;
  revision: number;
  created_at: Instant;
  updated_at: Instant;
  deleted_at: Instant | null;
  lifecycle_state: "active" | "deleted";
  data_mode: "demo" | "real";
  row_schema_version: number;
}

export interface ObservationItem {
  id: string;
  prompt_zh: string;
  independent_zh: string;
  prompted_zh: string;
  not_yet_zh: string;
}

export interface ActivityStep {
  id: string;
  title_zh: string;
  // 步骤阶段：与 materials.ts 的 MaterialStep 口径一致，供讲解/活动分段展示。
  phase: "prepare" | "practice" | "observe" | "finish";
  seconds: number;
  instruction_zh: string;
  line_en: string;
  expected_response_en: string | null;
  observation_ids: string[];
  audio: {
    path: string;
    locale: "en-US";
    // tts_placeholder = 仅路径声明、文件缺失；ready = 本机 en-US 合成音频已落盘。
    // 二者均为本机合成（非人类母语者录音），不构成母语者审校证据。
    status: "tts_placeholder" | "ready";
    // 可选门控（2026-10-10）：false = 本段音频不自动播放。
    // observe 段防泄露（内容包标注「隐藏答案、不自动播放」）；缺省视为可自动播。
    auto_play?: boolean;
  };
}

export interface Task {
  id: string;
  goal_id: string;
  goal_zh: string;
  title_zh: string;
  minutes: {
    min: number;
    max: number;
  };
  materials_zh: string[];
  stop_rule_zh: string;

  // 一个任务只评估一个主要能力，避免跨能力合成分数。
  observation: ObservationItem;

  path: {
    level: Level;
    title_zh: string;
    support_zh: string;
  }[];

  steps: ActivityStep[];
}

export interface Theme {
  schema_version: 1;
  id: string;
  version: string;
  title_zh: string;
  locale: "en-US";
  rights: {
    mode: "original" | "licensed" | "card_only";
    evidence: string | null;
  };
  tasks: Task[];
}

export interface Scope {
  profile_id: string;
  theme_id: string;
  content_version: string;
  task_id: string;
  goal_id: string;
  level: Level;

  // 每次家长确认换档时更新；防止复用上次同档的证据反复晋级。
  level_started_at: Instant;

  // R01/R02：课程身份随事实一起快照，禁止事后回填。
  // 旧数据缺身份时为 null；null 不代表同条件，不参与可比较分组。
  course_id: CourseId | null;
  unit_id: string | null;
  observation_condition_key: string | null;
}

// 课程 → 单元 → 观察条件的固定引用。
// R01：跨课程必须新会话；单元或条件变化同样必须新会话。
export interface CourseUnitRef {
  course_id: CourseId;
  unit_id: string;
  observation_condition_key: string;
}

export const courseUnitRefs = (
  ref: CourseUnitRef
): CourseUnitRef => ({
  course_id: ref.course_id,
  unit_id: ref.unit_id,
  observation_condition_key: ref.observation_condition_key
});

export interface Consent extends Entity {
  scope: 'local_child_learning'; sequence: number; decision: 'granted' | 'withdrawn'; database_generation: string;
  actor_role: 'guardian_declared'; declared_guardian: boolean;
  profile_id: string;
  policy_version: string;
  granted_at: Instant | null;
  revoked_at: Instant | null;
}

// 方案优化1.2 / schema v2：以下枚举与字段为增量设计，一律可空，不写假值。
export type AgeScope = "under3" | "in_scope" | "over6";
export type EnglishExposure =
  | "none"
  | "familiar_words"
  | "familiar_responses"
  | "flexible_simple_use"
  | "unsure";
export type EntryBand = "E0" | "E1" | "E2" | "E3";
export type EntryBandSource = "self_reported" | "rule";
export type ScenarioPreset = "under3_default" | "profile_based" | "manual";
export type CourseId = "word_card" | "dialogue";
export type PresentationMode = "word_card" | "dialogue";
// 内容审校状态（E-2/I-6）：draft 不可发布；reviewed 表示已审校通过（含 approved_with_issues）。
export type ContentReviewStatus = "draft" | "reviewed";
export type PlanFeedbackState = "unanswered" | "answered" | "skipped";
export type PlanFeedbackValue = "easier" | "about_right" | "harder" | "unsure";

// 主观评估；与 outcome 解耦，不进入能力证据。
export interface PlanFeedback {
  state: PlanFeedbackState;
  value: PlanFeedbackValue | null;
  updated_at: string | null;
  rule_version: string | null;
}

export interface Profile extends Entity {
  display_name: string | null;
  age_band: 3 | 4 | 5 | 6 | null;
  preferred_locale: string;
  initialized_at: Instant;
  archived_reason: "parent_action" | "privacy_request" | null;
  is_demo: true;
  nickname: string;
  age_months: number | null;
  selection: TargetSelection | null;
  weekly_goals?: Record<string, string>;
  weekly_goal_saved_at?: Record<string, Instant>;

  // schema v2 增量：全部可空，旧档案迁移时统一填 null；
  // R07：新档案由构造器显式写 null，不依赖一次性的 upgrade。
  age_scope: AgeScope | null;
  english_exposure: EnglishExposure | null;
  entry_band_preference: EntryBand | null;
  entry_band_source: EntryBandSource | null;
  entry_rule_version: string | null;
  scenario_preset: ScenarioPreset | null;
  onboarding_completed_at: string | null;
}

export interface Observation extends Entity {
  theme_id: string; task_id: string; content_version: string; ability_id: string; result: ObservationResult;
  profile_id: string;
  goal_id: string;
  observed_at: Instant;
  outcome: Outcome | null;
}

export interface ActivityRecord extends Entity, Scope {
  session_id: string;
  selection_epoch_id: string;
  selection_snapshot: TargetSelection;
  result: ObservationResult;
  occurred_at: Instant;
  context_id: string | null;
  participation: Participation | null;
  outcome: Outcome | null;
  duration_seconds: number | null;
}

export interface Suggestion {
  action: "退阶" | "保持" | "进阶";
  target_level: Level;
  pause: boolean;
  reason: string;
  evidence_ids: string[];
}

export interface WeeklyGroup {
  theme_id: string;
  content_version: string;
  task_id: string;
  goal_id: string;
  level: Level;
  // R02：课程 / 单元 / 观察条件身份；null 表示旧数据缺身份，不参与可比较阈值。
  course_id: CourseId | null;
  unit_id: string | null;
  observation_condition_key: string | null;
  comparable: boolean;
  activities: number;
  independent: number;
  prompted: number;
  not_yet: number;
  unknown: number;
  refused: number;
  stopped: number;
  independent_rate: number | null;
  conclusion: string;
  evidence_ids: string[];
}

export interface WeeklySummary {
  profile_id: string;
  week_start: string;
  week_end_exclusive: string;
  timezone: "Asia/Shanghai";
  generated_at: Instant;
  activities: number;
  active_days: number;
  total_seconds: number | null;
  duration_complete: boolean;
  conclusion: string;
  groups: WeeklyGroup[];
}

export interface WeeklyReport extends Entity {
  profile_id: string; week_start: string; timezone: 'Asia/Shanghai'; source_evidence_revision: number; rule_version: string;
  summary: WeeklySummary;
}

// 适配器只读；写入能力只出现在 Repository。
export interface ReadAdapter<T> {
  read(): Promise<Result<T>>;
}

export const isInstant = (n: unknown): n is number =>
  typeof n === "number" &&
  Number.isSafeInteger(n) &&
  n >= 0 &&
  n <= 8640000000000000;

export const isOutcome = (v: unknown): v is Outcome | null =>
  v === null ||
  v === "independent" ||
  v === "prompted" ||
  v === "not_yet";

export const isLevel = (v: unknown): v is Level =>
  v === 0 || v === 1 || v === 2;

export const isEntryBand = (v: unknown): v is EntryBand =>
  v === "E0" || v === "E1" || v === "E2" || v === "E3";

export const isPresentationMode = (v: unknown): v is PresentationMode =>
  v === "word_card" || v === "dialogue";

const filledString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

// 结构校验（R09）：answered 必须有值且有提交时间；
// skipped 必须无值且有提交时间；unanswered 必须无值且无提交时间。
export const isPlanFeedback = (v: unknown): v is PlanFeedback => {
  if (v === null || typeof v !== "object") return false;
  const f = v as Record<string, unknown>;
  if (!["unanswered", "answered", "skipped"].includes(f.state as string)) return false;
  if (
    !(
      f.value === null ||
      f.value === "easier" ||
      f.value === "about_right" ||
      f.value === "harder" ||
      f.value === "unsure"
    )
  ) {
    return false;
  }
  if (f.updated_at !== null && !filledString(f.updated_at)) return false;
  if (f.rule_version !== null && !filledString(f.rule_version)) return false;
  if (f.state === "unanswered") return f.value === null && f.updated_at === null;
  if (!filledString(f.updated_at)) return false;
  if (f.state === "answered") return f.value !== null;
  return f.value === null;
};

export function validRecord(r: ActivityRecord): boolean {
  return (
    isInstant(r.occurred_at) &&
    isInstant(r.level_started_at) &&
    r.occurred_at >= r.level_started_at &&
    isLevel(r.level) &&
    isOutcome(r.outcome) &&
    [
      r.profile_id,
      r.theme_id,
      r.content_version,
      r.task_id,
      r.goal_id
    ].every(
      s => typeof s === "string" && s.trim().length > 0
    ) &&
    (
      r.context_id === null ||
      typeof r.context_id === "string"
    ) &&
    [null, "engaged", "stopped", "refused"].includes(
      r.participation
    ) &&
    (
      r.participation === "engaged" ||
      r.outcome === null
    ) &&
    (
      r.duration_seconds === null ||
      (
        Number.isFinite(r.duration_seconds) &&
        r.duration_seconds >= 0
      )
    )
  );
}

export type SessionStatus = "active" | "paused" | "awaiting_record" | "pending_record" | "recorded" | "abandoned";
export interface TargetSelection extends Scope {
  selection_id: string; selection_epoch_id: string; ability_id: string;
  ability_definition_version: string; support_level: Level; locale: string;
  selected_at: Instant; source: "manual" | "observation" | "recommendation";
  source_observation_id: string | null; source_next_step_id: string | null;
  target_label_snapshot: string; support_label_snapshot: string;
}
export interface ObservationResult {
  participation: Participation | null; outcome: Outcome | null;
  unknown_reason: "not_observed" | "unclear" | "stopped" | "refused" | "missing_legacy" | null;
  prompt_types: ("model_answer" | "verbal_cue" | "gesture_cue" | "physical_help" | "other")[] | null;
  opportunity_observed: boolean | null; note: string | null;
  environment?: string | null;
}
export interface ActivitySession extends Entity {
  profile_id: string; selection_snapshot: TargetSelection; selection_epoch_id: string;
  status: SessionStatus; started_at: Instant; ended_at: Instant | null;
  current_step_index: number; checkpoint_at: Instant | null;
  record_id: string | null; record_draft: ObservationResult | null;
  completion_kind: "completed" | "stopped" | "refused" | null;

  // schema v2 增量（SC08-01/02/03）：课程与呈现模式在会话内冻结；旧会话迁移 null。
  // R07：新会话由构造器显式写入全部字段（未知写 null），不依赖一次性的 upgrade。
  course_id: CourseId | null;
  unit_id: string | null;
  initial_presentation_mode: PresentationMode | null;
  current_presentation_mode: PresentationMode | null;
  observation_condition_key: string | null;
  plan_feedback: PlanFeedback | null;
  proposed_next_preference: string | null;
}

// 历史聚合只读取事实所需的最小会话字段（R05）。
export interface SessionFactSource {
  id: string;
  profile_id: string;
  status: SessionStatus;
  revision: number;
  updated_at: Instant;
  started_at: Instant;
  deleted_at: Instant | null;
}
export interface NextStep extends Entity {
  profile_id: string; trigger_record_id: string; selection_epoch_id: string;
  source_profile_revision: number; source_evidence_revision: number;
  rule_version: string; evaluated_at: Instant; suggestion: Suggestion;
  decision_state: "pending" | "accepted" | "dismissed" | "superseded";
}
export interface Settings extends Entity { locale: string; preferred_voice_uri: string | null; scene_autoplay?: boolean; daily_record_enabled?: boolean; daily_record_time?: string; }
export interface AppMeta {
  id: "local-app"; database_generation: string; current_profile_id: string | null;
  consent_sequence: number; evidence_revision: number; revision: number;
  maintenance_mode: "normal" | "erasing" | "migration_review";
  maintenance_job_id: string | null; installed_schema_version: number;
}
export interface Mutation { idempotency_key: string; database_generation: string;
  request_fingerprint: string; committed_at: Instant; command_type: string; }
export interface AuditLog { id: string; occurred_at: Instant; event_code: "WRITE_OK" | "WRITE_FAILED" | "BOOT_FAILED"; }
export interface MaintenanceJob { id: string; kind: "erase"; status: "pending" | "complete"; generation: string; created_at: Instant; }
export interface Resource extends Entity { title: string; rights_status: "unknown" | "original" | "licensed"; import_source: string | null; authorization_note: string | null; }
export interface Asset extends Entity { resource_id: string; media_type: "image" | "audio" | "video"; availability: "missing" | "ready"; mime: string; }
export interface Annotation extends Entity { asset_id: string; publication_state: "draft" | "confirmed"; label: string; }
export interface AssetPayload { id: string; asset_id: string; payload: Blob; }
export interface Snapshot {
  meta: AppMeta | null; profile: Profile | null; consent: Consent | null;
  observations: Observation[]; sessions: ActivitySession[]; records: ActivityRecord[];
  suggestions: NextStep[]; reports: WeeklyReport[]; settings: Settings | null;
}
