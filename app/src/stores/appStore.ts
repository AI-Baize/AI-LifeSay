import { create } from 'zustand';
import type { ErrorCode, Result, Snapshot } from '../content/types';
import { bootstrap } from '../services/bootstrap';
import { repository } from '../db/repository';
interface AppState { status:'loading'|'ready'|'error'; snapshot:Snapshot|null; error:string|null; errorCode:ErrorCode|null;
 refresh:()=>Promise<void>; boot:()=>Promise<void>; accept:(result:Result<Snapshot>)=>void; }
// 启动只执行一次：StrictMode 双调用或组件重挂载时不重复初始化。
let bootStarted=false;
export const useAppStore=create<AppState>((set,get)=>({
 status:'loading',snapshot:null,error:null,errorCode:null,
 accept(result){if(result.ok)set({status:'ready',snapshot:result.data,error:null,errorCode:null});else set({status:'error',error:result.error.message,errorCode:result.error.code});},
 async refresh(){get().accept(await repository.read());},
 async boot(){if(bootStarted&&get().status!=='error')return;bootStarted=true;get().accept(await bootstrap());}
}));
