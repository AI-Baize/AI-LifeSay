import { fail, ok, type Result } from './types';

// V1.5-B4：资源导入与权利分流（F19–F22 / V15-07）。
//
// 审校记录：方案优化1.2/22-内容审校结论-V1.5新增-pass.md（decision=approved_with_issues）。
//
// 口径（01-产品定位 §F19–F22；06 §ADR1.2-13 / §D1.2-16；03 §P9）：
// - **权利状态先于文件正文**。unknown → 只允许手填最小书目元数据（书目卡片），
//   **零正文**：不预读封面、不 OCR、不解码试听、不建索引（ADR1.2-13）。
// - 文件选择 ≠ 启用麦克风（F20）；支持播放 ≠ 支持视频识别（F21）；
//   PDF 先渲染，抽取/OCR 分权限（F22）。
// - 相机/相册扫描 **不在运行范围**（红线）；本模块不注册任何相机入口。
// - 付费不改变红线：不能授予应用或用户本无的版权权限。
// - 「合法持有」不等于「可复制或提取」。

export type ResourceKind = 'image' | 'audio' | 'video' | 'pdf';
export type ResourceRights = 'unknown' | 'original' | 'licensed';
/** 允许的操作；除建卡外，任何操作都必须权利明确。 */
export type ResourceAction = 'create_card' | 'local_view' | 'local_play' | 'text_extract' | 'ocr';

export interface ResourceCard {
  card_id: string;
  kind: ResourceKind;
  title_zh: string;
  /** 手填的最小书目元数据；不来自读取正文。 */
  source_note: string | null;
  rights_status: ResourceRights;
  /** 权利证据引用；unknown 时必须为 null。 */
  rights_evidence: string | null;
  /** 由 schema 预检，禁止设为 true（相机红线）。 */
  from_camera?: boolean;
}

export const KIND_LABEL: Record<ResourceKind, string> = {
  image: '图片',
  audio: '音频',
  video: '视频',
  pdf: 'PDF'
};

// 每种资源在**权利明确**时理论上可研究的操作（不代表已实现、不代表格式已覆盖）。
// 格式覆盖待实测（D10 兼容矩阵），这里只做门禁判断，不做解析实现。
const KIND_ACTIONS: Record<ResourceKind, readonly Exclude<ResourceAction, 'create_card'>[]> = {
  image: ['local_view'],
  audio: ['local_play'],
  video: ['local_play'],
  pdf: ['local_view', 'text_extract', 'ocr']
};

// 相机/扫描：不在运行范围。
export const CAMERA_STATUS = Object.freeze({
  registered: false,
  reason_zh: '不注册相机/相册扫描入口；与无相机红线冲突，未经新决策不得解除。'
});

/** 某卡当前允许的操作集合：unknown → 只有建卡；权利明确 → 建卡 + 该类型的本地操作。 */
export function allowedActions(card: Pick<ResourceCard, 'kind' | 'rights_status'>): readonly ResourceAction[] {
  if (card.rights_status === 'unknown') return ['create_card'];
  return ['create_card', ...KIND_ACTIONS[card.kind]];
}

/** 权利未明则任何「正文类」操作都被阻断（零正文）。 */
export function isContentActionBlocked(card: Pick<ResourceCard, 'rights_status'>): boolean {
  return card.rights_status === 'unknown';
}

// 演示卡：仅手填书目元数据；unknown 示例如实反映「只建卡」。
export const RESOURCE_CARDS: readonly ResourceCard[] = Object.freeze([
  {
    card_id: 'RC-demo-unknown-picturebook',
    kind: 'image',
    title_zh: '示例：一本自购绘本封面（权利待核实）',
    source_note: '家长手填：书名与来源，未读取文件正文',
    rights_status: 'unknown',
    rights_evidence: null
  }
]);

// 结构性校验：unknown 必须零正文（无证据、无相机）；权利明确必须有证据；相机一律禁止。
export function validateResourceCards(cards: readonly ResourceCard[] = RESOURCE_CARDS): Result<true> {
  const ids = cards.map(c => c.card_id);
  if (new Set(ids).size !== ids.length) return fail('INVALID_INPUT', '资源卡 ID 必须唯一');
  for (const card of cards) {
    if (card.from_camera) return fail('INVALID_INPUT', '不得接受来自相机的资源（红线）');
    if (card.rights_status === 'unknown') {
      if (card.rights_evidence !== null)
        return fail('INVALID_INPUT', '权利未明不得持有权利证据（零正文）');
      const actions = allowedActions(card);
      if (actions.length !== 1 || actions[0] !== 'create_card')
        return fail('INVALID_INPUT', '权利未明只允许建卡');
    } else {
      if (!card.rights_evidence)
        return fail('INVALID_INPUT', '权利明确必须提供权利证据引用');
    }
  }
  return ok(true);
}

/** only-card（零正文）的卡：用于 UI 明示「仅书目卡片」。 */
export function cardOnlyCards(cards: readonly ResourceCard[] = RESOURCE_CARDS): readonly ResourceCard[] {
  return cards.filter(c => isContentActionBlocked(c));
}
