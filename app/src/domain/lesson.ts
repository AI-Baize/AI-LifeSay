import { readCatalog } from '../content/catalog';
import { materialForUnit, type UnitMaterialStep } from '../content/materials';
import { findContext, type ContextDef } from '../content/contexts';
import { findCourseUnit, type CourseUnit } from './courseCatalog';
import { fail, ok, type TargetSelection, type Result, type Theme, type Task } from '../content/types';
export interface ExecutableLesson {
 theme:Theme;task:Task;unit:CourseUnit;context:ContextDef;
 steps:(UnitMaterialStep & {audio:string|null;title_zh:string})[];
}

export function resolveLesson(selection: TargetSelection | null):Result<ExecutableLesson> {
  if (!selection?.course_id || !selection.unit_id || !selection.observation_condition_key)
    return fail('NOT_FOUND', '请先选择一个活动。');
  const catalog=readCatalog(); if(!catalog.ok)return catalog;
  const theme=catalog.data.find(t=>t.id===selection.theme_id);
  const task=theme?.tasks.find(t=>t.id===selection.task_id);
  const unit=findCourseUnit(selection.theme_id,selection.task_id,selection.course_id);
  const context=findContext(selection.observation_condition_key);
  const material=materialForUnit(selection.unit_id);
  if(!theme || !task || theme.version!==selection.content_version || !unit.ok ||
     unit.data.unit_id!==selection.unit_id || !context.ok || !material.ok ||
     !unit.data.context_ids.includes(context.data.context_id))
    return fail('NOT_FOUND','这次课程的内容暂不可用，请重新选择活动。');
  const steps=material.data.steps.map((step,index)=>{
    const source=task.steps[index];
    // Reuse an audio file only when its text matches the selected lesson exactly.
    // Kindergarten circle-time starter/practice/response clips have been reported
    // to speak different words from their captions. Read the displayed text with
    // browser TTS until those recordings are reviewed and remapped.
    const reportedMismatch=context.data.context_id==='KG-hello-family' && index<3;
    const audio=!reportedMismatch && source?.line_en===step.line_en ? source.audio.path : null;
    const instruction=step.phase==='prepare'?context.data.roles_zh+' '+step.instruction_zh:
      step.phase==='observe'?context.data.stimulus.description_zh+'。先等孩子回应，需要时再提供帮助。':step.instruction_zh;
    return {...step,instruction_zh:instruction,audio,title_zh:['准备','一起练习','看看回应','轻松结束'][index] ?? '活动'};
  });
  return ok({theme,task,unit:unit.data,context:context.data,steps});
}
