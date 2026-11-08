import type { CapacitorConfig } from '@capacitor/cli';
// Separate paid identity/storage and payload; this does not implement a native Keystore plugin.
const encrypted = process.env.AIENGLISH_EDITION === 'encrypted';
const free = process.env.AIENGLISH_EDITION === 'free';
const releasePrep = process.env.AIENGLISH_EDITION === 'release-prep';
const releaseAppId = process.env.AI_LIFESAY_APP_ID ?? 'org.aibaize.lifesay';
if (releasePrep && (!releaseAppId || !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(releaseAppId) || /^local\.demo(?:\.|$)/i.test(releaseAppId))) {
  throw new Error('release-prep requires a valid AI_LIFESAY_APP_ID; local.demo is reserved for existing local builds.');
}
const config: CapacitorConfig = { appId: releasePrep ? releaseAppId! : encrypted ? 'local.demo.childrenenglish.paid' : free ? 'local.demo.childrenenglish.free' : 'local.demo.childrenenglish', appName: releasePrep ? 'AI LifeSay' : encrypted ? '亲子英语行动·独立版' : '亲子英语行动', webDir: releasePrep ? 'dist-release-prep-free30' : encrypted ? 'dist-encrypted' : free ? 'dist-free' : 'dist' };
export default config;
