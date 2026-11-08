import { readCatalog } from '../content/catalog';
import type { ReadAdapter, Theme } from '../content/types';
export const contentService: ReadAdapter<readonly Theme[]> = { read: async()=>readCatalog() };
