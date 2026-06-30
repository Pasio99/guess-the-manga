import { describe, expect, it } from 'vitest';
import { levels } from '../data/levels';
import { createEmptyLevelProgress, submitAnswer } from '../domain/gameEngine';

const level = levels[0];

describe('game engine', () => {
  it('consumes an attempt even with an empty answer and advances to the second image', () => {
    const result = submitAnswer(level, createEmptyLevelProgress(), '');

    expect(result.consumedAttempt).toBe(true);
    expect(result.correct).toBe(false);
    expect(result.progress.attemptsUsed).toBe(1);
    expect(result.progress.currentPanelIndex).toBe(1);
    expect(result.progress.maxPanelUnlocked).toBe(1);
  });

  it('does not allow more than four real attempts', () => {
    let progress = createEmptyLevelProgress();

    for (let i = 0; i < 4; i += 1) {
      progress = submitAnswer(level, progress, `wrong-${i}`).progress;
    }

    const extra = submitAnswer(level, progress, 'Naruto');
    expect(extra.consumedAttempt).toBe(false);
    expect(extra.progress.status).toBe('failed');
    expect(extra.progress.attemptsUsed).toBe(4);
  });

  it('accepts normalized answer variants', () => {
    const result = submitAnswer(level, createEmptyLevelProgress(), '  NÀRUTO!! ');

    expect(result.correct).toBe(true);
    expect(result.progress.status).toBe('solved');
    expect(result.progress.attemptsUsed).toBe(1);
  });

  it('unlocks all images when the level ends', () => {
    const result = submitAnswer(level, createEmptyLevelProgress(), 'Naruto');
    expect(result.progress.maxPanelUnlocked).toBe(3);
  });
});
