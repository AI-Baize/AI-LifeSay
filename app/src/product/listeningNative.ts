import { Capacitor, registerPlugin } from '@capacitor/core';
import type { ListeningKind } from './formalCourseData';

export interface ListeningPlan {
  id: string;
  time: string;
  scenes: string[];
  playCount?: number;
  repeat: 'once' | 'weekly' | 'workday' | 'holiday';
  days: number[];
  enabled: boolean;
  vibrate: boolean;
  note: string;
  onceAt: number;
  nextAt?: number;
  lastAt?: number;
  lastStatus?: 'triggered' | 'played' | 'missed' | 'failed';
}

interface Plans {
  plans: ListeningPlan[];
  exact: boolean;
  registeredAt: number;
}

export const androidListening = Capacitor.getPlatform() === 'android';
export const listeningNative = registerPlugin<{
  list(): Promise<Plans>;
  save(options: { plan: ListeningPlan }): Promise<Plans>;
  remove(options: { id: string }): Promise<Plans>;
  alarmPermission(): Promise<void>;
  calendar(options: { request: boolean }): Promise<{ granted: boolean; names: string[] }>;
  addToCalendar(options: { at: number; title: string }): Promise<void>;
  play(options: { scenes: string[]; kind: ListeningKind; scene: number; line: number }): Promise<void>;
  control(options: { action: 'pause' | 'resume' | 'stop' }): Promise<void>;
  status(): Promise<{ status?: 'playing' | 'paused' | 'complete' | 'error' | 'idle'; identity?: string; kind?: ListeningKind; scene?: number; line?: number }>;
}>('LifeSayListening');
