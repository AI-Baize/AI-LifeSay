import { fail, ok, type ContentReviewStatus, type Result } from "./types";

// 场景图片教学目录（V1.5-B1 / F15「场景点击朗读」+ F09「场景图片教学」）。
//
// 审校记录：方案优化1.2/22-内容审校结论-V1.5新增-pass.md（decision=approved_with_issues；reviewer_reference=null）。
//
// 口径（严格对标 产品方案/01 §4、§5.1，「方案优化1.2 / 08 §5.1、§5.4」）：
// - 场景图为**自制原创 SVG**（rights: original），不内嵌受版权保护的绘本页/教材页/原音频/地标照片。
// - 热点是**人工预先标注的坐标**：命中后读出标注词，属于「标签检索」，**不宣称模型识别**。
// - 未命中不猜：不根据家长的其它动作反推标签，也不生成教学结论。
// - 看点次数/点击次数**不作为能力表现**，不进入记录、周报与建议，也不计分。
// - 热点坐标用百分比表示（0–100），适配缩放；越界或重叠由校验拒绝。

export interface SceneHotspot {
  hotspot_id: string;
  /** 命中后朗读的英文标注词（与直接教学词一致）。 */
  label_en: string;
  /** 家长侧中文提示，不出现在儿童焦点上。 */
  label_zh: string;
  /** 相对场景框的百分比坐标与尺寸（0–100）。 */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneDef {
  scene_id: string;
  theme_id: string;
  /** 仅允许 scenes/ 下的受控路径（safeScenePath 校验）。 */
  image_path: string;
  alt_zh: string;
  rights: "original";
  review_status: ContentReviewStatus;
  hotspots: readonly SceneHotspot[];
  /** 对话场景在图下逐句展示，词汇场景不重复展示单词。 */
  dialogue?: boolean;
}

export const SCENES: readonly SceneDef[] = Object.freeze([
  {
    scene_id: "scene-family-greetings",
    dialogue: true,
    theme_id: "family-greetings",
    image_path: "scenes/family-greetings.svg",
    alt_zh: "自制问候场景：玩偶、孩子与门口",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-FG-bear", label_en: "Hello!", label_zh: "玩偶问好", x: 15, y: 27, w: 30, h: 34 },
      { hotspot_id: "HS-FG-child", label_en: "Hi!", label_zh: "孩子回应", x: 48, y: 40, w: 28, h: 30 },
      { hotspot_id: "HS-FG-door", label_en: "Bye-bye!", label_zh: "告别离开", x: 76, y: 16, w: 20, h: 62 }
    ]
  },
  // 批次2：每主题扩到 3 张场景（含已有 1 张），全部自制原创。
  {
    scene_id: "scene-family-visitor",
    dialogue: true,
    theme_id: "family-greetings",
    image_path: "scenes/family-visitor.svg",
    alt_zh: "自制场景：玩偶来做客（问候）",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-FV-bear", label_en: "Hello!", label_zh: "玩偶问好", x: 16, y: 28, w: 28, h: 34 }
    ]
  },
  {
    scene_id: "scene-family-table",
    dialogue: true,
    theme_id: "family-greetings",
    image_path: "scenes/family-table.svg",
    alt_zh: "自制场景：桌边问候（迁移）",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-FT-child", label_en: "Hi!", label_zh: "孩子回应", x: 22, y: 28, w: 26, h: 32 }
    ]
  },
  {
    scene_id: "scene-colors-shapes",
    theme_id: "colors-shapes",
    image_path: "scenes/colors-shapes.svg",
    alt_zh: "自制颜色场景：红蓝黄三块积木",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-CS-red", label_en: "Red", label_zh: "红色积木", x: 11, y: 41, w: 26, h: 26 },
      { hotspot_id: "HS-CS-blue", label_en: "Blue", label_zh: "蓝色积木", x: 39, y: 39, w: 26, h: 26 },
      { hotspot_id: "HS-CS-yellow", label_en: "Yellow", label_zh: "黄色积木", x: 67, y: 43, w: 26, h: 26 }
    ]
  },
  {
    scene_id: "scene-colors-clothes",
    theme_id: "colors-shapes",
    image_path: "scenes/colors-clothes.svg",
    alt_zh: "自制场景：三件衣服（颜色）",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-CC-red", label_en: "Red", label_zh: "红色衣服", x: 8, y: 28, w: 26, h: 32 },
      { hotspot_id: "HS-CC-blue", label_en: "Blue", label_zh: "蓝色衣服", x: 36, y: 28, w: 26, h: 32 },
      { hotspot_id: "HS-CC-yellow", label_en: "Yellow", label_zh: "黄色衣服", x: 64, y: 28, w: 26, h: 32 }
    ]
  },
  {
    scene_id: "scene-colors-paper",
    theme_id: "colors-shapes",
    image_path: "scenes/colors-paper.svg",
    alt_zh: "自制场景：三张彩纸（颜色）",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-CP-red", label_en: "Red", label_zh: "红色彩纸", x: 10, y: 30, w: 24, h: 32 },
      { hotspot_id: "HS-CP-blue", label_en: "Blue", label_zh: "蓝色彩纸", x: 40, y: 28, w: 24, h: 32 },
      { hotspot_id: "HS-CP-yellow", label_en: "Yellow", label_zh: "黄色彩纸", x: 68, y: 32, w: 24, h: 32 }
    ]
  },
  {
    scene_id: "scene-animals-actions",
    theme_id: "animals-actions",
    image_path: "scenes/animals-actions.svg",
    alt_zh: "自制动物场景：猫、狗与鸟",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-AA-cat", label_en: "Cat", label_zh: "猫", x: 12, y: 24, w: 26, h: 38 },
      { hotspot_id: "HS-AA-dog", label_en: "Dog", label_zh: "狗", x: 38, y: 32, w: 30, h: 36 },
      { hotspot_id: "HS-AA-bird", label_en: "Bird", label_zh: "鸟", x: 74, y: 18, w: 20, h: 24 }
    ]
  },
  {
    scene_id: "scene-animals-pets",
    theme_id: "animals-actions",
    image_path: "scenes/animals-pets.svg",
    alt_zh: "自制场景：室内猫与狗",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-AP-cat", label_en: "Cat", label_zh: "猫", x: 14, y: 30, w: 28, h: 36 },
      { hotspot_id: "HS-AP-dog", label_en: "Dog", label_zh: "狗", x: 52, y: 32, w: 34, h: 34 }
    ]
  },
  {
    scene_id: "scene-animals-park",
    theme_id: "animals-actions",
    image_path: "scenes/animals-park.svg",
    alt_zh: "自制场景：公园里的鸟",
    rights: "original",
    review_status: "reviewed",
    hotspots: [
      { hotspot_id: "HS-AK-bird", label_en: "Bird", label_zh: "鸟", x: 48, y: 32, w: 28, h: 30 }
    ]
  }
] as const);

// 受控场景资源路径：只允许 public/scenes 下的 svg，禁止外部 URL 与上传路径。
export function safeScenePath(v: unknown): v is string {
  return typeof v === "string" && /^scenes\/[a-z0-9-]+\.svg$/.test(v);
}

export function readScenes(): Result<readonly SceneDef[]> {
  return ok(SCENES);
}

export function sceneForTheme(themeId: string): SceneDef | null {
  return SCENES.find(s => s.theme_id === themeId) ?? null;
}

/** 批次2：某主题下的全部场景图（每主题多张）。 */
export function scenesForTheme(themeId: string): readonly SceneDef[] {
  return SCENES.filter(s => s.theme_id === themeId);
}

export function findScene(sceneId: string): Result<SceneDef> {
  const found = SCENES.find(s => s.scene_id === sceneId);
  if (!found) return fail("NOT_FOUND", "没有找到这个场景图。");
  return ok(found);
}

export function findHotspot(sceneId: string, hotspotId: string): Result<SceneHotspot> {
  const scene = SCENES.find(s => s.scene_id === sceneId);
  if (!scene) return fail("NOT_FOUND", "没有找到这个场景图。");
  const hs = scene.hotspots.find(h => h.hotspot_id === hotspotId);
  if (!hs) return fail("NOT_FOUND", "未命中任何已标注热点；未命中不猜。");
  return ok(hs);
}

// 场景图片教学可用性：只有 reviewed 且含热点的场景才允许进入发布态。
export function publishableScenes(): readonly SceneDef[] {
  return SCENES.filter(s => s.review_status === "reviewed" && s.hotspots.length > 0);
}
