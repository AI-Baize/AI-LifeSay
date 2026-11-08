const THEME_PICTURES:Record<string,string>={
 'family-greetings':'scenes/observation/family-greetings.svg',
 'colors-shapes':'scenes/observation/colors-shapes.svg',
 'animals-actions':'scenes/observation/animals-actions.svg',
 kindergarten:'topics/kindergarten.svg'
};
const TASK_PICTURES:Record<string,string>={
 'hello-family':'scenes/observation/family-visitor.svg',
 'name-color':'scenes/observation/colors-paper.svg',
 'name-animal':'scenes/observation/animals-pets.svg'
};
export function themePicture(themeId:string){return THEME_PICTURES[themeId]??'topics/kindergarten.svg';}
export function taskPicture(themeId:string,taskId:string){return TASK_PICTURES[taskId]??themePicture(themeId);}
