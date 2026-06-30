import type { Level, PlayerProgress } from '../domain/types';
import { calculateStats, createEmptyLevelProgress } from '../domain/gameEngine';
import { AttemptDots } from './AttemptDots';

type LevelMenuProps = {
  open: boolean;
  levels: readonly Level[];
  progress: PlayerProgress;
  activeLevelId: string;
  onSelectLevel: (levelId: string) => void;
  onClose: () => void;
};

export function LevelMenu({ open, levels, progress, activeLevelId, onSelectLevel, onClose }: LevelMenuProps) {
  if (!open) return null;

  const stats = calculateStats(progress);

  return (
    <aside className="sheet" role="dialog" aria-modal="true" aria-label="Level menu">
      <button className="sheet-backdrop" type="button" aria-label="Close level menu" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Choose freely</p>
            <h2>Levels</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mini-stats" aria-label="Progress summary">
          <span>{stats.solved}/{stats.total} solved</span>
          <span>{stats.usedAttempts} attempts used</span>
          <span>{stats.completionPct}%</span>
        </div>

        <div className="level-grid">
          {levels.map((level, index) => {
            const levelProgress = progress.levels[level.id] ?? createEmptyLevelProgress();
            const active = level.id === activeLevelId;
            return (
              <button
                className={`level-card ${active ? 'active' : ''} ${levelProgress.status}`}
                type="button"
                key={level.id}
                onClick={() => onSelectLevel(level.id)}
              >
                <span className="level-number">#{index + 1}</span>
                <span className="level-title">{level.shortTitle}</span>
                <span className="level-status">{labelForStatus(levelProgress.status)}</span>
                <AttemptDots used={levelProgress.attemptsUsed} status={levelProgress.status} />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function labelForStatus(status: string) {
  switch (status) {
    case 'solved':
      return 'Solved';
    case 'failed':
      return 'Finished';
    case 'playing':
      return 'In progress';
    default:
      return 'New';
  }
}
