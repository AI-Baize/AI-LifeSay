import { useState, type ReactNode } from 'react';
import { useAppStore } from '../stores/appStore';
import { useUiStore } from '../stores/uiStore';
import { useLearningStore } from '../stores/learningStore';
import { PageHeader } from '../components/PageHeader';
import { StatusNotice } from '../components/StatusNotice';
import { SaveStateIndicator } from '../components/SaveStateIndicator';
import { ConflictResolutionPanel } from '../components/ConflictResolutionPanel';
import type { Result } from '../content/types';
export function Screen({title,children}:{title:string;children:ReactNode}){
 const error=useAppStore(s=>s.error),save=useUiStore(s=>s.save);
 return <><PageHeader title={title}/>{error&&<StatusNotice message={error} error/>}{children}<SaveStateIndicator status={save==='saved'?'idle':save}/>
 {save==='error'&&<ConflictResolutionPanel onReload={()=>void useAppStore.getState().refresh()} onRetry={()=>void useLearningStore.getState().retry()}/>}</>;
}
export function useAction(){
 const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const run=async<T,>(action:()=>Promise<Result<T>>,success?:(data:T)=>void)=>{
  if(busy)return;setBusy(true);setError(null);
  try{const result=await action();if(result.ok)success?.(result.data);else setError(result.error.message);}
  catch{setError('操作暂时失败，请保留当前内容后重试。');}
  finally{setBusy(false);}
 };
 return {error,busy,run,notice:error?<StatusNotice message={error} error/>:null};
}
