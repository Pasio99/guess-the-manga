import { isCorrectGuess, normalizeAnswer } from './answer';
import {
  MAX_ATTEMPTS_PER_LEVEL,
  PANELS_PER_LEVEL,
  type AttemptEvent,
  type GameResult,
  type Level,
  type LevelProgress,
  type PlayerProgress
} from './types';
import { firstLevelId, levels } from '../data/levels';

const clampPanel = (panelIndex: number) =>
  Math.max(0, Math.min(PANELS_PER_LEVEL - 1, Number.isFinite(panelIndex) ? panelIndex : 0));

const nowIso = () => new Date().toISOString();
const createEventId = () => `${Date.now().toString(36)}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

export function createEmptyLevelProgress(now = nowIso()): LevelProgress {
  return {
    status: 'not-started',
    currentPanelIndex: 0,
    maxPanelUnlocked: 0,
    attemptsUsed: 0,
    hintVisible: false,
    attempts: [],
    startedAt: null,
    finishedAt: null,
    solvedAt: null,
    durationMs: null,
    lastUpdatedAt: now
  };
}

export function createInitialProgress(): PlayerProgress {
  return {
    version: 1,
    lastLevelId: firstLevelId,
    levels: {},
    integrity: null,
    integrityWarning: null
  };
}

export function ensureLevelProgress(progress: PlayerProgress, levelId: string): PlayerProgress {
  if (progress.levels[levelId]) return progress;

  return {
    ...progress,
    levels: {
      ...progress.levels,
      [levelId]: createEmptyLevelProgress()
    }
  };
}

export function startOrResumeLevel(progress: PlayerProgress, levelId: string): PlayerProgress {
  const withLevel = ensureLevelProgress(progress, levelId);
  const previous = withLevel.levels[levelId];

  if (previous.status !== 'not-started') {
    return { ...withLevel, lastLevelId: levelId };
  }

  const now = nowIso();
  return {
    ...withLevel,
    lastLevelId: levelId,
    levels: {
      ...withLevel.levels,
      [levelId]: {
        ...previous,
        status: 'playing',
        startedAt: now,
        lastUpdatedAt: now
      }
    }
  };
}

export function setCurrentPanel(
  progress: PlayerProgress,
  levelId: string,
  requestedPanelIndex: number
): PlayerProgress {
  const withLevel = ensureLevelProgress(progress, levelId);
  const levelProgress = withLevel.levels[levelId];
  const maxAllowed = levelProgress.status === 'playing'
    ? levelProgress.maxPanelUnlocked
    : PANELS_PER_LEVEL - 1;
  const nextPanelIndex = Math.max(0, Math.min(maxAllowed, clampPanel(requestedPanelIndex)));

  return {
    ...withLevel,
    lastLevelId: levelId,
    levels: {
      ...withLevel.levels,
      [levelId]: {
        ...levelProgress,
        currentPanelIndex: nextPanelIndex,
        lastUpdatedAt: nowIso()
      }
    }
  };
}

export function toggleHint(progress: PlayerProgress, levelId: string): PlayerProgress {
  const withLevel = ensureLevelProgress(progress, levelId);
  const previous = withLevel.levels[levelId];
  const canShowHint = previous.attemptsUsed > 0 || previous.maxPanelUnlocked > 0 || previous.status !== 'playing';
  if (!canShowHint) return withLevel;

  return {
    ...withLevel,
    levels: {
      ...withLevel.levels,
      [levelId]: {
        ...previous,
        hintVisible: !previous.hintVisible,
        lastUpdatedAt: nowIso()
      }
    }
  };
}

export function submitAnswer(level: Level, progress: LevelProgress, answer: string): GameResult {
  if (progress.status === 'solved') {
    return {
      progress,
      correct: true,
      consumedAttempt: false,
      message: 'Livello già risolto: puoi rivederlo, ma non consumare altri tentativi.'
    };
  }

  if (progress.status === 'failed') {
    return {
      progress,
      correct: false,
      consumedAttempt: false,
      message: 'Livello già concluso: i 4 tentativi sono stati usati.'
    };
  }

  if (progress.attemptsUsed >= MAX_ATTEMPTS_PER_LEVEL) {
    return {
      progress: finalizeLevel(progress, 'failed', null),
      correct: false,
      consumedAttempt: false,
      message: 'Tentativi terminati.'
    };
  }

  const now = nowIso();
  const attemptNumber = progress.attemptsUsed + 1;
  const correct = isCorrectGuess(level, answer);
  const event: AttemptEvent = {
    id: createEventId(),
    at: now,
    levelId: level.id,
    panelIndex: progress.currentPanelIndex,
    submittedAnswer: answer,
    normalizedAnswer: normalizeAnswer(answer),
    correct,
    attemptNumber
  };

  const attempts = [...progress.attempts, event];
  const base: LevelProgress = {
    ...progress,
    status: 'playing',
    attemptsUsed: attemptNumber,
    attempts,
    startedAt: progress.startedAt ?? now,
    lastUpdatedAt: now
  };

  if (correct) {
    return {
      progress: finalizeLevel(
        {
          ...base,
          maxPanelUnlocked: PANELS_PER_LEVEL - 1
        },
        'solved',
        now
      ),
      correct: true,
      consumedAttempt: true,
      message: `Corretto! Risolto in ${attemptNumber}/4 tentativi.`
    };
  }

  if (attemptNumber >= MAX_ATTEMPTS_PER_LEVEL) {
    return {
      progress: finalizeLevel(
        {
          ...base,
          currentPanelIndex: PANELS_PER_LEVEL - 1,
          maxPanelUnlocked: PANELS_PER_LEVEL - 1
        },
        'failed',
        null
      ),
      correct: false,
      consumedAttempt: true,
      message: 'Risposta sbagliata. I 4 tentativi sono finiti.'
    };
  }

  const nextPanelIndex = Math.min(base.maxPanelUnlocked + 1, PANELS_PER_LEVEL - 1);
  return {
    progress: {
      ...base,
      currentPanelIndex: nextPanelIndex,
      maxPanelUnlocked: Math.max(base.maxPanelUnlocked, nextPanelIndex),
      lastUpdatedAt: now
    },
    correct: false,
    consumedAttempt: true,
    message: `Risposta sbagliata. Tentativo ${attemptNumber}/4 consumato.`
  };
}

function finalizeLevel(
  progress: LevelProgress,
  status: Extract<LevelProgress['status'], 'solved' | 'failed'>,
  solvedAt: string | null
): LevelProgress {
  const now = nowIso();
  const started = progress.startedAt ? Date.parse(progress.startedAt) : Date.parse(now);
  const finished = Date.parse(now);

  return {
    ...progress,
    status,
    maxPanelUnlocked: PANELS_PER_LEVEL - 1,
    finishedAt: now,
    solvedAt,
    durationMs: Number.isNaN(started) || Number.isNaN(finished) ? null : Math.max(0, finished - started),
    lastUpdatedAt: now
  };
}

export function submitAnswerInPlayerProgress(
  playerProgress: PlayerProgress,
  level: Level,
  answer: string
): { playerProgress: PlayerProgress; result: GameResult } {
  const withLevel = startOrResumeLevel(playerProgress, level.id);
  const result = submitAnswer(level, withLevel.levels[level.id], answer);

  return {
    playerProgress: {
      ...withLevel,
      lastLevelId: level.id,
      levels: {
        ...withLevel.levels,
        [level.id]: result.progress
      }
    },
    result
  };
}

export function calculateStats(progress: PlayerProgress) {
  const levelIds = levels.map((level) => level.id);
  const progresses = levelIds.map((id) => progress.levels[id] ?? createEmptyLevelProgress());
  const solved = progresses.filter((levelProgress) => levelProgress.status === 'solved').length;
  const failed = progresses.filter((levelProgress) => levelProgress.status === 'failed').length;
  const playing = progresses.filter((levelProgress) => levelProgress.status === 'playing').length;
  const usedAttempts = progresses.reduce((sum, levelProgress) => sum + levelProgress.attemptsUsed, 0);
  const durations = progresses
    .map((levelProgress) => levelProgress.durationMs)
    .filter((value): value is number => typeof value === 'number');
  const avgDurationMs = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : null;

  let streak = 0;
  for (const levelProgress of progresses) {
    if (levelProgress.status === 'solved') streak += 1;
    else break;
  }

  return {
    total: levelIds.length,
    solved,
    failed,
    playing,
    notStarted: levelIds.length - solved - failed - playing,
    usedAttempts,
    completionPct: levelIds.length ? Math.round((solved / levelIds.length) * 100) : 0,
    avgDurationMs,
    streak
  };
}
