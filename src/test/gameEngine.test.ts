import { describe, expect, it } from 'vitest';
import { levels } from '../data/levels';
import { createEmptyLevelProgress, submitAnswer } from '../domain/gameEngine';

const level = levels[0];

describe('game engine', () => {
  it('consuma un tentativo anche con risposta vuota e avanza alla seconda immagine', () => {
    const result = submitAnswer(level, createEmptyLevelProgress(), '');

    expect(result.consumedAttempt).toBe(true);
    expect(result.correct).toBe(false);
    expect(result.progress.attemptsUsed).toBe(1);
    expect(result.progress.currentPanelIndex).toBe(1);
    expect(result.progress.maxPanelUnlocked).toBe(1);
  });

  it('non permette più di quattro tentativi reali', () => {
    let progress = createEmptyLevelProgress();

    for (let i = 0; i < 4; i += 1) {
      progress = submitAnswer(level, progress, `wrong-${i}`).progress;
    }

    const extra = submitAnswer(level, progress, 'Naruto');
    expect(extra.consumedAttempt).toBe(false);
    expect(extra.progress.status).toBe('failed');
    expect(extra.progress.attemptsUsed).toBe(4);
  });

  it('accetta varianti normalizzate della risposta', () => {
    const result = submitAnswer(level, createEmptyLevelProgress(), '  NÀRUTO!! ');

    expect(result.correct).toBe(true);
    expect(result.progress.status).toBe('solved');
    expect(result.progress.attemptsUsed).toBe(1);
  });

  it('sblocca tutte le immagini quando il livello finisce', () => {
    const result = submitAnswer(level, createEmptyLevelProgress(), 'Naruto');
    expect(result.progress.maxPanelUnlocked).toBe(3);
  });
});
