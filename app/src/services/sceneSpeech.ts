import { SCENE_AUDIO } from '../content/sceneAudio';
import { playStepAudio } from './audio';
import { speak } from './tts';

/** Prefer the reviewed local line asset when one exists; use fixed local TTS only as fallback. */
export function playSceneLine(text:string){
 const audioPath=SCENE_AUDIO[text];
 return audioPath ? playStepAudio(audioPath,text) : speak(text);
}
