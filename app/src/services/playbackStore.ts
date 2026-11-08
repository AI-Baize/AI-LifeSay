import { fail, ok, type Result } from '../content/types';
import {
  PLAYBACK_NAMESPACE,
  bookmarks,
  recordPosition,
  resumePosition,
  sanitizeList,
  toggleBookmark,
  type PlaybackProgress
} from '../domain/playbackProgress';

// V1.5-B5：播放进度的本机持久化。
//
// 关键：**与学习表现分开存储**（F26）。
// - 独立命名空间 `children-english-local:playback:v1`，不做进 Dexie 学习表，
//   也不进 records / reports / nextStep；播放状态不构成能力证据。
// - 读取失败/损坏 → 返回空列表，不抛错、不猜值、不静默改写学习数据。
// - 无 localStorage（SSR/受限环境）→ 内存回退，功能降级但可用。

let memoryFallback: PlaybackProgress[] = [];

const storage = (): Storage | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
};

export function loadProgress(): readonly PlaybackProgress[] {
  const s = storage();
  if (!s) return memoryFallback;
  try {
    const raw = s.getItem(PLAYBACK_NAMESPACE);
    if (!raw) return [];
    return sanitizeList(JSON.parse(raw));
  } catch {
    // 损坏数据不抛错、不猜值；当作空。
    return [];
  }
}

function persist(list: readonly PlaybackProgress[]): Result<null> {
  const s = storage();
  if (!s) {
    memoryFallback = [...list];
    return ok(null);
  }
  try {
    s.setItem(PLAYBACK_NAMESPACE, JSON.stringify(list));
    return ok(null);
  } catch {
    return fail('UNSUPPORTED', '本机存储不可用，播放位置本次不保存');
  }
}

/** 记录播放位置。 */
export function savePosition(mediaId: string, position: number, duration: number | null, now = Date.now()): readonly PlaybackProgress[] {
  const next = recordPosition(loadProgress(), mediaId, position, duration, now);
  void persist(next);
  return next;
}

/** 切换书签。 */
export function switchBookmark(mediaId: string, now = Date.now()): readonly PlaybackProgress[] {
  const next = toggleBookmark(loadProgress(), mediaId, now);
  void persist(next);
  return next;
}

/** 恢复位置（夹取；接近结尾则从头）。 */
export function restore(mediaId: string): number {
  const found = loadProgress().find(p => p.media_id === mediaId);
  return found ? resumePosition(found) : 0;
}

export function listBookmarks(): readonly PlaybackProgress[] {
  return bookmarks(loadProgress());
}

/** 清空播放进度（设置页用）。不影响学习记录。 */
export function clearProgress(): Result<null> {
  memoryFallback = [];
  const s = storage();
  if (!s) return ok(null);
  try {
    s.removeItem(PLAYBACK_NAMESPACE);
    return ok(null);
  } catch {
    return fail('UNSUPPORTED', '本机存储不可用，暂时无法清空');
  }
}

/** Player-facing writes return persistence errors instead of claiming a saved position. */
export function storePosition(mediaId:string,position:number,duration:number|null):Result<readonly PlaybackProgress[]> {
 const next=recordPosition(loadProgress(),mediaId,position,duration,Date.now());
 const saved=persist(next);return saved.ok?ok(next):saved;
}
export function storeBookmark(mediaId:string):Result<readonly PlaybackProgress[]> {
 const next=toggleBookmark(loadProgress(),mediaId,Date.now());
 const saved=persist(next);return saved.ok?ok(next):saved;
}
