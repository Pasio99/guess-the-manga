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

const DB_NAME = 'guess-the-manga-modern';
const DB_VERSION = 1;
const STORE = 'progress';
const KEY = 'player-progress';

export class IndexedDbProgressStore implements ProgressStore {
  async load(): Promise<PlayerProgress> {
    const db = await openDb();
    const raw = await readValue(db, KEY);
    if (!raw) {
      const initial = await withIntegrity(createInitialProgress());
      await writeValue(db, KEY, initial);
      return initial;
    }
    return verifyIntegrity(parseProgress(raw));
  }

  async save(progress: PlayerProgress): Promise<PlayerProgress> {
    const signed = await withIntegrity(progress);
    const db = await openDb();
    await writeValue(db, KEY, signed);
    return signed;
  }

  async clear(): Promise<void> {
    const db = await openDb();
    await writeValue(db, KEY, await withIntegrity(createInitialProgress()));
  }

  exportJson(progress: PlayerProgress): string {
    return exportDocument(progress);
  }

  async importJson(jsonText: string): Promise<PlayerProgress> {
    const imported = await withIntegrity(parseImport(jsonText));
    const db = await openDb();
    await writeValue(db, KEY, imported);
    return imported;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };

    request.onerror = () => reject(request.error ?? new Error('IndexedDB non disponibile.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function readValue(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const request = store.get(key);
    request.onerror = () => reject(request.error ?? new Error('Errore lettura IndexedDB.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function writeValue(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error ?? new Error('Errore scrittura IndexedDB.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Transazione IndexedDB fallita.'));
  });
}
