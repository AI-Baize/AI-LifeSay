import { fail, ok, type ContentReviewStatus, type Result } from './types';

// 批次2：单词卡目录（「每个单词都要配图」的落地与门禁）。
//
// 口径：
// - 每张单词卡 = **自制原创 SVG**（rights: original），不内嵌受版权保护的绘本页/教材页/照片。
// - 单词卡只做**展示与朗读**：看图/播放**不产生能力成功**，不计分、不进记录与周报。
// - 受控路径：仅允许 `words/` 下的 svg，禁止外部 URL、上传路径与目录穿越。
// - 未审校不冒充可用（`publishableWords` 只返回 reviewed）。

export interface WordCard {
  word_id: string;
  label_en: string;
  label_zh: string;
  /** 仅允许 words/ 下的受控路径（safeWordPath 校验）。 */
  image_path: string;
  theme_id: string;
  rights: 'original';
  review_status: ContentReviewStatus;
}

export const WORD_CARDS: readonly WordCard[] = Object.freeze([
  { word_id: 'W-FG-hello', label_en: 'Hello!', label_zh: '你好（问好）', image_path: 'words/word-hello.svg', theme_id: 'family-greetings', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-FG-hi', label_en: 'Hi!', label_zh: '嗨（回应）', image_path: 'words/word-hi.svg', theme_id: 'family-greetings', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-FG-byebye', label_en: 'Bye-bye!', label_zh: '再见', image_path: 'words/word-byebye.svg', theme_id: 'family-greetings', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-CS-red', label_en: 'Red', label_zh: '红色', image_path: 'words/word-red.svg', theme_id: 'colors-shapes', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-CS-blue', label_en: 'Blue', label_zh: '蓝色', image_path: 'words/word-blue.svg', theme_id: 'colors-shapes', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-CS-yellow', label_en: 'Yellow', label_zh: '黄色', image_path: 'words/word-yellow.svg', theme_id: 'colors-shapes', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-AA-cat', label_en: 'Cat', label_zh: '猫', image_path: 'words/word-cat.svg', theme_id: 'animals-actions', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-AA-dog', label_en: 'Dog', label_zh: '狗', image_path: 'words/word-dog.svg', theme_id: 'animals-actions', rights: 'original', review_status: 'reviewed' },
  { word_id: 'W-AA-bird', label_en: 'Bird', label_zh: '鸟', image_path: 'words/word-bird.svg', theme_id: 'animals-actions', rights: 'original', review_status: 'reviewed' }
] as const);

// 受控单词卡路径：只允许 public/words 下的 svg。
export function safeWordPath(v: unknown): v is string {
  return typeof v === 'string' && /^words\/[a-z0-9-]+\.svg$/.test(v);
}

export function findWord(wordId: string): Result<WordCard> {
  const found = WORD_CARDS.find(w => w.word_id === wordId);
  if (!found) return fail('NOT_FOUND', '没有找到这张单词卡。');
  return ok(found);
}

/** 按英文标注词查卡（热点词 → 图）。 */
export function wordForLabel(labelEn: string): WordCard | null {
  return WORD_CARDS.find(w => w.label_en === labelEn) ?? null;
}

export function wordsForTheme(themeId: string): readonly WordCard[] {
  return WORD_CARDS.filter(w => w.theme_id === themeId);
}

/** 发布态：只含已审校的单词卡。 */
export function publishableWords(): readonly WordCard[] {
  return WORD_CARDS.filter(w => w.review_status === 'reviewed');
}

/** 结构校验：路径受控、ID 唯一、标签非空。 */
export function validateWords(): Result<true> {
  const ids = WORD_CARDS.map(w => w.word_id);
  if (new Set(ids).size !== ids.length) return fail('INVALID_INPUT', '单词卡 ID 必须唯一');
  for (const w of WORD_CARDS) {
    if (!w.label_en.trim() || !w.label_zh.trim()) return fail('INVALID_INPUT', '单词卡缺少标注词');
    if (!safeWordPath(w.image_path)) return fail('INVALID_INPUT', '单词卡图片必须在 words/ 受控目录内');
    if (w.rights !== 'original') return fail('INVALID_INPUT', '单词卡必须为自制原创（original）');
  }
  return ok(true);
}
