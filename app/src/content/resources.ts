import { fail, ok, type Result } from './types';

// V1.5-B3：媒体输入形态的**权利与可用性门禁**（08 §5.1「新媒体」/§5.3/§5.4）。
//
// 审校记录：方案优化1.2/22-内容审校结论-V1.5新增-pass.md（decision=approved_with_issues；reviewer_reference=null）。
//
// 口径（逐条对应原文，不新增承诺）：
// - 媒体只提供输入；**点击/播放结束不产生能力成功**（08 §5.1「新媒体」）。
// - 权利未明（unknown）→ **零正文**：不做缩略图/OCR/音频解码等任何正文处理（08 §5.4）。
// - 视频：自制或已授权；本地播放可预研；**不上传孩子视频**；**播放完成不自动记独立**（08 §5.3）。
// - 不接相机、不留儿童照片（红线，08 §5.3「拍照识别」）。
// - 「已购买」不等于有复制/加工许可；品牌名不构成许可（08 §5.4）。

export type MediaKind = 'image' | 'audio' | 'video';
export type MediaRights = 'unknown' | 'original' | 'licensed';
export type MediaAvailability = 'missing' | 'ready';

export interface MediaItem {
  media_id: string;
  kind: MediaKind;
  title_zh: string;
  rights_status: MediaRights;
  availability: MediaAvailability;
  /** 受控本地路径；权利未明时必须为 null（零正文）。 */
  path: string | null;
  /** 自制/授权证据引用；权利未明时必须为 null。 */
  rights_evidence: string | null;
}

// 受控路径：只允许包内 scenes/ 与 audio/ 目录，禁止外部 URL、上传路径与目录穿越。
const MEDIA_PATH = /^(scenes\/[a-z0-9-]+\.svg|audio\/[a-z0-9-]+\/[a-z0-9-]+\.mp3)$/;

export function safeMediaPath(p: string): boolean {
  if (p.includes('..')) return false;
  return MEDIA_PATH.test(p);
}

// 现实清单：只有本会话已落盘的资产。**没有的就不列**，不凭空造可用项。
// - 图片：3 张自制原创场景图（original / ready）。
// - 音频：3 主题 × 4 段本机合成（original / ready）。
// - 视频：0 条（见 VIDEO_STATUS）。
export const MEDIA_ITEMS: readonly MediaItem[] = Object.freeze([
  { media_id: 'img-family-greetings', kind: 'image', title_zh: '家庭与问候 场景图', rights_status: 'original', availability: 'ready', path: 'scenes/family-greetings.svg', rights_evidence: '自制原创 SVG（会话内创作）' },
  { media_id: 'img-colors-shapes', kind: 'image', title_zh: '颜色与形状 场景图', rights_status: 'original', availability: 'ready', path: 'scenes/colors-shapes.svg', rights_evidence: '自制原创 SVG（会话内创作）' },
  { media_id: 'img-animals-actions', kind: 'image', title_zh: '动物与动作 场景图', rights_status: 'original', availability: 'ready', path: 'scenes/animals-actions.svg', rights_evidence: '自制原创 SVG（会话内创作）' },
  ...[
    ['family-greetings', ['meet', 'practice', 'observe', 'finish']],
    ['colors-shapes', ['show', 'practice', 'observe', 'finish']],
    ['animals-actions', ['show', 'practice', 'observe', 'finish']]
  ].flatMap(([theme, segs]) =>
    (segs as string[]).map(seg => ({
      media_id: `aud-${theme}-${seg}`,
      kind: 'audio' as MediaKind,
      title_zh: `${theme} ${seg} 本机合成音频`,
      rights_status: 'original' as MediaRights,
      availability: 'ready' as MediaAvailability,
      path: `audio/${theme}/${seg}.mp3`,
      rights_evidence: '本机合成（macOS say + lamejs）；非人类母语者录音'
    }))
  )
]);

// 视频现状：**没有**任何自制/已授权视频；格式与性能待实测。
// 明示不可用，不放占位播放器、不假装可播。
export const VIDEO_STATUS = Object.freeze({
  available: false,
  reason_zh: '暂无自制或已授权视频；本地播放格式与性能待实测。不接相机、不上传孩子视频。'
});

export type MediaVerdict = 'usable' | 'blocked_unknown_rights' | 'unavailable';

// 单项媒体门禁：权利未明 → 阻断（零正文）；缺失 → 不可用；其余可用。
export function mediaGate(item: MediaItem): MediaVerdict {
  if (item.rights_status === 'unknown') return 'blocked_unknown_rights';
  if (item.availability !== 'ready' || !item.path) return 'unavailable';
  if (!safeMediaPath(item.path)) return 'unavailable';
  return 'usable';
}

// 只有「可用」的媒体才允许进入任何正文处理路径（展示/解码/缩略图）。
export function usableMedia(): readonly MediaItem[] {
  return MEDIA_ITEMS.filter(m => mediaGate(m) === 'usable');
}

// 结构性校验：权利未明必须零正文；有路径必须受控；证据字段自洽。
export function validateMedia(): Result<true> {
  const ids = MEDIA_ITEMS.map(m => m.media_id);
  if (new Set(ids).size !== ids.length) return fail('INVALID_INPUT', '媒体 ID 必须唯一');
  for (const m of MEDIA_ITEMS) {
    if (m.rights_status === 'unknown') {
      if (m.path !== null || m.rights_evidence !== null)
        return fail('INVALID_INPUT', '权利未明的媒体不得持有路径或证据（零正文）');
    } else if (m.availability === 'ready') {
      if (!m.path || !safeMediaPath(m.path))
        return fail('INVALID_INPUT', '可用媒体必须使用受控本地路径');
      if (!m.rights_evidence)
        return fail('INVALID_INPUT', '可用媒体必须有自制或授权证据引用');
    }
  }
  if (VIDEO_STATUS.available)
    return fail('INVALID_INPUT', '本期不得声称视频可用（无自制/已授权视频）');
  return ok(true);
}
