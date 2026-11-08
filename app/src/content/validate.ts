import { fail, ok, type Result, type Theme } from './types';
import { COURSE_UNITS } from '../domain/courseCatalog';
import { CONTEXTS, type ContextDef } from './contexts';
import { UNIT_MATERIALS, type UnitMaterial } from './materials';
import { SCENES, safeScenePath, type SceneDef } from './scenes';
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export function safeResourcePath(v: unknown): v is string {
  // 2026-10-10 保守扩展：允许 .mp3/.m4a（kindergarten 收编 SC-C03 本机合成 m4a）。
  // 仅放宽扩展名正则，不升 schema_version；既有 mp3 引用语义不变。
  return typeof v === 'string' && /^audio\/[a-z0-9-]+\/[a-z0-9-]+\.(mp3|m4a)$/.test(v);
}
export function validateTheme(value: unknown): Result<Theme> {
  if (!object(value) || value.schema_version !== 1 || value.locale !== 'en-US' ||
      !text(value.id) || !text(value.version) || !text(value.title_zh) ||
      !object(value.rights) || !['original','licensed','card_only'].includes(String(value.rights.mode)) ||
      !Array.isArray(value.tasks) || value.tasks.length < 1 || value.tasks.length > 3)
      // 任务数 1–3：既有单任务主题 + kindergarten 三场景迁移（同目标三件套，不混入新 goal）。
      return fail('INVALID_INPUT','内容包基本字段无效');
  for (const t of value.tasks) {
    if (!object(t) || !text(t.id) || !text(t.goal_id) || !text(t.goal_zh) || !text(t.title_zh) ||
        !object(t.minutes) || typeof t.minutes.min !== 'number' || typeof t.minutes.max !== 'number' ||
        !Array.isArray(t.materials_zh) || !t.materials_zh.every(text) || !text(t.stop_rule_zh) ||
        !object(t.observation) || !['id','prompt_zh','independent_zh','prompted_zh','not_yet_zh'].every(k=>text(t.observation && object(t.observation) ? t.observation[k] : null)) ||
        !Array.isArray(t.path) || t.path.length !== 3 || !Array.isArray(t.steps) || t.steps.length !== 4)
      return fail('INVALID_INPUT','活动必须包含一个主要观察点、三档支持和四段步骤');
    if (!t.path.every((p,i)=>object(p) && p.level===i && text(p.title_zh) && text(p.support_zh)))
      return fail('INVALID_INPUT','支持档位无效');
    const observationId = t.observation.id;
    if (!t.steps.every((s,i)=>object(s) && text(s.id) && text(s.title_zh) && text(s.instruction_zh) &&
        text(s.line_en) && typeof s.seconds==='number' && Number.isFinite(s.seconds) && s.seconds>0 &&
        (s.expected_response_en===null || text(s.expected_response_en)) &&
        s.phase===['prepare','practice','observe','finish'][i] &&
        Array.isArray(s.observation_ids) && (i===2 ? s.observation_ids.length===1 && s.observation_ids[0]===observationId : s.observation_ids.length===0) &&
        object(s.audio) && s.audio.locale==='en-US' && ['tts_placeholder','ready'].includes(String(s.audio.status)) &&
        (s.audio.auto_play === undefined || typeof s.audio.auto_play === 'boolean') && safeResourcePath(s.audio.path)))
      return fail('INVALID_INPUT','步骤、观察引用或音频资源键无效');
  }
  // 已逐字段校验当前内容合同；附加的产品假设说明仅用于展示。
  return ok(value as unknown as Theme);
}

const THEME_IDS = ['family-greetings', 'colors-shapes', 'animals-actions'] as const;
const PHASES = ['prepare', 'practice', 'observe', 'finish'] as const;

// 课程目录 + 九情境 + 两玩法素材校验（I-6 / I-1 / E-2）。
// 只校验结构、身份对应与审校状态；不改写既有 schema_version=1 的解析。
// 返回 Result<true>：任一项不满足即整体不可发布。
export function validateCourseDirectory(
  themes: readonly Theme[]
): Result<true> {
  // 1) 九情境：数量、ID 唯一、每主题 2 主 + 1 迁移。
  if (!CONTEXTS.length) return fail('INVALID_INPUT', '情境目录不能为空');
  const contextIds = CONTEXTS.map(c => c.context_id);
  if (new Set(contextIds).size !== contextIds.length)
    return fail('INVALID_INPUT', '情境 ID 必须唯一');
  for (const themeId of THEME_IDS) {
    const own = CONTEXTS.filter(c => c.theme_id === themeId);
    const main = own.filter(c => !c.is_transfer);
    const transfer = own.filter(c => c.is_transfer);
    if (own.length !== 3 || main.length !== 2 || transfer.length !== 1)
      return fail('INVALID_INPUT', `主题 ${themeId} 必须 2 主情境 + 1 迁移情境`);
  }
  for (const c of CONTEXTS) {
    if (!themes.some(t=>t.id===c.theme_id))
      return fail('INVALID_INPUT', '情境引用了未知主题');
    if (!text(c.context_id) || !text(c.observation_condition_key))
      return fail('INVALID_INPUT', '情境缺少 ID 或观察条件键');
    // 主情境条件键即自身；迁移情境保留自身条件键，不冒充主条件。
    if (c.observation_condition_key !== c.context_id)
      return fail('INVALID_INPUT', '情境条件键必须与情境 ID 一致');
    if (!['draft', 'reviewed'].includes(c.review_status))
      return fail('INVALID_INPUT', '情境审校状态无效');
    if (!object(c.stimulus) || !text(c.stimulus.stimulus_id) ||
        !Array.isArray(c.stimulus.accepted_responses) ||
        !c.stimulus.accepted_responses.every(text) ||
        c.stimulus.accepted_responses.length === 0)
      return fail('INVALID_INPUT', '情境必须给出明确的刺激与可接受回应');
  }

  // 2) 课程单元：数量、ID 唯一、course↔mode 固定对应、引用内容存在。
  if (!COURSE_UNITS.length) return fail('INVALID_INPUT', '课程单元不能为空');
  const unitIds = COURSE_UNITS.map(u => u.unit_id);
  if (new Set(unitIds).size !== unitIds.length)
    return fail('INVALID_INPUT', '课程单元 ID 必须唯一');
  for (const unit of COURSE_UNITS) {
    if (unit.course_id !== unit.presentation_mode)
      return fail('INVALID_INPUT', '课程与呈现模式必须固定一一对应');
    const theme = themes.find(t => t.id === unit.theme_id);
    const task = theme?.tasks.find(t => t.id === unit.task_id);
    if (!theme || !task)
      return fail('INVALID_INPUT', '课程单元引用了不存在的主题或任务');
    if (task.goal_id !== unit.goal_id || theme.version !== unit.content_version)
      return fail('INVALID_INPUT', '课程单元的目标或内容版本与主题包不一致');
    if (!unit.context_ids.includes(unit.default_context_id))
      return fail('INVALID_INPUT', '默认情境必须属于该单元的情境集合');
    if (!unit.context_ids.includes(unit.observation_condition_key))
      return fail('INVALID_INPUT', '观察条件必须属于该单元的情境集合');
    for (const contextId of unit.context_ids) {
      const ctx = CONTEXTS.find(c => c.context_id === contextId);
      if (!ctx || ctx.theme_id !== unit.theme_id)
        return fail('INVALID_INPUT', '课程单元引用了不存在或跨主题的情境');
      // 迁移情境不冒充新能力：不得被当作单元主观察条件。
      if (ctx.is_transfer && ctx.context_id === unit.observation_condition_key)
        return fail('INVALID_INPUT', '迁移情境不能冒充单元主观察能力');
    }
    // 两门课程在同一主题下必须使用各自不同的主观察条件。
    const sibling = COURSE_UNITS.find(
      u => u.unit_id !== unit.unit_id && u.theme_id === unit.theme_id &&
        u.course_id !== unit.course_id
    );
    if (sibling && sibling.observation_condition_key === unit.observation_condition_key)
      return fail('INVALID_INPUT', '两门课程不能共用同一主观察条件');
  }

  // 3) 两玩法素材：覆盖全部单元、条件键一致、四段齐全、审校状态合法。
  for (const material of UNIT_MATERIALS) {
    const unit = COURSE_UNITS.find(u => u.unit_id === material.unit_id);
    if (!unit) return fail('INVALID_INPUT', '玩法素材引用了不存在的课程单元');
    if (material.course_id !== unit.course_id)
      return fail('INVALID_INPUT', '玩法素材的课程与单元不一致');
    if (material.condition_key !== unit.observation_condition_key)
      return fail('INVALID_INPUT', '玩法素材的 condition_key 与单元不一致');
    if (!['draft', 'reviewed'].includes(material.review_status))
      return fail('INVALID_INPUT', '玩法素材审校状态无效');
    const phases = material.steps.map(s => s.phase);
    if (phases.length !== 4 || !PHASES.every((p, i) => phases[i] === p))
      return fail('INVALID_INPUT', '玩法素材必须按 prepare/practice/observe/finish 四段齐全');
    if (!material.steps.every(s => text(s.instruction_zh) && text(s.line_en) &&
        (s.expected_response_en === null || text(s.expected_response_en))))
      return fail('INVALID_INPUT', '玩法素材步骤文案无效');
  }
  for (const unit of COURSE_UNITS) {
    if (!UNIT_MATERIALS.some(m => m.unit_id === unit.unit_id))
      return fail('INVALID_INPUT', '课程单元缺少对应玩法素材');
  }
  return ok(true);
}

// 已审校素材（reviewed）可进入发布态；此函数供发布门禁与测试调用。
export function publishableMaterials(): readonly UnitMaterial[] {
  return UNIT_MATERIALS.filter(m => m.review_status === 'reviewed');
}

// V1.5-B1：场景图片教学目录校验（F09 / F15）。
// 只校验结构、受控路径、坐标边界与审校状态；不把热点命中当作能力事实。
export function validateScenes(): Result<true> {
  const sceneIds = SCENES.map(s => s.scene_id);
  if (new Set(sceneIds).size !== sceneIds.length)
    return fail('INVALID_INPUT', '场景 ID 必须唯一');
  for (const scene of SCENES) {
    if (!THEME_IDS.includes(scene.theme_id as (typeof THEME_IDS)[number]))
      return fail('INVALID_INPUT', '场景引用了未知主题');
    if (!safeScenePath(scene.image_path))
      return fail('INVALID_INPUT', '场景图片路径必须在 scenes/ 受控目录内');
    if (scene.rights !== 'original')
      return fail('INVALID_INPUT', '场景图必须为自制原创（original）');
    if (!['draft', 'reviewed'].includes(scene.review_status))
      return fail('INVALID_INPUT', '场景审校状态无效');
    if (scene.hotspots.length === 0)
      return fail('INVALID_INPUT', '已发布场景必须含至少一个已标注热点');
    const hsIds = scene.hotspots.map(h => h.hotspot_id);
    if (new Set(hsIds).size !== hsIds.length)
      return fail('INVALID_INPUT', '同场景热点 ID 必须唯一');
    for (const hs of scene.hotspots) {
      if (!text(hs.label_en) || !text(hs.hotspot_id) || !text(hs.label_zh))
        return fail('INVALID_INPUT', '热点缺少标注词');
      const inBounds = (v: number): boolean => Number.isFinite(v) && v >= 0 && v <= 100;
      if (!inBounds(hs.x) || !inBounds(hs.y) || !(hs.w > 0 && hs.w <= 100) || !(hs.h > 0 && hs.h <= 100))
        return fail('INVALID_INPUT', '热点坐标或尺寸越界');
      if (hs.x + hs.w > 100 || hs.y + hs.h > 100)
        return fail('INVALID_INPUT', '热点超出场景边界');
    }
    // 热点不得重叠：重叠会导致命中归属歧义。
    for (let i = 0; i < scene.hotspots.length; i += 1) {
      const a = scene.hotspots[i];
      if (!a) return fail('INVALID_INPUT', '热点缺失');
      for (let j = i + 1; j < scene.hotspots.length; j += 1) {
        const b = scene.hotspots[j];
        if (!b) return fail('INVALID_INPUT', '热点缺失');
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        if (overlap) return fail('INVALID_INPUT', '热点不得重叠');
      }
    }
  }
  return ok(true);
}

// 已审校且含热点的场景可进入发布态。
export function publishableScenes(): readonly SceneDef[] {
  return SCENES.filter(s => s.review_status === 'reviewed' && s.hotspots.length > 0);
}

export function contextsByTheme(themeId: string): readonly ContextDef[] {
  return CONTEXTS.filter(c => c.theme_id === themeId);
}
