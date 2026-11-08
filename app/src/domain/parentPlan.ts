import type { Profile, Settings, ActivitySession } from '../content/types';
export const WEEKLY_GOAL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export function weeklyGoalExpiresAt(week:string,savedAt?:number):number {
 const fallback=new Date(week+'T12:00:00').getTime();
 return (savedAt??fallback)+WEEKLY_GOAL_RETENTION_MS;
}
export function retainedWeeklyGoals(profile:Pick<Profile,'weekly_goals'|'weekly_goal_saved_at'>|null|undefined,now=Date.now()):Record<string,string> {
 return Object.fromEntries(Object.entries(profile?.weekly_goals??{}).filter(([week])=>now<weeklyGoalExpiresAt(week,profile?.weekly_goal_saved_at?.[week])));
}
export function localDate(now:number):string {const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function localWeek(now:number):string {const d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7));return localDate(d.getTime());}
export const validTime=(value:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function eveningReady(settings:Settings|null|undefined,now:number):boolean {
 if(settings?.daily_record_enabled===false)return false;
 const value=settings?.daily_record_time??'20:00';if(!validTime(value))return false;
 const [h,m]=value.split(':').map(Number);const d=new Date(now);
 return d.getHours()*60+d.getMinutes()>=(h??20)*60+(m??0);
}
export function pendingRecords(sessions:ActivitySession[],now:number):ActivitySession[]{return sessions.filter(s=>s.deleted_at===null&&['awaiting_record','pending_record'].includes(s.status)&&s.ended_at!==null&&s.ended_at<=now).sort((a,b)=>(a.ended_at??0)-(b.ended_at??0));}
