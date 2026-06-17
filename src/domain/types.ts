export const MAX_ATTEMPTS_PER_LEVEL = 4 as const;
export const PANELS_PER_LEVEL = 4 as const;

export type LevelStatus = 'not-started' | 'playing' | 'solved' | 'failed';

export type Panel = {
  id: string;
  src: string;
  answer: string;
  acceptedAnswers: string[];
  hint: string;
};

export type Level = {
  id: string;
  title: string;
  shortTitle: string;
  accent?: string;
  panels: readonly [Panel, Panel, Panel, Panel];
};

export type AttemptEvent = {
  id: string;
  at: string;
  levelId: string;
  panelIndex: number;
  submittedAnswer: string;
  normalizedAnswer: string;
  correct: boolean;
  attemptNumber: number;
};

export type LevelProgress = {
  status: LevelStatus;
  currentPanelIndex: number;
  maxPanelUnlocked: number;
  attemptsUsed: number;
  hintVisible: boolean;
  attempts: AttemptEvent[];
  startedAt: string | null;
  finishedAt: string | null;
  solvedAt: string | null;
  durationMs: number | null;
  lastUpdatedAt: string;
};

export type PlayerProgress = {
  version: 1;
  lastLevelId: string;
  levels: Record<string, LevelProgress>;
  integrity: string | null;
  integrityWarning?: string | null;
};

export type GameResult = {
  progress: LevelProgress;
  correct: boolean;
  consumedAttempt: boolean;
  message: string;
};

export type PersistedDocument = {
  exportedAt: string;
  app: 'guess-the-manga-modern';
  progress: PlayerProgress;
};
