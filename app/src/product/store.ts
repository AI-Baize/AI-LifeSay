import { create } from 'zustand';
import { findActivity, type Mode } from './catalog';

export interface Preferences {
  auto: boolean; advance: boolean; echoPause: 'short' | 'standard' | 'long';
  daily: boolean; recordTime: string; age: string; ageConfirmed: boolean; listening: string; speaking: string; reading: string;interests?:string[];
}
export interface Goal { week: string; text: string; savedAt: number | null }
export interface Experience {
  id: string; version: string; group: string[]; mode: Mode; frame: number; unit: number;
  startedAt: number; updatedAt: number; endedAt: number | null;
  reason: 'interrupted' | 'user_end' | 'group_done'; localDate: string; timezone: string;
}
interface Data { schema: 1; accepted: boolean; prefs: Preferences; selected: string; group: string[]; goals: Goal[]; experiences: Experience[] }
const KEY = 'aienglish-product-v1';
const defaultInterestAge = 'A02';
const defaults = (): Data => ({ schema: 1, accepted: false,
  prefs: { auto: true, advance: true, echoPause: 'standard', daily: true, recordTime: '20:00', age: defaultInterestAge, ageConfirmed: false, listening: 'unknown', speaking: 'unknown', reading: 'unknown' },
  selected: 'hello', group: [], goals: [], experiences: [] });
export const localDate = (n = Date.now()) => { const d = new Date(n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function localWeek(n = Date.now()) { const d = new Date(n); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return localDate(d.getTime()); }
export const retained = (g: Goal, now = Date.now()) => g.savedAt === null || now < g.savedAt + 30 * 86400000;

function decode(value: unknown): Data {
  if (!value || typeof value !== 'object') throw new Error('Invalid data');
  const d = value as Data;
  if (d.schema !== 1 || typeof d.accepted !== 'boolean' || !d.prefs || typeof d.selected !== 'string'
    || !Array.isArray(d.group) || !d.group.every(x => typeof x === 'string')
    || !Array.isArray(d.goals) || !Array.isArray(d.experiences)) throw new Error('Invalid structure');
  const p = d.prefs;
  if(p.interests!==undefined&&(!Array.isArray(p.interests)||p.interests.length>27||!p.interests.every(x=>typeof x==='string'&&/^(?:C0[1-3]|T(?:0[1-9]|1[0-9]|2[0-4]))$/.test(x))))throw new Error('Invalid interests');
  if (![p.auto, p.advance, p.daily].every(x => typeof x === 'boolean')
    || !['short', 'standard', 'long'].includes(p.echoPause)
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.recordTime)
    || ![p.age, p.listening, p.speaking, p.reading].every(x => typeof x === 'string')
    || d.goals.some(g => !g || !/^\d{4}-\d{2}-\d{2}$/.test(g.week) || typeof g.text !== 'string' || g.text.length > 300 || !(g.savedAt === null || Number.isFinite(g.savedAt)))
    || d.experiences.some(e => !e || typeof e.id !== 'string' || typeof e.version !== 'string'
      || !Array.isArray(e.group) || !e.group.every(x => typeof x === 'string') || !['parent', 'child', 'echo'].includes(e.mode)
      || !Number.isInteger(e.frame) || e.frame < 0 || !Number.isInteger(e.unit) || e.unit < 0
      || !Number.isFinite(e.startedAt) || !Number.isFinite(e.updatedAt) || !(e.endedAt === null || Number.isFinite(e.endedAt))
      || !['interrupted', 'user_end', 'group_done'].includes(e.reason) || typeof e.localDate !== 'string' || typeof e.timezone !== 'string')) throw new Error('Invalid values');
  return { ...d, prefs: { ...p, age: p.ageConfirmed === false ? defaultInterestAge : p.age, ageConfirmed: p.ageConfirmed !== false }, goals: d.goals.filter(g => retained(g)) };
}
interface Store {
  data: Data; error: string | null; blocked: boolean; ready: boolean;
  load: () => void; accept: () => boolean;
  preferences: (patch: Partial<Preferences>) => boolean;
  select: (id: string) => boolean; setGroup: (ids: string[]) => boolean;
  saveGoal: (week: string, text: string) => boolean; deleteGoal: (week: string) => boolean;
  experience: (item: Experience) => boolean; erase: () => boolean;
  exportData: () => void;
  migrateGoals: (goals: Record<string, string>, dates: Record<string, number>) => boolean;
}
export const useProductStore = create<Store>((set, get) => {
  const commit = (next: Data): boolean => {
    if (get().blocked) return false;
    try {
      const checked = decode(next);
      localStorage.setItem(KEY, JSON.stringify(checked));
      set({ data: checked, error: null }); return true;
    } catch { set({ error: '本机保存失败，请检查存储空间。原有数据未被替换。' }); return false; }
  };
  return {
    data: defaults(), error: null, blocked: false, ready: false,
    load() {
      try { const value = localStorage.getItem(KEY); set({ data: value ? decode(JSON.parse(value)) : defaults(), error: null, blocked: false, ready: true }); }
      catch { set({ blocked: true, ready: true, error: '本机资料无法读取，已保留原始数据。请导出原始备份或重新读取，避免覆盖。' }); }
    },
    accept: () => commit({ ...get().data, accepted: true }),
    preferences: patch => commit({ ...get().data, prefs: { ...get().data.prefs, ...patch, ...(patch.age !== undefined ? { ageConfirmed: true } : {}) } }),
    select: id => !!findActivity(id) && commit({ ...get().data, selected: id }),
    setGroup: ids => commit({ ...get().data, group: [...new Set(ids)].filter(id => !!findActivity(id)).slice(0, 5) }),
    saveGoal(week, text) {
      const date = new Date(`${week}T12:00:00`);
      if (!text.trim() || text.trim().length > 300 || !Number.isFinite(date.getTime()) || localWeek(date.getTime()) !== week) return false;
      return commit({ ...get().data, goals: [...get().data.goals.filter(g => g.week !== week && retained(g)), { week, text: text.trim(), savedAt: Date.now() }] });
    },
    deleteGoal: week => commit({ ...get().data, goals: get().data.goals.filter(g => g.week !== week) }),
    experience(item) {
      if (!get().data.accepted) return false;
      return commit({ ...get().data, experiences: [item, ...get().data.experiences.filter(e => e.id !== item.id)] });
    },
    erase() { try { localStorage.removeItem(KEY); set({ data: defaults(), error: null, blocked: false }); return true; } catch { set({ error: '清除失败，请重试。' }); return false; } },
    exportData() {
      const raw = localStorage.getItem(KEY);
      const blob = new Blob([get().blocked ? raw ?? '' : JSON.stringify({ exportedAt: new Date().toISOString(), data: get().data }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = `aienglish-local-${localDate()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    migrateGoals(goals, dates) {
      const d = get().data;
      const additions = Object.entries(goals).filter(([week]) => !d.goals.some(g => g.week === week)).map(([week, text]) => ({ week, text: text.slice(0, 300), savedAt: dates[week] ?? null })).filter(g => retained(g));
      return additions.length ? commit({ ...d, goals: [...d.goals, ...additions] }) : true;
    }
  };
});
