// FrontEnd/storage.js
// Stato persistente (localStorage) + Export/Import JSON
// Espone window.GTMStorage

(() => {
  const KEY = "gtm_progress_v2";

  function defaultState() {
    return {
      version: 2,
      levels: {}, // levelId -> data
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

  // Migrazione da v1 (se presente)
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

        // nuovi campi v2
        startedAt: v.startedAt ?? null,
        finishedAt: v.finishedAt ?? null,
        durationMs: typeof v.durationMs === "number" ? v.durationMs : null
      };
    }

    return st;
  }

  function makeEmptyLevel() {
    return {
      solved: false,
      solvedAt: null,
      attemptsToSolve: null,

      played: false,
      lastStatus: null,     // "Correct" | "Failed"
      lastAttempts: null,   // attempts in last run
      lastPlayedAt: null,   // last opened/played timestamp

      // v2 stats
      startedAt: null,      // when started first time (play)
      finishedAt: null,     // when finished (Correct/Failed)
      durationMs: null      // finishedAt - startedAt (ms)
    };
  }

  function load() {
    // Se esiste già v2
    const raw = localStorage.getItem(KEY);
    if (raw) {
      let st = safeParse(raw, defaultState());
      if (!st || typeof st !== "object") st = defaultState();
      if (!st.levels) st.levels = {};
      if (typeof st.lastLevelId !== "number") st.lastLevelId = 0;
      if (typeof st.version !== "number") st.version = 2;
      return st;
    }

    // Se c'è v1, migra e salva in v2
    const migratedV1 = migrateFromV1IfPresent();
    if (migratedV1) {
      localStorage.setItem(KEY, JSON.stringify(migratedV1));
      return migratedV1;
    }

    // Altrimenti crea nuovo stato e prova migrazione dai legacy keys
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

  // chiamata quando inizi a giocare un livello (solo in play mode)
  function markStarted(levelId) {
    const state = load();
    const lvl = getLevel(state, levelId);

    // non sovrascrivere se già iniziato
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

    // finishedAt/durationMs
    const nowIso = new Date().toISOString();
    lvl.finishedAt = nowIso;

    // se manca startedAt (es: vecchia migrazione), impostalo ora per avere duration
    if (!lvl.startedAt) lvl.startedAt = nowIso;

    const started = Date.parse(lvl.startedAt);
    const finished = Date.parse(lvl.finishedAt);
    if (!Number.isNaN(started) && !Number.isNaN(finished)) {
      lvl.durationMs = Math.max(0, finished - started);
    }

    // Solved sticky
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

    // streak = quanti livelli risolti di fila dal livello 1 in poi
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

    // pulizia vecchie chiavi legacy
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
    if (!obj || typeof obj !== "object") throw new Error("File JSON non valido.");

    const maybeState = obj.data ?? obj;
    if (!maybeState || typeof maybeState !== "object") throw new Error("Stato non valido.");
    if (!maybeState.levels || typeof maybeState.levels !== "object") throw new Error("levels mancante o non valido.");

    if (typeof maybeState.version !== "number") maybeState.version = 2;
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
    markStarted,
    markFinished,
    isSolved,
    isPlayed,
    computeStats,
    resetAll,
    exportAsJsonString,
    importFromJsonString
  };
})();
