import { useRef } from 'react';
import type { Level, PlayerProgress } from '../domain/types';
import { calculateStats, createEmptyLevelProgress } from '../domain/gameEngine';

type StatsScreenProps = {
  levels: readonly Level[];
  progress: PlayerProgress;
  onBack: () => void;
  onSelectLevel: (levelId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
};

export function StatsScreen({
  levels,
  progress,
  onBack,
  onSelectLevel,
  onExport,
  onImport,
  onReset
}: StatsScreenProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const stats = calculateStats(progress);

  return (
    <main className="page stats-page">
      <section className="stats-hero glass-card">
        <div>
          <p className="eyebrow">Your progress</p>
          <h2>Stats</h2>
          <p className="muted">
            You can enter any level. If a level is in progress, you return exactly where you left off.
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={onBack}>
          Back to game
        </button>
      </section>

      {progress.integrityWarning ? (
        <div className="warning-card" role="alert">
          {progress.integrityWarning}
        </div>
      ) : null}

      <section className="stats-grid" aria-label="Main stats">
        <StatBox label="Completion" value={`${stats.completionPct}%`} />
        <StatBox label="Solved" value={`${stats.solved}/${stats.total}`} />
        <StatBox label="Failed" value={String(stats.failed)} />
        <StatBox label="In progress" value={String(stats.playing)} />
        <StatBox label="Attempts used" value={String(stats.usedAttempts)} />
        <StatBox label="Opening streak" value={String(stats.streak)} />
      </section>

      <section className="glass-card tools-card">
        <div>
          <h3>Saving</h3>
          <p className="muted">
            Export the JSON if you want to move your progress to another device.
          </p>
        </div>
        <div className="toolbar">
          <button className="primary-button" type="button" onClick={onExport}>
            Export JSON
          </button>
          <button className="ghost-button" type="button" onClick={() => inputRef.current?.click()}>
            Import JSON
          </button>
          <button className="danger-button" type="button" onClick={onReset}>
            Reset
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </section>

      <section className="history-list" aria-label="Level list">
        {levels.map((level, index) => {
          const levelProgress = progress.levels[level.id] ?? createEmptyLevelProgress();
          return (
            <button
              key={level.id}
              className={`history-row ${levelProgress.status}`}
              type="button"
              onClick={() => onSelectLevel(level.id)}
            >
              <span className="history-main">
                <strong>Level {index + 1}</strong>
                <small>{labelForStatus(levelProgress.status)}</small>
              </span>
              <span className="history-meta">
                {levelProgress.status === 'playing'
                  ? `Used ${levelProgress.attemptsUsed}/4 · Image ${levelProgress.currentPanelIndex + 1}`
                  : `Attempts ${levelProgress.attemptsUsed}/4`}
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-box glass-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function labelForStatus(status: string) {
  switch (status) {
    case 'solved':
      return 'Solved';
    case 'failed':
      return 'Finished without solving';
    case 'playing':
      return 'In progress';
    default:
      return 'Not started';
  }
}
