import { clearProgress } from './playbackStore';
import { clearPlanEval } from './planEvaluationStore';
import { repository } from '../db/repository';
import { fail, ok, type Result, type Snapshot } from '../content/types';
import { newId, newMeta, command } from './command';
export async function exportRecords(): Promise<Result<null>> {
 const result=await repository.read();if(!result.ok)return result;
 try{
  const blob=new Blob([JSON.stringify({format:'local-records-v1',data_mode:'demo',records:result.data.records},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='亲子英语演示记录.json';
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return ok(null);
 }catch{return fail('STORAGE_ERROR','本机导出失败，请重试');}
}
export async function eraseLocalData(): Promise<Result<Snapshot>> {
 const initial=await repository.read();if(!initial.ok)return initial;
 if(!initial.data.meta)return fail<Snapshot>('NOT_FOUND','本机数据尚未初始化');
 let fenced: Result<Snapshot>=initial;
 if(initial.data.meta.maintenance_mode==='normal'){
  fenced=await repository.write(command(initial.data,[],newId(),Date.now(),'erase_begin'));
  if(!fenced.ok)return fenced;
 }
 for(const clear of [clearProgress,clearPlanEval]) { const cleared=clear(); if(!cleared.ok)return cleared; }
 const finish=command(fenced.data,[],newId(),Date.now(),'erase_finish');
 finish.initial_meta=newMeta(newId());
 return repository.write(finish);
}
