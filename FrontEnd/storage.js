(() => {
  const KEY = "gtm_progress_v4";
  const LEGACY_KEYS = ["gtm_progress_v3", "gtm_progress_v2", "gtm_progress_v1"];

  const MAX_ATTEMPTS = 4;

  function nowIso() { return new Date().toISOString(); }
  function safeParse(raw, fallback = null) { try { return JSON.parse(raw); } catch { return fallback; } }

  function makeLevelState() {
    return {
      status: "not_started",
      attemptsMade: 0,
      maxPanelReached: 0,
      currentPanel: 0,
      hintVisible: false,
      startedAt: null,
      updatedAt: null,
      finishedAt: null,
      durationMs: null,
      attemptsToSolve: null,
      lastStatus: null
    };
  }

  function defaultState() {
    return { version: 4, installId: crypto.randomUUID(), tampered: false, integrity: null, lastLevelId: 0, levels: {} };
  }

  function canonicalize(state) {
    const c = JSON.parse(JSON.stringify(state));
    delete c.integrity;
    return JSON.stringify(c);
  }

  async function computeIntegrity(state) {
    const data = new TextEncoder().encode(canonicalize(state));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function normalizeLevel(lvl) {
    const out = makeLevelState();
    Object.assign(out, lvl || {});
    out.attemptsMade = Math.min(MAX_ATTEMPTS, Math.max(0, Number(out.attemptsMade) || 0));
    out.maxPanelReached = Math.max(0, Number(out.maxPanelReached) || 0);
    out.currentPanel = Math.max(0, Number(out.currentPanel) || 0);
    out.hintVisible = !!out.hintVisible;
    if (!["not_started", "in_progress", "solved", "failed"].includes(out.status)) out.status = "not_started";
    if (!["Correct", "Failed", null].includes(out.lastStatus)) out.lastStatus = null;
    return out;
  }

  function coerce(raw) {
    const st = defaultState();
    if (!raw || typeof raw !== "object") return st;
    st.installId = typeof raw.installId === "string" && raw.installId ? raw.installId : st.installId;
    st.lastLevelId = Math.max(0, Number(raw.lastLevelId) || 0);
    st.tampered = !!raw.tampered;
    if (raw.levels && typeof raw.levels === "object") {
      for (const [k, v] of Object.entries(raw.levels)) st.levels[k] = normalizeLevel(v);
    }
    return st;
  }

  function migrateLegacy() {
    for (const k of LEGACY_KEYS) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const old = safeParse(raw, {});
      const st = defaultState();
      st.lastLevelId = Number(old.lastLevelId) || 0;
      for (const [id, val] of Object.entries(old.levels || {})) {
        const lvl = makeLevelState();
        if (val.playState) {
          lvl.status = "in_progress";
          lvl.attemptsMade = Number(val.playState.attemptsMade) || 0;
          lvl.maxPanelReached = Number(val.playState.maxPanelReached) || 0;
          lvl.currentPanel = Number(val.playState.currentPanel) || 0;
          lvl.hintVisible = !!val.playState.hintVisible;
        } else if (val.solved) {
          lvl.status = "solved"; lvl.lastStatus = "Correct"; lvl.attemptsToSolve = val.attemptsToSolve ?? null;
        } else if (val.played) {
          lvl.status = "failed"; lvl.lastStatus = "Failed";
        }
        lvl.startedAt = val.startedAt ?? null;
        lvl.finishedAt = val.finishedAt ?? null;
        lvl.durationMs = val.durationMs ?? null;
        st.levels[id] = normalizeLevel(lvl);
      }
      return st;
    }
    return defaultState();
  }

  async function load() {
    let st = coerce(safeParse(localStorage.getItem(KEY), null) || migrateLegacy());
    const storedIntegrity = safeParse(localStorage.getItem(KEY), {})?.integrity || null;
    const computed = await computeIntegrity(st);
    if (storedIntegrity && storedIntegrity !== computed) st.tampered = true;
    st.integrity = await computeIntegrity(st);
    localStorage.setItem(KEY, JSON.stringify(st));
    return st;
  }

  async function save(state) {
    const st = coerce(state);
    st.integrity = await computeIntegrity(st);
    localStorage.setItem(KEY, JSON.stringify(st));
    return st;
  }

  async function mutate(fn) { const st = await load(); fn(st); return save(st); }

  async function startLevel(levelId) {
    return mutate(st => {
      const id = String(levelId); st.levels[id] ??= makeLevelState(); const lvl = st.levels[id];
      if (lvl.status === "solved" || lvl.status === "failed") return;
      if (lvl.status === "not_started") lvl.startedAt = nowIso();
      lvl.status = "in_progress"; lvl.updatedAt = nowIso(); st.lastLevelId = Number(levelId) || 0;
    });
  }

  async function savePlayState(levelId, data) {
    return mutate(st => {
      const id = String(levelId); st.levels[id] ??= makeLevelState(); const lvl = st.levels[id];
      if (lvl.status === "solved" || lvl.status === "failed") return;
      lvl.status = "in_progress";
      lvl.attemptsMade = Math.min(MAX_ATTEMPTS, Math.max(0, Number(data.attemptsMade) || lvl.attemptsMade));
      lvl.maxPanelReached = Math.max(lvl.maxPanelReached, Math.max(0, Number(data.maxPanelReached) || 0));
      lvl.currentPanel = Math.max(0, Number(data.currentPanel) || 0);
      lvl.hintVisible = !!data.hintVisible;
      lvl.updatedAt = nowIso(); if (!lvl.startedAt) lvl.startedAt = lvl.updatedAt; st.lastLevelId = Number(levelId) || 0;
    });
  }

  async function finishLevel(levelId, status) {
    return mutate(st => {
      const id = String(levelId); st.levels[id] ??= makeLevelState(); const lvl = st.levels[id];
      const end = nowIso(); if (!lvl.startedAt) lvl.startedAt = end;
      lvl.finishedAt = end; lvl.updatedAt = end;
      lvl.durationMs = Math.max(0, Date.parse(end) - Date.parse(lvl.startedAt));
      if (status === "Correct") { lvl.status = "solved"; lvl.lastStatus = "Correct"; lvl.attemptsToSolve = lvl.attemptsMade; }
      else { lvl.status = "failed"; lvl.lastStatus = "Failed"; }
    });
  }

  async function getLevelState(levelId) { const st = await load(); return normalizeLevel(st.levels[String(levelId)] || makeLevelState()); }
  async function isViewOnly(levelId) { const s = await getLevelState(levelId); return s.status === "solved" || s.status === "failed"; }
  async function canPlayLevel(levelId, totalLevels) { return (await getFirstPlayableLevel(totalLevels)) === Number(levelId) || (await getLevelState(levelId)).status === "in_progress"; }
  async function getFirstPlayableLevel(totalLevels) {
    const st = await load();
    for (let i = 0; i < totalLevels; i++) {
      const lvl = normalizeLevel(st.levels[String(i)] || makeLevelState());
      if (lvl.status === "in_progress") return i;
      if (lvl.status === "not_started") return i;
    }
    return -1;
  }
  async function computeStats(totalLevels) {
    const st = await load();
    let solved = 0, failed = 0, inProgress = 0;
    for (let i = 0; i < totalLevels; i++) { const s = normalizeLevel(st.levels[String(i)] || {}); if (s.status === "solved") solved++; else if (s.status === "failed") failed++; else if (s.status === "in_progress") inProgress++; }
    return { solved, failed, inProgress, totalLevels, tampered: st.tampered };
  }

  window.GTMStorage = { KEY, load, save, startLevel, savePlayState, finishLevel, getLevelState, canPlayLevel, isViewOnly, getFirstPlayableLevel, computeStats, exportAsJsonString: async()=>JSON.stringify(await load(),null,2) };
})();
