import { AudioPhrase } from './AudioPhrase';
import { readCatalog } from '../content/catalog';
import { materialForUnit } from '../content/materials';
import { useAppStore } from '../stores/appStore';
import { defaultCourseUnit, findCourseUnit } from '../domain/courseCatalog';
import type { Theme, Task } from '../content/types';
import { StatusNotice } from './StatusNotice';

// V1.5-B2 课程讲解独立入口（F08）。
//
// 口径（产品方案/01 §4 F08；§5.1「课程讲解」形态）：
// - 独立讲解入口，展示「目标／怎么做／观察什么」，一句话可读完。
// - **不强制看讲解才可活动**：可直接开始活动，讲解不产生任何能力事实。
// - 观察段答案不在此泄露（与 CR-04 / G08-04 一致）；只给家长观察标准，
//   不给儿童答案明文。
// - 不看讲解、看讲解，都不影响记录与建议；讲解不参与晋级。
// - 不显示积分/评分/掌握词数/连胜链。

const PHASE_LABEL: Record<'prepare' | 'practice' | 'observe' | 'finish', string> = {
  prepare: '准备',
  practice: '练习',
  observe: '观察',
  finish: '结束'
};

function LessonBody({ theme, task }: { theme: Theme; task: Task }) {
  const selection=useAppStore(v=>v.snapshot?.profile?.selection);
  const unit = selection?.theme_id===theme.id&&selection.task_id===task.id&&selection.course_id?findCourseUnit(theme.id,task.id,selection.course_id):defaultCourseUnit(theme.id,task.id);
  const unitOk = unit.ok ? unit.data : null;
  const material=unitOk?materialForUnit(unitOk.unit_id):null;
  const steps=material?.ok?material.data.steps:task.steps;
  const observeStep = steps.find(s => s.phase === 'observe');
  const otherSteps = steps.filter(s => s.phase !== 'observe');

  return (
    <>
      <section className="card" aria-label="目标">
        <h2>目标</h2>
        <p>{task.goal_zh}</p>
        <p className="notice">
          一次只观察一个主要能力；当前玩法：{unitOk ? unitOk.course_id==='dialogue'?'对话课':'词卡课' : '不可用'}。
        </p>
      </section>

      <section className="card" aria-label="怎么做">
        <h2>怎么做</h2>
        <p>准备：{task.materials_zh.join('、')}</p>
        <ol>
          {steps.slice(0, 2).map(step => (
            <li key={step.phase}>
              <strong>{PHASE_LABEL[step.phase]}</strong>：{step.instruction_zh}
              <br />
              <AudioPhrase text={step.line_en}/>
            </li>
          ))}
        </ol>
        <p>支持方式（供家长参考，无需选择）：</p>
        <ul>
          {task.path.map(p => (
            <li key={p.level}>
              {p.title_zh}：{p.support_zh}
            </li>
          ))}
        </ul>
        <p className="notice">停止规则：{task.stop_rule_zh}</p>
      </section>

      <section className="card" aria-label="观察什么">
        <h2>观察什么</h2>
        <p>{task.observation.prompt_zh}</p>
        <ul>
          <li>独立完成：{task.observation.independent_zh}</li>
          <li>提示完成：{task.observation.prompted_zh}</li>
          <li>暂未：{task.observation.not_yet_zh}</li>
        </ul>
        {observeStep ? (
          <p className="notice">
            观察段答案不在讲解里给出（避免观察前泄露）；由家长在观察现场按支持需要提供，
            并如实记为提示完成。
          </p>
        ) : null}
        <p className="notice">未知用「没看清」，不当作失败；不做任何打分或排名。</p>
      </section>

      <p className="notice">
        讲解只是「怎么看」，不是成绩；不看讲解也能直接开始活动，讲解不参与晋级。
      </p>
      <p>其余步骤（{otherSteps.map(s => PHASE_LABEL[s.phase]).join('、')}）在活动中逐步显示。</p>
    </>
  );
}

export function LessonBriefPanel({ themeId, taskId }: { themeId: string; taskId?: string|undefined }) {
  const catalog = readCatalog();
  const theme = catalog.ok ? catalog.data.find(t => t.id === themeId) ?? null : null;
  const task = taskId ? theme?.tasks.find(t=>t.id===taskId)??null : theme?.tasks[0] ?? null;

  if (!catalog.ok) return <StatusNotice error message={catalog.error.message} />;
  if (!theme || !task) return <StatusNotice error message="没有找到这个主题的讲解，不用别的主题冒充。" />;

  return <LessonBody theme={theme} task={task} />;
}
