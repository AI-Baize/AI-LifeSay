import { Capacitor } from '@capacitor/core';
import { webPlatform } from './web';
import { capacitorPlatform } from './capacitor';
export const platform=Capacitor.isNativePlatform()?capacitorPlatform:webPlatform;
