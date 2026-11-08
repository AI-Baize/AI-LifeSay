import { fail, ok, type ContentReviewStatus, type Result } from './types';

// 批次3（P-玩法 G1）：课内玩法变体。
//
// **硬边界（08 §5.3 / 09「新玩法不静默增第三课」）**：
// - 本文件定义的是**同一门课内的玩法变体**，不是第三门课程。
// - 变体不新增 presentation_mode、不新建 session、不写表现记录、不计分。
// - 若某变体改变了**回应模态**（例如从「口头命名」变成「做动作」），
//   那属于**新目标**，必须另立决策，不得在此静默生效。
// - 素材零版权风险：仅复用自制原创场景图/单词卡 + 本机 TTS；不内嵌受版权保护的音频或绘本页。

export type GameModeId = 'point_listen' | 'listen_identify' | 'action_rhythm';

export interface GameModeDef {
  mode_id: GameModeId;
  title_zh: string;
  /** 家长怎么做。 */
  parent_zh: string;
  /** 孩子做什么（观察到的行为，不是评分项）。 */
  child_zh: string;
  /** 需要的材料（全部为本机已有，无外部素材）。 */
  materials_zh: readonly string[];
  /** 是否改变回应模态（true 表示需另立决策，不得静默生效）。 */
  changes_response_modality: boolean;
  /** 硬边界常量：永远是 false，供测试与 UI 引用，防止被当成第三门课。 */
  is_course: false;
  creates_session: false;
  writes_record: false;
  rights: 'original';
  review_status: ContentReviewStatus;
}

export const POINT_LISTEN: GameModeDef = {
  mode_id: 'point_listen',
  title_zh: '点听',
  parent_zh: '点一点场景热区或单词卡，读出这个词。',
  child_zh: '孩子看图和听词；愿意时跟着说。',
  materials_zh: ['自制原创场景图', '自制原创单词卡', '本机 en-US 声线'],
  changes_response_modality: false,
  is_course: false,
  creates_session: false,
  writes_record: false,
  rights: 'original',
  review_status: 'reviewed'
};

export const LISTEN_IDENTIFY: GameModeDef = {
  mode_id: 'listen_identify',
  title_zh: '听音指认',
  parent_zh: '只播放词音，不先亮图；让孩子在图或卡中指出来。',
  child_zh: '孩子听音后指认对应的图或卡（或用手势表示不确定）。',
  materials_zh: ['自制原创场景图', '自制原创单词卡', '本机 en-US 声线'],
  // 听→指认仍是「识别」类回应，与点听同属命名/识别族，不改变回应模态。
  changes_response_modality: false,
  is_course: false,
  creates_session: false,
  writes_record: false,
  rights: 'original',
  review_status: 'reviewed'
};

export const ACTION_RHYTHM: GameModeDef = {
  mode_id: 'action_rhythm',
  title_zh: '动作律动（听指令做动作）',
  parent_zh: '说一个短指令，让孩子做对应动作；做不出就一起做一遍。',
  child_zh: '孩子听指令做动作（或跟随家长一起做）。',
  materials_zh: ['无专用材料（纯身体动作）', '可选：自制原创动物场景图作提示'],
  // 回应模态从「说/指认」变为「做动作」→ 属新目标，必须另立决策。
  changes_response_modality: true,
  is_course: false,
  creates_session: false,
  writes_record: false,
  rights: 'original',
  review_status: 'reviewed'
};

export const GAME_MODES: readonly GameModeDef[] = Object.freeze([
  POINT_LISTEN,
  LISTEN_IDENTIFY,
  ACTION_RHYTHM
]);

/** 默认玩法（点听）：UI 初始值，避免索引可能为 undefined。 */
export const DEFAULT_GAME_MODE: GameModeDef = POINT_LISTEN;

/** 课内玩法变体的统一边界声明（UI 与文档共用，防止口径漂移）。 */
export const MODE_BOUNDARY_ZH =
  '课内玩法变体：切换不新建课程或会话、不写表现记录、不计分；若玩法改变了回应模态（如改为做动作），属新目标，需另立决策。';

export function findGameMode(modeId: string): Result<GameModeDef> {
  const found = GAME_MODES.find(m => m.mode_id === modeId);
  if (!found) return fail('NOT_FOUND', '没有找到这个玩法。');
  return ok(found);
}

/** 发布态：只含已审校的玩法变体。 */
export function publishableGameModes(): readonly GameModeDef[] {
  return GAME_MODES.filter(m => m.review_status === 'reviewed');
}

/** 需要另立决策的变体（改变了回应模态）。 */
export function modesNeedingDecision(): readonly GameModeDef[] {
  return GAME_MODES.filter(m => m.changes_response_modality);
}

/** 结构校验：ID 唯一、非空文案、硬边界常量不可被改写。 */
export function validateGameModes(): Result<true> {
  const ids = GAME_MODES.map(m => m.mode_id);
  if (new Set(ids).size !== ids.length) return fail('INVALID_INPUT', '玩法 ID 必须唯一');
  for (const m of GAME_MODES) {
    if (!m.title_zh.trim() || !m.parent_zh.trim() || !m.child_zh.trim())
      return fail('INVALID_INPUT', '玩法缺少说明文案');
    if (m.rights !== 'original') return fail('INVALID_INPUT', '玩法素材必须为自制原创');
    if (m.is_course !== false || m.creates_session !== false || m.writes_record !== false)
      return fail('INVALID_INPUT', '课内玩法变体不得成为课程/会话/记录');
  }
  return ok(true);
}
