import { fail, ok, type ContentReviewStatus, type Result } from './types';
import { SCENES } from './scenes';

// 批次2-C3：场景库分级（域 → 类 → 场景），对齐「方案优化1.2 / 09 场景库」。
//
// 口径：
// - **8 域 / 27 类**为 09 §2.1 冻结注册表：名称可改展示文案，ID 不可重用；
//   本文件只登记，不新增同义域，也不自定义新类。
// - 场景行取 09 的 `SC-Cxx-nnn` 稳定 ID；**不回收、不因外形推断归属**。
// - **已实现**（app_scene_ids 非空）= 应用内已有已审校自制原创场景图，可点。
// - **规划中**（app_scene_ids 为空）= 仅设计目录，**灰态不可点**，不冒充可用。
// - 设计状态（design_state）与内容审校（app_review_status）**分开**：
//   设计目录为 draft 不等于应用内容未审校，反之亦然。

export interface Domain {
  domain_id: string;
  name_zh: string;
}

export interface SceneClass {
  class_id: string;
  domain_id: string;
  name_zh: string;
}

export type TargetVersion = 'V1' | 'V1.5' | 'V2' | '阶段B';
export type DesignState = 'baseline_design' | 'planned' | 'blocked';
export type ScopeStatus = 'in_scope' | 'out_of_current_scope';

export interface TaxonomyScene {
  /** 09 稳定场景 ID（SC-Cxx-nnn）。 */
  scene_id: string;
  domain_id: string;
  class_id: string;
  title_zh: string;
  target_version: TargetVersion;
  design_state: DesignState;
  scope_status: ScopeStatus;
  /** 已实现的场景图变体（引用 SCENES 的 scene_id）；空 = 规划中。 */
  app_scene_ids: readonly string[];
}

// 09 §2.1 冻结八域。
export const DOMAINS: readonly Domain[] = Object.freeze([
  { domain_id: 'D01', name_zh: '日常生活域' },
  { domain_id: 'D02', name_zh: '校园与成长域' },
  { domain_id: 'D03', name_zh: '城市与出行域' },
  { domain_id: 'D04', name_zh: '自然与户外域' },
  { domain_id: 'D05', name_zh: '文化与场馆域' },
  { domain_id: 'D06', name_zh: '语言与艺术域' },
  { domain_id: 'D07', name_zh: '运动与游戏域' },
  { domain_id: 'D08', name_zh: '学科知识域' }
] as const);

// 09 §2.1 冻结 27 类（C01–C27），class→domain 引用必须一致。
export const CLASSES: readonly SceneClass[] = Object.freeze([
  { class_id: 'C01', domain_id: 'D01', name_zh: '家庭' },
  { class_id: 'C02', domain_id: 'D01', name_zh: '生活知识' },
  { class_id: 'C03', domain_id: 'D02', name_zh: '幼儿园' },
  { class_id: 'C04', domain_id: 'D02', name_zh: '小学' },
  { class_id: 'C05', domain_id: 'D02', name_zh: '初中' },
  { class_id: 'C06', domain_id: 'D02', name_zh: '高中' },
  { class_id: 'C07', domain_id: 'D03', name_zh: '交通' },
  { class_id: 'C08', domain_id: 'D03', name_zh: '建筑' },
  { class_id: 'C09', domain_id: 'D03', name_zh: '商场' },
  { class_id: 'C10', domain_id: 'D04', name_zh: '动物园' },
  { class_id: 'C11', domain_id: 'D04', name_zh: '游乐场' },
  { class_id: 'C12', domain_id: 'D04', name_zh: '公园' },
  { class_id: 'C13', domain_id: 'D04', name_zh: '海洋' },
  { class_id: 'C14', domain_id: 'D04', name_zh: '森林' },
  { class_id: 'C15', domain_id: 'D04', name_zh: '高山' },
  { class_id: 'C16', domain_id: 'D04', name_zh: '田野' },
  { class_id: 'C17', domain_id: 'D04', name_zh: '湖泊' },
  { class_id: 'C18', domain_id: 'D04', name_zh: '花园' },
  { class_id: 'C19', domain_id: 'D05', name_zh: '博物馆' },
  { class_id: 'C20', domain_id: 'D05', name_zh: '科学馆' },
  { class_id: 'C21', domain_id: 'D06', name_zh: '拼音字母' },
  { class_id: 'C22', domain_id: 'D06', name_zh: '儿歌' },
  { class_id: 'C23', domain_id: 'D06', name_zh: '音乐' },
  { class_id: 'C24', domain_id: 'D06', name_zh: '舞蹈' },
  { class_id: 'C25', domain_id: 'D07', name_zh: '游戏' },
  { class_id: 'C26', domain_id: 'D07', name_zh: '运动' },
  { class_id: 'C27', domain_id: 'D08', name_zh: '学科知识' }
] as const);

// 本页登记的场景行：批次1（09-01 的 C01/C02/C03，共 30 行，逐行取自 09 原文）。
// 其余类在 09 各批文档中；本页只展示已登记行，不凭猜测补全。
export const TAXONOMY_SCENES: readonly TaxonomyScene[] = Object.freeze([
  // ── D01 日常生活域 / C01 家庭（15 行）──
  { scene_id: 'SC-C01-001', domain_id: 'D01', class_id: 'C01', title_zh: '生活起居·起床后玩偶问好', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: ['scene-family-greetings', 'scene-family-visitor', 'scene-family-table'] },
  { scene_id: 'SC-C01-002', domain_id: 'D01', class_id: 'C01', title_zh: '生活起居·挑衣物看颜色', target_version: 'V1', design_state: 'baseline_design', scope_status: 'in_scope', app_scene_ids: ['scene-colors-clothes'] },
  { scene_id: 'SC-C01-003', domain_id: 'D01', class_id: 'C01', title_zh: '生活起居·洗漱用品提出请求', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-004', domain_id: 'D01', class_id: 'C01', title_zh: '吃饭·餐前空杯看颜色', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-005', domain_id: 'D01', class_id: 'C01', title_zh: '吃饭·餐前请求杯子', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-006', domain_id: 'D01', class_id: 'C01', title_zh: '吃饭·餐后表达谢谢', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-007', domain_id: 'D01', class_id: 'C01', title_zh: '睡觉·睡前玩偶短问候', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-008', domain_id: 'D01', class_id: 'C01', title_zh: '睡觉·睡前告别', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-009', domain_id: 'D01', class_id: 'C01', title_zh: '睡觉·听自制睡前小故事', target_version: 'V2', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-010', domain_id: 'D01', class_id: 'C01', title_zh: '玩玩具·桌上积木说颜色', target_version: 'V1', design_state: 'baseline_design', scope_status: 'in_scope', app_scene_ids: ['scene-colors-shapes'] },
  { scene_id: 'SC-C01-011', domain_id: 'D01', class_id: 'C01', title_zh: '玩玩具·猫狗鸟玩具说名称', target_version: 'V1', design_state: 'baseline_design', scope_status: 'in_scope', app_scene_ids: ['scene-animals-actions', 'scene-animals-pets'] },
  { scene_id: 'SC-C01-012', domain_id: 'D01', class_id: 'C01', title_zh: '玩玩具·玩偶轮流玩具', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-013', domain_id: 'D01', class_id: 'C01', title_zh: '看书·自制动物情境图', target_version: 'V1', design_state: 'baseline_design', scope_status: 'in_scope', app_scene_ids: ['scene-animals-park'] },
  { scene_id: 'SC-C01-014', domain_id: 'D01', class_id: 'C01', title_zh: '看书·选择想看的自制书', target_version: 'V2', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C01-015', domain_id: 'D01', class_id: 'C01', title_zh: '看书·自制图画书一轮共读', target_version: 'V2', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  // ── D01 日常生活域 / C02 生活知识（3 行）──
  { scene_id: 'SC-C02-001', domain_id: 'D01', class_id: 'C02', title_zh: '白天黑夜·看图说日夜', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C02-002', domain_id: 'D01', class_id: 'C02', title_zh: '白天黑夜·选择日夜生活图片', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C02-003', domain_id: 'D01', class_id: 'C02', title_zh: '白天黑夜·听看昼夜变化故事', target_version: 'V2', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  // ── D02 校园与成长域 / C03 幼儿园（12 行）──
  { scene_id: 'SC-C03-001', domain_id: 'D02', class_id: 'C03', title_zh: '接送·入园问候模拟', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-002', domain_id: 'D02', class_id: 'C03', title_zh: '接送·离园告别模拟', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-003', domain_id: 'D02', class_id: 'C03', title_zh: '接送·回家说明需要休息', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-004', domain_id: 'D02', class_id: 'C03', title_zh: '幼儿园上课·圈圈时间问候', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-005', domain_id: 'D02', class_id: 'C03', title_zh: '幼儿园上课·看图递卡请求', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-006', domain_id: 'D02', class_id: 'C03', title_zh: '幼儿园上课·请求帮助', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-007', domain_id: 'D02', class_id: 'C03', title_zh: '幼儿园课程·美术课色纸命名', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: ['scene-colors-paper'] },
  { scene_id: 'SC-C03-008', domain_id: 'D02', class_id: 'C03', title_zh: '幼儿园课程·自然课动物图', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-009', domain_id: 'D02', class_id: 'C03', title_zh: '幼儿园课程·音乐课听韵律', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-010', domain_id: 'D02', class_id: 'C03', title_zh: '园内分享·分享动物卡', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-011', domain_id: 'D02', class_id: 'C03', title_zh: '园内分享·请求轮到自己', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] },
  { scene_id: 'SC-C03-012', domain_id: 'D02', class_id: 'C03', title_zh: '园内分享·表达愿意或暂不分享', target_version: 'V1.5', design_state: 'planned', scope_status: 'in_scope', app_scene_ids: [] }
] as const);

/** 已实现（有已审校自制原创场景图）的目录行。 */
export function implementedScenes(): readonly TaxonomyScene[] {
  return TAXONOMY_SCENES.filter(s => s.app_scene_ids.length > 0);
}

/** 规划中（灰态不可点）的目录行。 */
export function plannedScenes(): readonly TaxonomyScene[] {
  return TAXONOMY_SCENES.filter(s => s.app_scene_ids.length === 0);
}

export function findDomain(domainId: string): Result<Domain> {
  const found = DOMAINS.find(d => d.domain_id === domainId);
  if (!found) return fail('NOT_FOUND', '没有找到这个场景域。');
  return ok(found);
}

export function findClass(classId: string): Result<SceneClass> {
  const found = CLASSES.find(c => c.class_id === classId);
  if (!found) return fail('NOT_FOUND', '没有找到这个场景类。');
  return ok(found);
}

export function classesOfDomain(domainId: string): readonly SceneClass[] {
  return CLASSES.filter(c => c.domain_id === domainId);
}

export function scenesOfClass(classId: string): readonly TaxonomyScene[] {
  return TAXONOMY_SCENES.filter(s => s.class_id === classId);
}

/** 分级视图：只返回**有已登记场景行**的域与类，避免空壳分组。 */
export interface DomainGroup {
  domain: Domain;
  classes: readonly { cls: SceneClass; scenes: readonly TaxonomyScene[] }[];
}

export function groupedTaxonomy(): readonly DomainGroup[] {
  const groups: DomainGroup[] = [];
  for (const domain of DOMAINS) {
    const classes = classesOfDomain(domain.domain_id)
      .map(cls => ({ cls, scenes: scenesOfClass(cls.class_id) }))
      .filter(entry => entry.scenes.length > 0);
    if (classes.length > 0) groups.push({ domain, classes });
  }
  return groups;
}

/** 内容审校状态（应用侧）：目录行引用到已实现场景图即为 reviewed。 */
export function appReviewStatus(scene: TaxonomyScene): ContentReviewStatus | null {
  return scene.app_scene_ids.length > 0 ? 'reviewed' : null;
}

/** 结构校验：ID 唯一、域/类引用一致、场景 ID 形态、引用到真实场景图。 */
export function validateTaxonomy(): Result<true> {
  const domainIds = DOMAINS.map(d => d.domain_id);
  if (new Set(domainIds).size !== domainIds.length) return fail('INVALID_INPUT', '场景域 ID 必须唯一');
  if (DOMAINS.length !== 8) return fail('INVALID_INPUT', '冻结注册表应为 8 个场景域');

  const classIds = CLASSES.map(c => c.class_id);
  if (new Set(classIds).size !== classIds.length) return fail('INVALID_INPUT', '场景类 ID 必须唯一');
  if (CLASSES.length !== 27) return fail('INVALID_INPUT', '冻结注册表应为 27 个场景类');
  for (const cls of CLASSES) {
    if (!domainIds.includes(cls.domain_id))
      return fail('INVALID_INPUT', '场景类引用了未知场景域');
  }

  const sceneIds = TAXONOMY_SCENES.map(s => s.scene_id);
  if (new Set(sceneIds).size !== sceneIds.length) return fail('INVALID_INPUT', '场景 ID 必须唯一');

  const knownScenes = new Set(SCENES.map(s => s.scene_id));
  const usedAppScenes = new Set<string>();
  for (const row of TAXONOMY_SCENES) {
    if (!/^SC-C\d{2}-\d{3}$/.test(row.scene_id))
      return fail('INVALID_INPUT', '场景 ID 必须为 SC-Cxx-nnn 形态');
    if (!domainIds.includes(row.domain_id)) return fail('INVALID_INPUT', '场景行引用了未知场景域');
    const cls = CLASSES.find(c => c.class_id === row.class_id);
    if (!cls) return fail('INVALID_INPUT', '场景行引用了未知场景类');
    if (cls.domain_id !== row.domain_id)
      return fail('INVALID_INPUT', '场景行域与类归属不一致');
    if (row.scope_status === 'out_of_current_scope' && row.design_state !== 'blocked')
      return fail('INVALID_INPUT', '超出当前范围的场景必须标为 blocked');
    for (const appId of row.app_scene_ids) {
      if (!knownScenes.has(appId))
        return fail('INVALID_INPUT', '场景行引用了不存在的场景图');
      if (usedAppScenes.has(appId))
        return fail('INVALID_INPUT', '同一场景图不得挂到两行目录');
      usedAppScenes.add(appId);
    }
  }
  // 已实现的场景图必须都能在目录中找到归属（不遗漏）。
  for (const scene of SCENES) {
    if (!usedAppScenes.has(scene.scene_id))
      return fail('INVALID_INPUT', '已实现的场景图未在目录中登记');
  }
  return ok(true);
}
