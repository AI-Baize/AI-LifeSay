import { AudioPhrase } from './AudioPhrase';
import { findContext } from "../content/contexts";
import { materialForUnit } from "../content/materials";
import type { UnitMaterialStep } from "../content/materials";
import type { CourseUnit } from "../domain/courseCatalog";
import { StatusNotice } from "./StatusNotice";

// 情境与玩法素材展示（I-6 / I-7 / E-2 的页面接入）。
//
// 背景：九情境（contexts.ts）与两玩法素材（materials.ts）此前只被 validate.ts
// 做结构校验，**没有任何页面渲染**，导致页面看不到情境与四段素材。
// 本组件把它们显式接入目标确认页。
//
// 约束：
// - 情境与素材已通过内容审校（reviewed / approved_with_issues，见 方案优化1.2/20）；
//   仍保留 draft 分支作防御性标注。遗留问题（权利证据、音频占位）见审校记录。
// - 不显示积分/评分/掌握词数/连胜链。
// - 素材缺失时明示不可用，不凭空承诺。
// - CR-04 / G08-04 / A08-07：观察段答案**不得在观察前直接展示**，
//   否则随后的模仿不能记为独立完成。这里把 observe 段答案改为具名隐藏说明，
//   与素材自身指令（「隐藏答案文字/自动播放」）保持一致。

const PHASE_LABEL: Record<UnitMaterialStep["phase"], string> = {
  prepare: "准备",
  practice: "练习",
  observe: "观察",
  finish: "结束"
};

export function ContextMaterialPreview({
  unit,
  contextId
}: {
  unit: CourseUnit;
  /** 显式指定的情境；缺省时用单元默认情境。只会是单元 context_ids 内的值。 */
  contextId?: string;
}) {
  const wanted =
    contextId && unit.context_ids.includes(contextId) ? contextId : unit.default_context_id;
  const ctx = findContext(wanted);
  const mat = materialForUnit(unit.unit_id);

  return (
    <section className="context-material-preview" aria-label="本次情境与玩法素材">
      <h3>本次观察情境</h3>
      {ctx.ok ? (
        <>
          <p>
            <strong>{ctx.data.title_zh}</strong>（{ctx.data.context_id}
            {ctx.data.is_transfer ? " · 迁移备选" : ""}）
          </p>
          <p>{ctx.data.roles_zh}</p>
          <p>材料：{ctx.data.materials_zh.join("、")}</p>
          <p>刺激：{ctx.data.stimulus.description_zh}</p>
          <p>可接受回应：{ctx.data.stimulus.accepted_responses.join(" / ")}</p>
          {ctx.data.review_status !== "draft" && (
            <p className="notice">
              该情境已通过内容审校（reviewed）。
            </p>
          )}
        </>
      ) : (
        <StatusNotice error message={ctx.error.message} />
      )}

      <h3>本次玩法素材（四段）</h3>
      {mat.ok ? (
        <>
          {mat.data.review_status !== "draft" && (
            <p className="notice">
              玩法素材已通过内容审校（reviewed）。
            </p>
          )}
          <ol className="context-material-steps">
            {mat.data.steps.map(step => (
              <li key={step.phase}>
                <p className="material-instruction"><strong>{PHASE_LABEL[step.phase]}</strong>：{step.instruction_zh}</p>
                <div className="material-step-audio"><AudioPhrase text={step.line_en}/></div>
                {step.phase === "observe" ? (
                  <p className="notice material-observation-note">
                    观察段答案已隐藏（避免观察前泄露）；由家长在观察现场按支持需要提供，
                    并如实记为提示完成，不把随后的模仿记作独立完成。
                  </p>
                ) : step.expected_response_en ? (
                  <p className="material-example">示例回应：{step.expected_response_en}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <StatusNotice error message={mat.error.message} />
      )}
    </section>
  );
}
