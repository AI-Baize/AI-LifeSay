import { cancelSpeech, speak, type SpeechStyle } from '../services/tts';
// This coordinator owns all product learning audio. Request cancellation is
// checked again by the player; a resolved cancellation is never page completion.
export function stopProductAudio() { cancelSpeech(); }
export async function say(text: string, style?: SpeechStyle): Promise<boolean> {
  const result = await speak(text, style);
  return result.ok;
}
