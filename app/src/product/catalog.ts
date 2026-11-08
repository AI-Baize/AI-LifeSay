import raw from '../content/pilotCatalog.json';

export type Mode = 'parent' | 'child' | 'echo';
export interface Line { id: string; text: string; echo: boolean }
export interface Frame { id: string; image: string; lines: Line[]; note: string }
export interface Activity {
  id: string; title: string; goal: string; goalId: string; materials: string;
  boundary: string; offline: string; kind: 'speaking' | 'reading'; frames: Frame[];
  modes: Mode[]; sourceUnit: string;
}
export const isMarket = import.meta.env.MODE === 'market-free';
export const contentVersion = raw.content_version;
// No candidate is approved by this adapter. The market build aliases raw to an
// empty approved-release manifest and excludes the historical public directory.
export const activities: Activity[] = [
  ...raw.units.map(u => ({ id: u.id, title: u.title, goal: u.target, goalId: u.goal_id,
    materials: u.materials, boundary: u.boundary, offline: u.offline,
    kind: 'speaking' as const, sourceUnit: u.id, modes: ['parent', 'child', 'echo'] as Mode[],
    frames: [{ id: `${u.id}-frame`, image: u.image, note: u.offline, lines: [
      { id: u.line_ids.stimulus, text: u.stimulus, echo: false },
      { id: u.line_ids.model, text: u.model, echo: true }
    ] }]
  })),
  ...raw.stories.map(s => ({ id: s.id, title: s.title, goal: '一起听故事、看图理解；不等于独立读字。',
    goalId: '', materials: '和孩子一起看图', boundary: '共读不是独立解码，不根据翻页产生能力成绩。',
    offline: '放下屏幕，用玩偶再演一演故事。', kind: 'reading' as const, sourceUnit: s.unit_id,
    modes: ['parent', 'child'] as Mode[], frames: s.frames.map(f => ({ id: f.id, image: f.image,
      note: f.parent_note, lines: [{ id: `${f.id}-line`, text: f.text, echo: false }] })) }))
];
export const findActivity = (id: string) => activities.find(a => a.id === id);
export const modeNames: Record<Mode, string> = { parent: '家长带着做', child: '让孩子点读', echo: '跟读练习' };
export function validMode(value: string | null, activity: Activity): Mode {
  return activity.modes.find(m => m === value) ?? activity.modes[0] ?? 'parent';
}
export function makeGroup(current: string, requested: string[], mode: Mode): string[] {
  const allowed = [...new Set(requested)].filter(id => findActivity(id)?.modes.includes(mode)).slice(0, 5);
  return allowed.includes(current) ? [current, ...allowed.filter(id => id !== current)] : [current];
}
