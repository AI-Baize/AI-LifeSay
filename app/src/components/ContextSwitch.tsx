import { useState } from 'react';
import { findContext } from '../content/contexts';
import type { CourseUnit } from '../domain/courseCatalog';
export function ContextSwitch({unit,value,onChange,onConfirmTransfer,busy=false,legend='在哪里玩'}:{
  unit:CourseUnit;value:string;onChange:(id:string)=>void;
  onConfirmTransfer?: (id:string)=>void;busy?:boolean;legend?:string;
}) {
  const [pending,setPending]=useState<string|null>(null);
  return <fieldset><legend>{legend}</legend>
    {unit.context_ids.map(id=>{const ctx=findContext(id);return ctx.ok?<button key={id} type="button" aria-pressed={value===id} disabled={busy} onClick={()=>ctx.data.is_transfer?setPending(id):onChange(id)}>{ctx.data.title_zh}{value===id?'（当前）':''}</button>:null;})}
    {pending&&<section className="notice" aria-label="换场景确认"><p>换个场景再试，会单独记录这次回应。确认后，点击开始才会建立活动。</p><button type="button" disabled={busy} onClick={()=>{(onConfirmTransfer??onChange)(pending);setPending(null);}}>使用这个场景</button><button type="button" onClick={()=>setPending(null)}>保留原场景</button></section>}
    <p><small>换地方不代表进阶；不同场景的记录分别保留。</small></p>
  </fieldset>;
}
