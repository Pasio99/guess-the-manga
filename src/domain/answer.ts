import type { Level } from './types';

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`´]/g, '')
    .match(/[\p{Letter}\p{Number}]+/gu)
    ?.join('') ?? '';
}

export function acceptedAnswersForLevel(level: Level): string[] {
  const all = new Set<string>();
  for (const panel of level.panels) {
    all.add(panel.answer);
    panel.acceptedAnswers.forEach((answer) => all.add(answer));
  }
  return [...all].filter((answer) => normalizeAnswer(answer).length > 0);
}

export function isCorrectGuess(level: Level, guess: string): boolean {
  const normalizedGuess = normalizeAnswer(guess);
  if (!normalizedGuess) return false;

  return acceptedAnswersForLevel(level).some(
    (accepted) => normalizeAnswer(accepted) === normalizedGuess
  );
}
