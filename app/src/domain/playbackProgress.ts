// V1.5-B5：播放进度／书签（F26）。
//
// 口径（产品方案/01 §F26）：
// - **活动可恢复**；**与学习表现分别存储**。
// - 进度/书签是**播放状态**，不是能力证据：不写记录、不进周报、不参与建议与晋级、不计分。
// - 位置夹取在 [0, duration]；未知时长时保留位置但不冒充分段。
// - 书签只标记「听到哪」，**不代表听懂**；恢复播放不等于继续观察。

export interface PlaybackProgress {
  /** 受控媒体路径（如 audio/family-greetings/meet.mp3）；与资源卡解耦。 */
  media_id: string;
  position_sec: number;
  duration_sec: number | null;
  bookmarked: boolean;
  updated_at: number;
}

/** 存储命名空间：与学习事实（records/reports/nextStep）完全分开。 */
export const PLAYBACK_NAMESPACE = 'children-english-local:playback:v1';

/** 受控媒体路径：只允许 audio/ 下的本地 mp3（与资源门禁一致）。 */
export const isPlayableMediaPath = (p: unknown): p is string =>
  typeof p === 'string' && /^audio\/[a-z0-9-]+\/[a-z0-9-]+\.mp3$/.test(p);

const clampPosition = (position: number, duration: number | null): number => {
  if (!Number.isFinite(position) || position < 0) return 0;
  if (duration !== null && Number.isFinite(duration) && duration > 0)
    return Math.min(position, duration);
  return position;
};

/** 规范化一条进度记录；非法输入返回 null（不猜、不伪造）。 */
export function sanitizeProgress(raw: unknown): PlaybackProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isPlayableMediaPath(r.media_id)) return null;
  const position = typeof r.position_sec === 'number' ? r.position_sec : NaN;
  if (!Number.isFinite(position) || position < 0) return null;
  const durationRaw = r.duration_sec;
  const duration =
    typeof durationRaw === 'number' && Number.isFinite(durationRaw) && durationRaw > 0
      ? durationRaw
      : null;
  return {
    media_id: r.media_id,
    position_sec: clampPosition(position, duration),
    duration_sec: duration,
    bookmarked: r.bookmarked === true,
    updated_at: typeof r.updated_at === 'number' && Number.isFinite(r.updated_at) ? r.updated_at : 0
  };
}

export function sanitizeList(raw: unknown): readonly PlaybackProgress[] {
  if (!Array.isArray(raw)) return [];
  const out: PlaybackProgress[] = [];
  for (const item of raw) {
    const p = sanitizeProgress(item);
    if (p) out.push(p);
  }
  return out;
}

/** 记录播放位置（新增或更新）。返回新的列表，不改动其它项。 */
export function recordPosition(
  list: readonly PlaybackProgress[],
  mediaId: string,
  position: number,
  duration: number | null,
  now: number
): readonly PlaybackProgress[] {
  if (!isPlayableMediaPath(mediaId)) return list;
  const next = sanitizeProgress({ media_id: mediaId, position_sec: position, duration_sec: duration, bookmarked: false, updated_at: now });
  if (!next) return list;
  const prev = list.find(p => p.media_id === mediaId);
  const merged: PlaybackProgress = { ...next, bookmarked: prev?.bookmarked ?? false };
  return [...list.filter(p => p.media_id !== mediaId), merged].sort((a, b) =>
    a.media_id < b.media_id ? -1 : 1
  );
}

/** 切换书签。没有该媒体的进度时，用位置 0 建一条（只标记，不代表能力）。 */
export function toggleBookmark(
  list: readonly PlaybackProgress[],
  mediaId: string,
  now: number
): readonly PlaybackProgress[] {
  if (!isPlayableMediaPath(mediaId)) return list;
  const prev = list.find(p => p.media_id === mediaId);
  const base: PlaybackProgress = prev ?? {
    media_id: mediaId,
    position_sec: 0,
    duration_sec: null,
    bookmarked: false,
    updated_at: now
  };
  const merged: PlaybackProgress = { ...base, bookmarked: !base.bookmarked, updated_at: now };
  return [...list.filter(p => p.media_id !== mediaId), merged].sort((a, b) =>
    a.media_id < b.media_id ? -1 : 1
  );
}

/** 恢复位置：夹取；已听接近结尾（>= 剩余 1 秒）则从头开始，避免「恢复即结束」。 */
export function resumePosition(p: PlaybackProgress): number {
  const pos = clampPosition(p.position_sec, p.duration_sec);
  if (p.duration_sec !== null && p.duration_sec - pos <= 1) return 0;
  return pos;
}

/** 仅取书签项，用于列表展示。 */
export function bookmarks(list: readonly PlaybackProgress[]): readonly PlaybackProgress[] {
  return list.filter(p => p.bookmarked);
}
