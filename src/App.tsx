import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { LevelMenu } from './components/LevelMenu';
import { StatsScreen } from './components/StatsScreen';
import { GameScreen } from './components/GameScreen';
import { firstLevelId, getLevelById, levels } from './data/levels';
import {
  createEmptyLevelProgress,
  createInitialProgress,
  ensureLevelProgress,
  setCurrentPanel,
  startOrResumeLevel,
  submitAnswerInPlayerProgress,
  toggleHint
} from './domain/gameEngine';
import type { GameResult, PlayerProgress } from './domain/types';
import { createProgressStore } from './persistence/createProgressStore';
import type { ProgressStore } from './persistence/progressStore';

type Screen = 'game' | 'stats';

export function App() {
  const storeRef = useRef<ProgressStore | null>(null);
  const [progress, setProgress] = useState<PlayerProgress>(() => createInitialProgress());
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>('game');
  const [levelMenuOpen, setLevelMenuOpen] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  useEffect(() => {
    let active = true;
    const store = createProgressStore();
    storeRef.current = store;

    store
      .load()
      .then((loaded) => {
        if (!active) return;
        const initialLevel = levels.some((level) => level.id === loaded.lastLevelId) ? loaded.lastLevelId : firstLevelId;
        const hydrated = startOrResumeLevel(loaded, initialLevel);
        setProgress(hydrated);
        return store.save(hydrated);
      })
      .then((saved) => {
        if (active && saved) setProgress(saved);
      })
      .catch((error) => {
        console.error(error);
        if (active) setProgress(createInitialProgress());
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentLevel = useMemo(() => getLevelById(progress.lastLevelId), [progress.lastLevelId]);
  const currentLevelIndex = Math.max(0, levels.findIndex((level) => level.id === currentLevel.id));
  const currentLevelProgress = progress.levels[currentLevel.id] ?? createEmptyLevelProgress();

  const persist = useCallback(async (nextProgress: PlayerProgress) => {
    setBusy(true);
    try {
      const saved = await storeRef.current?.save(nextProgress);
      setProgress(saved ?? nextProgress);
    } finally {
      setBusy(false);
    }
  }, []);

  const selectLevel = useCallback(
    async (levelId: string) => {
      setLastResult(null);
      setLevelMenuOpen(false);
      setScreen('game');
      const next = startOrResumeLevel(progress, levelId);
      await persist(next);
    },
    [persist, progress]
  );

  const submitGuess = useCallback(
    async (answer: string) => {
      if (busy) return;
      const base = ensureLevelProgress(progress, currentLevel.id);
      const { playerProgress, result } = submitAnswerInPlayerProgress(base, currentLevel, answer);
      setLastResult(result);
      await persist(playerProgress);
    },
    [busy, currentLevel, persist, progress]
  );

  const changePanel = useCallback(
    async (panelIndex: number) => {
      setLastResult(null);
      await persist(setCurrentPanel(progress, currentLevel.id, panelIndex));
    },
    [currentLevel.id, persist, progress]
  );

  const handleToggleHint = useCallback(async () => {
    await persist(toggleHint(progress, currentLevel.id));
  }, [currentLevel.id, persist, progress]);

  const exportProgress = useCallback(() => {
    const json = storeRef.current?.exportJson(progress) ?? JSON.stringify(progress, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guess-the-manga-progress-${new Date().toISOString().replaceAll(':', '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [progress]);

  const importProgress = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const imported = await storeRef.current?.importJson(text);
      if (imported) {
        setProgress(imported);
        setScreen('stats');
        setLastResult(null);
      }
    } catch (error) {
      window.alert(`Import fallito: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const resetProgress = useCallback(async () => {
    const ok = window.confirm('Vuoi davvero cancellare tutti i progressi locali?');
    if (!ok) return;
    await storeRef.current?.clear();
    const fresh = startOrResumeLevel(createInitialProgress(), firstLevelId);
    await persist(fresh);
    setLastResult(null);
    setScreen('game');
  }, [persist]);

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Caricamento progressi…</p>
      </div>
    );
  }

  return (
    <>
      <Header onOpenLevels={() => setLevelMenuOpen(true)} onOpenStats={() => setScreen('stats')} />

      {screen === 'stats' ? (
        <StatsScreen
          levels={levels}
          progress={progress}
          onBack={() => setScreen('game')}
          onSelectLevel={selectLevel}
          onExport={exportProgress}
          onImport={importProgress}
          onReset={resetProgress}
        />
      ) : (
        <GameScreen
          level={currentLevel}
          levelIndex={currentLevelIndex}
          progress={currentLevelProgress}
          lastResult={lastResult}
          busy={busy}
          onSubmit={submitGuess}
          onToggleHint={handleToggleHint}
          onPanelChange={changePanel}
          onOpenLevels={() => setLevelMenuOpen(true)}
        />
      )}

      <LevelMenu
        open={levelMenuOpen}
        levels={levels}
        progress={progress}
        activeLevelId={currentLevel.id}
        onSelectLevel={selectLevel}
        onClose={() => setLevelMenuOpen(false)}
      />
    </>
  );
}
