import { createInitialProgress } from '../domain/gameEngine';
import type { PlayerProgress } from '../domain/types';
import {
  exportDocument,
  parseImport,
  parseProgress,
  verifyIntegrity,
  withIntegrity,
  type ProgressStore
} from './progressStore';

const KEY = 'gtm_modern_progress_fallback';

export class LocalStorageFallbackStore implements ProgressStore {
  async load(): Promise<PlayerProgress> {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const initial = await withIntegrity(createInitialProgress());
      localStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }

    try {
      return verifyIntegrity(parseProgress(JSON.parse(raw)));
    } catch {
      return createInitialProgress();
    }
  }

  async save(progress: PlayerProgress): Promise<PlayerProgress> {
    const signed = await withIntegrity(progress);
    localStorage.setItem(KEY, JSON.stringify(signed));
    return signed;
  }

  async clear(): Promise<void> {
    localStorage.setItem(KEY, JSON.stringify(await withIntegrity(createInitialProgress())));
  }

  exportJson(progress: PlayerProgress): string {
    return exportDocument(progress);
  }

  async importJson(jsonText: string): Promise<PlayerProgress> {
    const imported = await withIntegrity(parseImport(jsonText));
    localStorage.setItem(KEY, JSON.stringify(imported));
    return imported;
  }
}
