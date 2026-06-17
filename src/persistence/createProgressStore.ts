import { IndexedDbProgressStore } from './indexedDbStore';
import { LocalStorageFallbackStore } from './localStorageFallback';
import type { ProgressStore } from './progressStore';
import type { PlayerProgress } from '../domain/types';

export function createProgressStore(): ProgressStore {
  return new ResilientProgressStore();
}

class ResilientProgressStore implements ProgressStore {
  private primary = new IndexedDbProgressStore();
  private fallback = new LocalStorageFallbackStore();
  private useFallback = !('indexedDB' in window);

  async load(): Promise<PlayerProgress> {
    if (this.useFallback) return this.fallback.load();
    try {
      return await this.primary.load();
    } catch (error) {
      console.warn('IndexedDB non disponibile, uso localStorage fallback.', error);
      this.useFallback = true;
      return this.fallback.load();
    }
  }

  async save(progress: PlayerProgress): Promise<PlayerProgress> {
    if (this.useFallback) return this.fallback.save(progress);
    try {
      return await this.primary.save(progress);
    } catch (error) {
      console.warn('Salvataggio IndexedDB fallito, uso localStorage fallback.', error);
      this.useFallback = true;
      return this.fallback.save(progress);
    }
  }

  async clear(): Promise<void> {
    if (this.useFallback) return this.fallback.clear();
    try {
      return await this.primary.clear();
    } catch (error) {
      console.warn('Reset IndexedDB fallito, uso localStorage fallback.', error);
      this.useFallback = true;
      return this.fallback.clear();
    }
  }

  exportJson(progress: PlayerProgress): string {
    return this.fallback.exportJson(progress);
  }

  async importJson(jsonText: string): Promise<PlayerProgress> {
    if (this.useFallback) return this.fallback.importJson(jsonText);
    try {
      return await this.primary.importJson(jsonText);
    } catch (error) {
      console.warn('Import IndexedDB fallito, uso localStorage fallback.', error);
      this.useFallback = true;
      return this.fallback.importJson(jsonText);
    }
  }
}
