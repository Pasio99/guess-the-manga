import { useMemo, useState } from 'react';
import type { GameResult, Level, LevelProgress } from '../domain/types';
import { MAX_ATTEMPTS_PER_LEVEL, PANELS_PER_LEVEL } from '../domain/types';
import { AttemptDots } from './AttemptDots';
import { ImageModal } from './ImageModal';

type GameScreenProps = {
  level: Level;
  levelIndex: number;
  progress: LevelProgress;
  lastResult: GameResult | null;
  busy: boolean;
  onSubmit: (answer: string) => void;
  onToggleHint: () => void;
  onPanelChange: (panelIndex: number) => void;
  onOpenLevels: () => void;
};

export function GameScreen({
  level,
  levelIndex,
  progress,
  lastResult,
  busy,
  onSubmit,
  onToggleHint,
  onPanelChange,
  onOpenLevels
}: GameScreenProps) {
  const [guess, setGuess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const currentPanel = level.panels[progress.currentPanelIndex];
  const isFinished = progress.status === 'solved' || progress.status === 'failed';
  const canRevealControls = progress.attemptsUsed > 0 || progress.maxPanelUnlocked > 0 || isFinished;
  const canGoPrevious = progress.currentPanelIndex > 0;
  const canGoNext = progress.currentPanelIndex < (isFinished ? PANELS_PER_LEVEL - 1 : progress.maxPanelUnlocked);
  const submitDisabled = busy || isFinished || progress.attemptsUsed >= MAX_ATTEMPTS_PER_LEVEL;

  const statusLabel = useMemo(() => {
    switch (progress.status) {
      case 'solved':
        return 'Solved';
      case 'failed':
        return 'Finished';
      case 'playing':
        return 'Playing';
      default:
        return 'New';
    }
  }, [progress.status]);

  return (
    <main className="page game-page">
      <section className="game-shell glass-card">
        <div className="game-topline">
          <div>
            <p className="eyebrow">Level {levelIndex + 1}</p>
            <h2>{level.title}</h2>
          </div>
          <button className="ghost-button compact" type="button" onClick={onOpenLevels}>
            Change level
          </button>
        </div>

        <div className="status-strip">
          <span className={`status-pill ${progress.status}`}>{statusLabel}</span>
          <AttemptDots used={progress.attemptsUsed} status={progress.status} />
          <span className="panel-counter">Image {progress.currentPanelIndex + 1}/4</span>
        </div>

        <div className="panel-stage">
          <button className="image-button" type="button" onClick={() => setModalOpen(true)} aria-label="Enlarge image">
            <img src={currentPanel.src} alt={`Level ${levelIndex + 1} panel, image ${progress.currentPanelIndex + 1}`} />
          </button>
          {progress.hintVisible ? <div className="hint-overlay">{currentPanel.hint}</div> : null}
        </div>

        <div className="progress-rail" aria-hidden="true">
          <span style={{ inlineSize: `${((progress.currentPanelIndex + 1) / PANELS_PER_LEVEL) * 100}%` }} />
          <i style={{ insetInlineStart: '25%' }} />
          <i style={{ insetInlineStart: '50%' }} />
          <i style={{ insetInlineStart: '75%' }} />
        </div>

        {lastResult ? (
          <p className={`result-message ${lastResult.correct ? 'ok' : 'no'}`} role="status">
            {lastResult.message}
          </p>
        ) : (
          <p className="result-message muted" role="status">
            Every submission counts as an attempt.
          </p>
        )}

        <form
          className="guess-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(guess);
            setGuess('');
          }}
        >
          <input
            value={guess}
            disabled={submitDisabled}
            onChange={(event) => setGuess(event.target.value)}
            placeholder={isFinished ? 'Level finished' : 'Write your answer here'}
            autoComplete="off"
            inputMode="text"
          />
          <button className="primary-button" type="submit" disabled={submitDisabled}>
            Submit
          </button>
        </form>

        <div className="controls-row">
          {canRevealControls ? (
            <>
              <button className="ghost-button" type="button" disabled={!canGoPrevious} onClick={() => onPanelChange(progress.currentPanelIndex - 1)}>
                ← Previous
              </button>
              <button className="ghost-button" type="button" onClick={onToggleHint}>
                {progress.hintVisible ? 'Hide hint' : 'Show hint'}
              </button>
              <button className="ghost-button" type="button" disabled={!canGoNext} onClick={() => onPanelChange(progress.currentPanelIndex + 1)}>
                Next →
              </button>
            </>
          ) : (
            <p className="muted controls-note">After your first attempt, hints will become available.</p>
          )}
        </div>
      </section>

      {modalOpen ? (
        <ImageModal
          src={currentPanel.src}
          alt={`Enlarged panel for level ${levelIndex + 1}`}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </main>
  );
}
