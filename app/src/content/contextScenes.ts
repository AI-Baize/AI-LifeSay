import { findScene } from './scenes';
const IDS:Record<string,string>={
 'FG-C01':'scene-family-greetings','FG-C02':'scene-family-visitor','FG-C03':'scene-family-table',
 'CS-C01':'scene-colors-shapes','CS-C02':'scene-colors-shapes','CS-C03':'scene-colors-clothes',
 'AA-C01':'scene-animals-actions','AA-C02':'scene-animals-pets','AA-C03':'scene-animals-pets'
};
export function sceneForContext(contextId:string){const id=IDS[contextId];const result=id?findScene(id):null;return result?.ok?result.data:null;}
