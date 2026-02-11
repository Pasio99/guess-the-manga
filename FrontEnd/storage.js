// FrontEnd/storage.js
// Stato persistente (localStorage) + Export/Import JSON
// Espone window.GTMStorage

(() => {
  const KEY = "gtm_progress_v1";

  function defaultState() {
    return {
      version: 1,
      levels: {}, // "0","1","2"... -> { solved, solvedAt, attemptsToSolve, played, lastStatus, lastAttempts, lastPlayedAt }
      lastLevelId: 0
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

  // Migrazione dai vecchi key del tuo progetto (resultLog, currentLevel, ecc.)
  function migrateIfNeeded(state) {
    // Se già popolato, non migrare
    const hasSomeLevel = state && state.levels && Object.keys(state.levels).length > 0;
    if (hasSomeLevel) return state;

    const resultLog = safeParse(localStorage.getItem("resultLog") || "[]", []);
    if (Array.isArray(resultLog) && resultLog.length > 0) {
      for (let i = 0; i < resultLog.length; i++) {
        const r = resultLog[i];
        if (!r) continue;

        const id = String(i);
        state.levels[id] ??= {
          solved: false,
          solvedAt: null,
          attemptsToSolve: null,
          played: false,
          lastStatus: null,
          lastAttempts: null,
          lastPlayedAt: null
        };

        // Nel tuo resultLog: status = "Correct" | "Failed"
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

  function load() {
    const raw = localStorage.getItem(KEY);
    let state = raw ? safeParse(raw, defaultState()) : defaultState();
    if (!state || typeof state !== "object") state = defaultState();
    if (!state.levels) state.levels = {};
    if (typeof state.lastLevelId !== "number") state.lastLevelId = 0;

    state = migrateIfNeeded(state);

    // Se abbiamo migrato qualcosa, salviamo subito sotto la nuova chiave
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function getLevel(state, levelId) {
    const id = String(levelId);
    state.levels[id] ??= {
      solved: false,
      solvedAt: null,
      attemptsToSolve: null,
      played: false,
      lastStatus: null,
      lastAttempts: null,
      lastPlayedAt: null
    };
    return state.levels[id];
  }

  function setLastLevelId(levelId) {
    const state = load();
    state.lastLevelId = Number(levelId) || 0;
    save(state);
  }

  function markFinished(levelId, status, attempts) {
    const state = load();
    const lvl = getLevel(state, levelId);

    lvl.played = true;
    lvl.lastStatus = status; // "Correct" | "Failed"
    lvl.lastAttempts = attempts;
    lvl.lastPlayedAt = new Date().toISOString();

    // Se è corretto, "solved" diventa STICKY (non torna più false)
    if (String(status).toLowerCase() === "correct") {
      if (!lvl.solved) {
        lvl.solved = true;
        lvl.solvedAt = new Date().toISOString();
        lvl.attemptsToSolve = attempts;
      } else {
        // già risolto: tieni il migliore (min attempts) se disponibile
        if (typeof lvl.attemptsToSolve === "number") {
          lvl.attemptsToSolve = Math.min(lvl.attemptsToSolve, attempts);
        } else {
          lvl.attemptsToSolve = attempts;
        }
      }
    }

    state.lastLevelId = Number(levelId) || 0;
    save(state);
    return state;
  }

  function isSolved(levelId) {
    const state = load();
    return !!state.levels[String(levelId)]?.solved;
  }

  function resetAll() {
    localStorage.removeItem(KEY);

    // pulizia vecchie chiavi del tuo progetto (così il reset è “totale”)
    localStorage.removeItem("currentLevel");
    localStorage.removeItem("currentPanel");
    localStorage.removeItem("attempts");
    localStorage.removeItem("levelCompleted");
    localStorage.removeItem("maxPanelReached");
    localStorage.removeItem("completedLevels");
    localStorage.removeItem("resultLog");
    localStorage.removeItem("navigateToLevel");
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
    if (!obj || typeof obj !== "object") throw new Error("File JSON non valido.");

    // supporto sia formato con wrapper {key,data} sia raw state
    const maybeState = obj.data ?? obj;

    if (!maybeState || typeof maybeState !== "object") throw new Error("Stato non valido.");
    if (!maybeState.levels || typeof maybeState.levels !== "object") throw new Error("levels mancante o non valido.");
    if (typeof maybeState.version !== "number") maybeState.version = 1;
    if (typeof maybeState.lastLevelId !== "number") maybeState.lastLevelId = 0;

    localStorage.setItem(KEY, JSON.stringify(maybeState));
    return maybeState;
  }

  window.GTMStorage = {
    KEY,
    load,
    save,
    getLevel,
    setLastLevelId,
    markFinished,
    isSolved,
    resetAll,
    exportAsJsonString,
    importFromJsonString
  };
})();
