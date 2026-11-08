import { fail, ok } from '../content/types';
import { readVoices, speak, cancelSpeech } from '../services/tts';
export const webPlatform = {
 storage: { async read(){ try {return ok(await navigator.storage?.persisted() ?? false);}catch{return fail('UNSUPPORTED','无法读取持久化状态');}},
 async request(){try{return ok(await navigator.storage?.persist() ?? false);}catch{return fail('UNSUPPORTED','无法申请持久化存储');}} },
 tts: { read:readVoices,play:speak,cancel:cancelSpeech },
 share: { async read(){return fail<null>('UNSUPPORTED','V1仅提供本机记录导出');} },
 filePicker: { async read(){return fail<null>('UNSUPPORTED','V1不读取私有资源正文；权利不清只建卡');} }
};
export type Platform=typeof webPlatform;
