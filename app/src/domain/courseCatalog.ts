import { fail, ok, type CourseId, type PresentationMode, type Result } from "../content/types";

// 课程 / 单元 / 观察条件目录（D-1、SC08-01…06，08 §3.1 / §6.1）。
//
// 说明：
// - 两门课程（word_card / dialogue）在三主题下各有一个单元，共六个单元。
// - unit_id 为 08 §3.1 拟议稳定 ID；observation_condition_key 取 08 §2.1 主情境 ID。
// - 迁移备选情境（*-C03）不改变主观察条件；换情境必须新建会话（不跨条件合并证据）。
// - 目录是 V1 的显式合同；不在运行时从 JSON 猜测课程身份。
// - 若主题 / 任务 / 课程组合不存在，返回 INVALID_INPUT，绝不回退为「同条件」。

export interface CourseUnit {
  unit_id: string;
  course_id: CourseId;
  presentation_mode: PresentationMode;
  theme_id: string;
  task_id: string;
  goal_id: string;
  content_version: string;
  observation_condition_key: string;
  default_context_id: string;
  context_ids: readonly string[];
}

const KINDERGARTEN_UNITS: readonly CourseUnit[] = [
  {
    "unit_id": "kindergarten-hello-family-dialogue",
    "course_id": "dialogue",
    "presentation_mode": "dialogue",
    "theme_id": "kindergarten",
    "task_id": "hello-family",
    "goal_id": "respond-to-greeting",
    "content_version": "1.0.0",
    "observation_condition_key": "KG-hello-family",
    "default_context_id": "KG-hello-family",
    "context_ids": [
      "KG-hello-family"
    ]
  },
  {
    "unit_id": "kindergarten-name-color-dialogue",
    "course_id": "dialogue",
    "presentation_mode": "dialogue",
    "theme_id": "kindergarten",
    "task_id": "name-color",
    "goal_id": "name-basic-color",
    "content_version": "1.0.0",
    "observation_condition_key": "KG-name-color",
    "default_context_id": "KG-name-color",
    "context_ids": [
      "KG-name-color"
    ]
  },
  {
    "unit_id": "kindergarten-name-animal-dialogue",
    "course_id": "dialogue",
    "presentation_mode": "dialogue",
    "theme_id": "kindergarten",
    "task_id": "name-animal",
    "goal_id": "name-basic-animal",
    "content_version": "1.0.0",
    "observation_condition_key": "KG-name-animal",
    "default_context_id": "KG-name-animal",
    "context_ids": [
      "KG-name-animal"
    ]
  }
];

export const COURSE_UNITS: readonly CourseUnit[] = Object.freeze([
  {
    unit_id: "family-greetings-word-card",
    course_id: "word_card",
    presentation_mode: "word_card",
    theme_id: "family-greetings",
    task_id: "hello-family",
    goal_id: "respond-to-greeting",
    content_version: "1.0.0",
    observation_condition_key: "FG-C01",
    default_context_id: "FG-C01",
    context_ids: ["FG-C01", "FG-C03"]
  },
  {
    unit_id: "family-greetings-dialogue",
    course_id: "dialogue",
    presentation_mode: "dialogue",
    theme_id: "family-greetings",
    task_id: "hello-family",
    goal_id: "respond-to-greeting",
    content_version: "1.0.0",
    observation_condition_key: "FG-C02",
    default_context_id: "FG-C02",
    context_ids: ["FG-C02", "FG-C03"]
  },
  {
    unit_id: "colors-shapes-word-card",
    course_id: "word_card",
    presentation_mode: "word_card",
    theme_id: "colors-shapes",
    task_id: "name-color",
    goal_id: "name-basic-color",
    content_version: "1.0.0",
    observation_condition_key: "CS-C01",
    default_context_id: "CS-C01",
    context_ids: ["CS-C01", "CS-C03"]
  },
  {
    unit_id: "colors-shapes-dialogue",
    course_id: "dialogue",
    presentation_mode: "dialogue",
    theme_id: "colors-shapes",
    task_id: "name-color",
    goal_id: "name-basic-color",
    content_version: "1.0.0",
    observation_condition_key: "CS-C02",
    default_context_id: "CS-C02",
    context_ids: ["CS-C02", "CS-C03"]
  },
  {
    unit_id: "animals-actions-word-card",
    course_id: "word_card",
    presentation_mode: "word_card",
    theme_id: "animals-actions",
    task_id: "name-animal",
    goal_id: "name-basic-animal",
    content_version: "1.0.0",
    observation_condition_key: "AA-C01",
    default_context_id: "AA-C01",
    context_ids: ["AA-C01", "AA-C03"]
  },
  {
    unit_id: "animals-actions-dialogue",
    course_id: "dialogue",
    presentation_mode: "dialogue",
    theme_id: "animals-actions",
    task_id: "name-animal",
    goal_id: "name-basic-animal",
    content_version: "1.0.0",
    observation_condition_key: "AA-C02",
    default_context_id: "AA-C02",
    context_ids: ["AA-C02", "AA-C03"]
  },
  ...KINDERGARTEN_UNITS
] as const);

export function readCourseUnits(): Result<readonly CourseUnit[]> {
  return ok(COURSE_UNITS);
}

// 按 主题 + 任务 + 课程 取唯一单元；找不到不猜。
export function findCourseUnit(
  themeId: string,
  taskId: string,
  courseId: CourseId
): Result<CourseUnit> {
  const found = COURSE_UNITS.find(
    u => u.theme_id === themeId && u.task_id === taskId && u.course_id === courseId
  );
  if (!found) {
    return fail("INVALID_INPUT", "该主题下没有对应的课程单元，请重新确认目标。");
  }
  return ok(found);
}

// 默认单元 = 词卡课主情境；用于未显式选择课程时的保守默认（不是自动进阶）。
export function defaultCourseUnit(themeId: string, taskId: string): Result<CourseUnit> {
  return findCourseUnit(themeId, taskId, "word_card");
}

// 课程与呈现模式固定一一对应；任何不一致都是合同错误。
export function presentationModeForCourse(courseId: CourseId): PresentationMode {
  return courseId;
}

export function isKnownUnitId(unitId: string): boolean {
  return COURSE_UNITS.some(u => u.unit_id === unitId);
}
