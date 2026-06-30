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

// Anti-cheat note: this signature detects accidental or casual save tampering.
// It is not strong cryptographic security, because in a 100% client-side app the code is also in the user's hands.
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

  // Non-cryptographic fallback for legacy contexts: keeps soft tamper detection,
  // but it must not be considered strong anti-cheat.
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
      'The local save does not match the integrity signature. It may have been changed outside the app.'
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
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON file.');

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
