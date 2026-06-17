import type { PersistedDocument, PlayerProgress } from '../domain/types';
import { createInitialProgress } from '../domain/gameEngine';

export interface ProgressStore {
  load(): Promise<PlayerProgress>;
  save(progress: PlayerProgress): Promise<PlayerProgress>;
  clear(): Promise<void>;
  exportJson(progress: PlayerProgress): string;
  importJson(jsonText: string): Promise<PlayerProgress>;
}

const INTEGRITY_PREFIX = 'gtm-modern-local-integrity-v1';

// Nota anti-cheat: questa firma serve a scoprire alterazioni accidentali o casuali del salvataggio.
// Non è sicurezza crittografica forte, perché in una app 100% client-side anche il codice è nelle mani dell'utente.
export async function signProgress(progress: PlayerProgress): Promise<string> {
  const clean: PlayerProgress = {
    ...progress,
    integrity: null,
    integrityWarning: null
  };
  const input = `${INTEGRITY_PREFIX}:${stableStringify(clean)}`;

  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback non crittografico per contesti legacy: mantiene il rilevamento soft di modifiche,
  // ma non va considerato anti-cheat forte.
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export async function withIntegrity(progress: PlayerProgress): Promise<PlayerProgress> {
  const signed: PlayerProgress = {
    ...progress,
    integrityWarning: null,
    integrity: null
  };
  return {
    ...signed,
    integrity: await signProgress(signed)
  };
}

export async function verifyIntegrity(progress: PlayerProgress): Promise<PlayerProgress> {
  if (!progress.integrity) return progress;
  const expected = await signProgress(progress);
  if (expected === progress.integrity) {
    return { ...progress, integrityWarning: null };
  }
  return {
    ...progress,
    integrityWarning:
      'Il salvataggio locale non coincide con la firma di integrità. Potrebbe essere stato modificato fuori dalla app.'
  };
}

export function parseProgress(raw: unknown): PlayerProgress {
  if (!raw || typeof raw !== 'object') return createInitialProgress();
  const candidate = raw as Partial<PlayerProgress>;

  return {
    version: 1,
    lastLevelId: typeof candidate.lastLevelId === 'string' ? candidate.lastLevelId : createInitialProgress().lastLevelId,
    levels: candidate.levels && typeof candidate.levels === 'object' ? candidate.levels : {},
    integrity: typeof candidate.integrity === 'string' ? candidate.integrity : null,
    integrityWarning: null
  };
}

export function exportDocument(progress: PlayerProgress): string {
  const doc: PersistedDocument = {
    app: 'guess-the-manga-modern',
    exportedAt: new Date().toISOString(),
    progress
  };
  return JSON.stringify(doc, null, 2);
}

export function parseImport(jsonText: string): PlayerProgress {
  const parsed = JSON.parse(jsonText) as unknown;
  if (!parsed || typeof parsed !== 'object') throw new Error('File JSON non valido.');

  const maybeDocument = parsed as Partial<PersistedDocument> & Partial<PlayerProgress>;
  const progress = maybeDocument.progress ?? maybeDocument;
  return parseProgress(progress);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`);
  return `{${entries.join(',')}}`;
}
