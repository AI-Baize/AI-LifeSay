import { useState } from 'react';
import type { ObservationResult, ObservationItem, Outcome, Participation } from '../content/types';
import { ObservationOptionGroup } from '../components/ObservationOptionGroup';
import { ParticipationSelector } from '../components/ParticipationSelector';
export function ResultForm({onSubmit,onDraft,busy=false,initial=null,initialContext=null,observation}:{
  onSubmit:(result:ObservationResult,context:string|null)=>void;
  onDraft?:((result:ObservationResult)=>void)|undefined;busy?:boolean;
  initial?:ObservationResult|null;initialContext?:string|null;observation?:ObservationItem|undefined;
}) {
  const [participation,setParticipation]=useState<Participation|null>(initial?.participation ?? null);
  const [outcome,setOutcome]=useState<Outcome|null>(initial?.outcome ?? null);
  const [outcomeChosen,setOutcomeChosen]=useState(initial!==null);
  const [note,setNote]=useState(initial?.note ?? '');
  const [context,setContext]=useState(initial?.environment ?? initialContext ?? '');
  const [prompt,setPrompt]=useState<NonNullable<ObservationResult['prompt_types']>[number]>(initial?.prompt_types?.[0] ?? 'model_answer');
  const result:ObservationResult={participation,outcome:participation==='engaged'?outcome:null,
    unknown_reason:participation==='refused'?'refused':participation==='stopped'?'stopped':outcome===null||participation===null?'unclear':null,
    prompt_types:outcome==='independent'?[]:outcome==='prompted'?[prompt]:null,
    opportunity_observed:participation==='engaged'&&outcome!==null?true:null,note:note.trim()||null,environment:context||null};
  return <form className="stack" onSubmit={e=>{e.preventDefault();onSubmit(result,context||null);}}>
    {observation&&<section className="notice"><h2>{observation.prompt_zh}</h2><details><summary>怎样区分这次回应</summary><p>{observation.independent_zh}</p><p>{observation.prompted_zh}</p><p>{observation.not_yet_zh}</p></details></section>}
    <ParticipationSelector value={participation} onChange={v=>{setParticipation(v);if(v!=='engaged')setOutcome(null);}}/>
    <ObservationOptionGroup value={outcomeChosen?outcome:undefined} disabled={participation!=='engaged'} onChange={value=>{setOutcome(value);setOutcomeChosen(true);}}/>
    {participation==='engaged'&&outcome==='prompted'&&<label>家长给了哪种帮助<select value={prompt} onChange={e=>setPrompt(e.target.value as typeof prompt)}><option value="model_answer">示范了答案</option><option value="verbal_cue">语言提醒（未说出答案）</option><option value="gesture_cue">手势或指向图片</option><option value="physical_help">动作帮助</option><option value="other">其他帮助</option></select></label>}
    <label>补充：在哪里玩<select value={context} onChange={e=>setContext(e.target.value)}><option value="">暂不填写</option><option value="play">玩耍时</option><option value="daily">日常生活中</option><option value="other">其他地方</option></select></label>
    <label>可选备注（仅本机）<textarea value={note} maxLength={200} onChange={e=>setNote(e.target.value)}/><small>{note.length}/200</small></label>
    <p>没看清就如实记为未知；这次不想玩或提前结束，也可以保存。</p>
    <button className="primary" disabled={busy||participation===null||(participation==='engaged'&&!outcomeChosen)} type="submit">{busy?'正在保存…':'确认保存记录'}</button>
    {onDraft&&<button type="button" disabled={busy} onClick={()=>onDraft(result)}>暂存草稿</button>}
  </form>;
}
