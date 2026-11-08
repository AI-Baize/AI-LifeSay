import { create } from 'zustand';
export type SaveStatus='idle'|'saving'|'saved'|'error';
export const useUiStore=create<{panel:string|null;toast:string|null;save:SaveStatus;setSave:(save:SaveStatus)=>void}>((set)=>({
 panel:null,toast:null,save:'idle',setSave:save=>set({save})
}));
