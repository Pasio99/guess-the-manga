// FrontEnd/storage.js
// Stato persistente (localStorage) + Export/Import JSON
// Espone window.GTMStorage

(() => {
  const KEY = "gtm_progress_v2";

  function defaultState() {
    return {
      version: 3,
      levels: {}, // levelId -> data
      lastLevelId: 0,
      // NOTE: da v3 in poi non blocchiamo più la navigazione con un singolo "inProgress" globale.
      // Manteniamo la chiave per backward-compatibility (import/export), ma il gioco usa
      // uno stato per-livello (lvl.playState).
      inProgress: null
    };
  }

  function safeParse(json, fallback) {
    try {
      const x = JSON.parse(json);
      return x ?? fallback;
    } catch {
      return fallback;
    }
  }

  function makeEmptyLevel() {
    return {
      solved: false,
      solvedAt: null,
      attemptsToSolve: null,

      played: false,
      lastStatus: null,     // "Correct" | "Failed"
      lastAttempts: null,
      lastPlayedAt: null,

      startedAt: null,
      finishedAt: null,
      durationMs: null,

      // Stato "in corso" per anti-cheat (4 tentativi totali per livello, anche se esci/rientri)
      // playState è presente SOLO se il livello è in corso e non finito.
      playState: null // { attemptsMade, maxPanelReached, currentPanel, hintVisible, updatedAt }
    };
  }

  function migrateFromLegacyKeys(state) {
    const hasSomeLevel = state && state.levels && Object.keys(state.levels).length > 0;
    if (hasSomeLevel) return state;

    const resultLog = safeParse(localStorage.getItem("resultLog") || "[]", []);
    if (Array.isArray(resultLog) && resultLog.length > 0) {
      for (let i = 0; i < resultLog.length; i++) {
        const r = resultLog[i];
        if (!r) continue;

        const id = String(i);
        state.levels[id] ??= makeEmptyLevel();

        state.levels[id].played = true;
        state.levels[id].lastStatus = r.status;
        state.levels[id].lastAttempts = r.attempts ?? null;
        state.levels[id].lastPlayedAt = new Date().toISOString();

        if (String(r.status).toLowerCase() === "correct") {
          state.levels[id].solved = true;
          state.levels[id].solvedAt = state.levels[id].solvedAt ?? new Date().toISOString();
          state.levels[id].attemptsToSolve = state.levels[id].attemptsToSolve ?? (r.attempts ?? null);
        }
      }
    }

    const oldLevel = localStorage.getItem("currentLevel");
    if (oldLevel !== null) {
      const n = parseInt(oldLevel, 10);
      if (!Number.isNaN(n)) state.lastLevelId = n;
    }

    return state;
  }

  function migrateFromV1IfPresent() {
    const v1raw = localStorage.getItem("gtm_progress_v1");
    if (!v1raw) return null;

    const v1 = safeParse(v1raw, null);
    if (!v1 || typeof v1 !== "object" || !v1.levels) return null;

    const st = defaultState();
    st.lastLevelId = typeof v1.lastLevelId === "number" ? v1.lastLevelId : 0;

    for (const [k, v] of Object.entries(v1.levels)) {
      st.levels[k] = {
        ...makeEmptyLevel(),
        solved: !!v.solved,
        solvedAt: v.solvedAt ?? null,
        attemptsToSolve: typeof v.attemptsToSolve === "number" ? v.attemptsToSolve : null,
        played: !!v.played,
        lastStatus: v.lastStatus ?? null,
        lastAttempts: typeof v.lastAttempts === "number" ? v.lastAttempts : null,
        lastPlayedAt: v.lastPlayedAt ?? null,

        startedAt: v.startedAt ?? null,
        finishedAt: v.finishedAt ?? null,
        durationMs: typeof v.durationMs === "number" ? v.durationMs : null
      };
    }

    return st;
  }

  function load() {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      let st = safeParse(raw, defaultState());
      if (!st || typeof st !== "object") st = defaultState();
      if (!st.levels) st.levels = {};
      if (typeof st.lastLevelId !== "number") st.lastLevelId = 0;
      if (typeof st.version !== "number") st.version = 3;
      if (!("inProgress" in st)) st.inProgress = null;
      return st;
    }

    const migratedV1 = migrateFromV1IfPresent();
    if (migratedV1) {
      localStorage.setItem(KEY, JSON.stringify(migratedV1));
      return migratedV1;
    }

    let state = defaultState();
    state = migrateFromLegacyKeys(state);
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function getLevel(state, levelId) {
    const id = String(levelId);
    state.levels[id] ??= makeEmptyLevel();
    return state.levels[id];
  }

  function setLastLevelId(levelId) {
    const state = load();
    state.lastLevelId = Number(levelId) || 0;
    save(state);
  }

  function markStarted(levelId) {
    const state = load();
    const lvl = getLevel(state, levelId);

    if (!lvl.startedAt) {
      lvl.startedAt = new Date().toISOString();
    }
    lvl.lastPlayedAt = new Date().toISOString();
    save(state);
    return state;
  }

  function markFinished(levelId, status, attempts) {
    const state = load();
    const lvl = getLevel(state, levelId);

    lvl.played = true;
    lvl.lastStatus = status;
    lvl.lastAttempts = attempts;
    lvl.lastPlayedAt = new Date().toISOString();

    const nowIso = new Date().toISOString();
    lvl.finishedAt = nowIso;

    if (!lvl.startedAt) lvl.startedAt = nowIso;

    const started = Date.parse(lvl.startedAt);
    const finished = Date.parse(lvl.finishedAt);
    if (!Number.isNaN(started) && !Number.isNaN(finished)) {
      lvl.durationMs = Math.max(0, finished - started);
    }

    if (String(status).toLowerCase() === "correct") {
      if (!lvl.solved) {
        lvl.solved = true;
        lvl.solvedAt = nowIso;
        lvl.attemptsToSolve = attempts;
      } else {
        if (typeof lvl.attemptsToSolve === "number") {
          lvl.attemptsToSolve = Math.min(lvl.attemptsToSolve, attempts);
        } else {
          lvl.attemptsToSolve = attempts;
        }
      }
    }

    state.lastLevelId = Number(levelId) || 0;

    // finito -> nessun inProgress
    state.inProgress = null;

    // finito -> pulisci stato per-livello
    lvl.playState = null;

    save(state);
    return state;
  }

  function isSolved(levelId) {
    const state = load();
    return !!state.levels[String(levelId)]?.solved;
  }

  function isPlayed(levelId) {
    const state = load();
    return !!state.levels[String(levelId)]?.played;
  }

  // ---- Per-level play state (anti-cheat) ----
  function setPlayState(levelId, data) {
    const state = load();
    const lvl = getLevel(state, levelId);
    lvl.playState = {
      attemptsMade: Math.max(0, Number(data.attemptsMade) || 0),
      maxPanelReached: Math.max(0, Number(data.maxPanelReached) || 0),
      currentPanel: Math.max(0, Number(data.currentPanel) || 0),
      hintVisible: !!data.hintVisible,
      updatedAt: new Date().toISOString()
    };

    // Manteniamo anche inProgress per retro-compatibilità con vecchie versioni
    // (history.html vecchio) ma non viene più usato come "lock".
    state.inProgress = {
      levelId: Number(levelId),
      attemptsMade: lvl.playState.attemptsMade,
      maxPanelReached: lvl.playState.maxPanelReached,
      currentPanel: lvl.playState.currentPanel,
      hintVisible: lvl.playState.hintVisible
    };

    save(state);
    return state;
  }

  function getPlayState(levelId) {
    const state = load();
    return state.levels[String(levelId)]?.playState || null;
  }

  function clearPlayState(levelId) {
    const state = load();
    const lvl = getLevel(state, levelId);
    lvl.playState = null;

    // se coincide con il vecchio inProgress, puliscilo
    if (state.inProgress && Number(state.inProgress.levelId) === Number(levelId)) {
      state.inProgress = null;
    }

    save(state);
    return state;
  }

  // ---- Backward-compat (vecchie chiamate) ----
  function setInProgress(levelId, data) {
    return setPlayState(levelId, data);
  }

  function getInProgress() {
    // prova prima il playState per il lastLevel (se esiste), altrimenti fallback.
    const state = load();
    if (state?.inProgress && typeof state.inProgress.levelId === "number") {
      return state.inProgress;
    }
    return null;
  }

  function clearInProgress() {
    const state = load();
    state.inProgress = null;
    save(state);
    return state;
  }

  function computeStats(totalLevels) {
    const state = load();
    const N = Math.max(0, Number(totalLevels) || 0);

    let solvedCount = 0;
    let durations = [];

    for (let i = 0; i < N; i++) {
      const lvl = state.levels[String(i)];
      if (lvl?.solved) {
        solvedCount += 1;
        if (typeof lvl.durationMs === "number") durations.push(lvl.durationMs);
      }
    }

    let streak = 0;
    for (let i = 0; i < N; i++) {
      const lvl = state.levels[String(i)];
      if (lvl?.solved) streak += 1;
      else break;
    }

    const completionPct = N > 0 ? (solvedCount / N) * 100 : 0;
    const avgMs = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    return { solvedCount, totalLevels: N, completionPct, streak, avgMs };
  }

  function resetAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem("gtm_progress_v1");

    localStorage.removeItem("currentLevel");
    localStorage.removeItem("currentPanel");
    localStorage.removeItem("attempts");
    localStorage.removeItem("levelCompleted");
    localStorage.removeItem("maxPanelReached");
    localStorage.removeItem("completedLevels");
    localStorage.removeItem("resultLog");
    localStorage.removeItem("navigateToLevel");
    localStorage.removeItem("navigateMode");
    localStorage.removeItem("totalLevels");
  }

  function exportAsJsonString() {
    const state = load();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        key: KEY,
        data: state
      },
      null,
      2
    );
  }

  function importFromJsonString(jsonString) {
    const obj = safeParse(jsonString, null);
    if (!obj || typeof obj !== "object") throw new Error("Invalid JSON file.");

    const maybeState = obj.data ?? obj;
    if (!maybeState || typeof maybeState !== "object") throw new Error("Invalid state.");
    if (!maybeState.levels || typeof maybeState.levels !== "object") throw new Error("Missing levels.");

    if (typeof maybeState.version !== "number") maybeState.version = 3;
    if (typeof maybeState.lastLevelId !== "number") maybeState.lastLevelId = 0;
    if (!("inProgress" in maybeState)) maybeState.inProgress = null;

    localStorage.setItem(KEY, JSON.stringify(maybeState));
    return maybeState;
  }

  window.GTMStorage = {
    KEY,
    load,
    save,
    getLevel,
    setLastLevelId,
    markStarted,
    markFinished,
    isSolved,
    isPlayed,
    setInProgress,
    getInProgress,
    clearInProgress,

    // nuovo API
    setPlayState,
    getPlayState,
    clearPlayState,
    computeStats,
    resetAll,
    exportAsJsonString,
    importFromJsonString
  };
})();
