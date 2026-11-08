import { useState } from 'react';
import type { CourseId,CourseUnitRef } from '../content/types';
import { findCourseUnit } from '../domain/courseCatalog';
export const COURSE_LABELS:Record<CourseId,string>={word_card:'词卡课',dialogue:'对话课'};
export const COURSE_HINTS:Record<CourseId,string>={word_card:'看图说一个词',dialogue:'和玩偶自然接话'};
export function PresentationModeSwitch({themeId,taskId,currentCourse,onSwitchCourse,onViewOnly,busy=false,legend='选一种方式玩'}:{
 themeId:string;taskId:string;currentCourse:CourseId|null;onSwitchCourse:(ref:CourseUnitRef)=>void;onViewOnly?:()=>void;busy?:boolean;legend?:string;
}) {
 const [pending,setPending]=useState<CourseId|null>(null);
 const apply=(course:CourseId)=>{const u=findCourseUnit(themeId,taskId,course);if(u.ok)onSwitchCourse(u.data);setPending(null);};
 return <fieldset><legend>{legend}</legend><div className="row">{(['word_card','dialogue'] as const).map(course=>{
  const available=findCourseUnit(themeId,taskId,course).ok;
  return <button key={course} type="button" aria-pressed={currentCourse===course} disabled={busy||!available||currentCourse===course} onClick={()=>currentCourse&&currentCourse!==course?setPending(course):apply(course)}>{COURSE_LABELS[course]} · {available?COURSE_HINTS[course]:'暂未开放'}{currentCourse===course?'（当前）':''}</button>;
 })}</div>{pending&&<div className="notice" aria-label="切换玩法确认"><p>改用{COURSE_LABELS[pending]}。已有记录不会改变；开始时会建立另一节活动。</p><button type="button" disabled={busy} onClick={()=>apply(pending)}>使用这个玩法</button><button type="button" onClick={()=>setPending(null)}>保留原安排</button></div>}
 {onViewOnly&&<button type="button" onClick={onViewOnly}>只看玩法介绍</button>}</fieldset>;
}
