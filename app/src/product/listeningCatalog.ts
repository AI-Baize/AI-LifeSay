import catalog from './listeningCatalog.json';

export interface ListeningProgram {
  id: string;
  title: string;
  source_scene: string;
  source: string;
  manifest: string;
  cover: string | null;
  review_status: string;
  audio_review: string;
  rights_review: string;
}

export interface ListeningUnavailable {
  id: string;
  title: string;
  source_scene: string;
  source: string;
  reason: string;
}

export const listeningPrograms = catalog.programs as ListeningProgram[];
export const listeningUnavailable = catalog.unavailable as ListeningUnavailable[];

