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
          <p className="eyebrow">I tuoi progressi</p>
          <h2>Statistiche</h2>
          <p className="muted">
            Puoi entrare in qualunque livello. Se un livello è in corso, rientri esattamente dove avevi lasciato.
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={onBack}>
          Torna al gioco
        </button>
      </section>

      {progress.integrityWarning ? (
        <div className="warning-card" role="alert">
          {progress.integrityWarning}
        </div>
      ) : null}

      <section className="stats-grid" aria-label="Statistiche principali">
        <StatBox label="Completamento" value={`${stats.completionPct}%`} />
        <StatBox label="Risolti" value={`${stats.solved}/${stats.total}`} />
        <StatBox label="Falliti" value={String(stats.failed)} />
        <StatBox label="In corso" value={String(stats.playing)} />
        <StatBox label="Tentativi usati" value={String(stats.usedAttempts)} />
        <StatBox label="Streak iniziale" value={String(stats.streak)} />
      </section>

      <section className="glass-card tools-card">
        <div>
          <h3>Salvataggio</h3>
          <p className="muted">
            La app usa IndexedDB nel browser. Esporta il JSON se vuoi spostare i progressi su un altro dispositivo.
          </p>
        </div>
        <div className="toolbar">
          <button className="primary-button" type="button" onClick={onExport}>
            Esporta JSON
          </button>
          <button className="ghost-button" type="button" onClick={() => inputRef.current?.click()}>
            Importa JSON
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

      <section className="history-list" aria-label="Lista livelli">
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
                <strong>Livello {index + 1}</strong>
                <small>{labelForStatus(levelProgress.status)}</small>
              </span>
              <span className="history-meta">
                {levelProgress.status === 'playing'
                  ? `Usati ${levelProgress.attemptsUsed}/4 · Immagine ${levelProgress.currentPanelIndex + 1}`
                  : `Tentativi ${levelProgress.attemptsUsed}/4`}
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
      return 'Risolto';
    case 'failed':
      return 'Concluso senza soluzione';
    case 'playing':
      return 'In corso';
    default:
      return 'Non iniziato';
  }
}
