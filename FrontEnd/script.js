const levels = [
  {
    panels: [
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/image1.png", answer: "Naruto", answers: ["Naruto", "ナルト"], hint: "No hint" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/image2Naruto.png", answer: "Naruto", answers: ["Naruto", "ナルト"], hint: "Target: Shonen" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/Naruto3.png", answer: "Naruto", answers: ["Naruto", "ナルト"], hint: "Ended, N° of Tome: 72, Chapters: 700" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/Naruto5.png", answer: "Naruto", answers: ["Naruto", "ナルト"], hint: "I'm gonna become Hokage!" }
    ]
  },
  {
    panels: [
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op1.png", answer: "One Piece", answers: ["One Piece", "OnePiece", "ワンピース"], hint: "No hint" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op2.png", answer: "One Piece", answers: ["One Piece", "OnePiece", "ワンピース"], hint: "Target: Shonen" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op3.png", answer: "One Piece", answers: ["One Piece", "OnePiece", "ワンピース"], hint: "Not Ended, N° of Tome: 110, Chapters: 1132" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op4.png", answer: "One Piece", answers: ["One Piece", "OnePiece", "ワンピース"], hint: "I'm Luffy! The Man Who Will Become the Pirate King!" }
    ]
  },
  {
    panels: [
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op1.png", answer: "The bugle call", answers: ["The bugle call", "Bugle Call"], hint: "No hint" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op2.png", answer: "The bugle call", answers: ["The bugle call", "Bugle Call"], hint: "Target: Shonen" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op3.png", answer: "The bugle call", answers: ["The bugle call", "Bugle Call"], hint: "Not Ended, N° of Tome: 110, Chapters: 1132" },
      { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op4.png", answer: "prova", answers: ["prova"], hint: "I'm Luffy! The Man Who Will Become the Pirate King!" }
    ]
  }
];

let currentLevelId = 0;
let currentPanel = 0;
let attemptsMade = 0;
const maxAttempts = 4;

let hintVisible = false;
let maxPanelReached = 0;
let levelFinished = false;

let gameMode = "play"; // play | view

// Evita di sovrascrivere lo stato salvato al primo caricamento pagina:
// setLevel() salva il livello "precedente" tramite persistPlayState().
// Quando si entra da history, però, non esiste un precedente in questa sessione.
// Senza questo flag, il playState verrebbe azzerato (attempts=0, panel=0).
let hasInitializedSession = false;

function clampLevel(id) {
  if (id < 0) return 0;
  if (id >= levels.length) return levels.length - 1;
  return id;
}

function resolveInitialLevelId() {
  const nav = localStorage.getItem("navigateToLevel");
  if (nav !== null) {
    localStorage.removeItem("navigateToLevel");
    const n = parseInt(nav, 10);
    return clampLevel(Number.isNaN(n) ? 0 : n);
  }

  const st = window.GTMStorage?.load?.();
  const last = st?.lastLevelId ?? 0;
  return clampLevel(last);
}

function resolveInitialMode() {
  const m = localStorage.getItem("navigateMode");
  if (m !== null) localStorage.removeItem("navigateMode");
  return (m === "view" || m === "play") ? m : "play";
}

function isLevelLockedToView(levelId) {
  return window.GTMStorage?.isPlayed?.(levelId) ?? false;
}

function normalizeAnswer(s) {
  if (!s) return "";
  return String(s)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getAcceptedAnswersForLevel(levelId) {
  const panel = levels[levelId].panels[0];
  const list = [];
  if (panel.answers && Array.isArray(panel.answers)) list.push(...panel.answers);
  if (panel.answer) list.push(panel.answer);

  const seen = new Set();
  const out = [];
  for (const a of list) {
    const n = normalizeAnswer(a);
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(a);
  }
  return out;
}

function isCorrectGuess(levelId, userGuess) {
  const g = normalizeAnswer(userGuess);
  if (!g) return false;
  const accepted = getAcceptedAnswersForLevel(levelId);
  return accepted.some(a => normalizeAnswer(a) === g);
}

function persistPlayState() {
  if (gameMode !== "play") return;
  if (levelFinished) return;
  window.GTMStorage?.setPlayState?.(currentLevelId, {
    attemptsMade,
    maxPanelReached,
    currentPanel,
    hintVisible
  });
}

function clearPlayState() {
  window.GTMStorage?.clearPlayState?.(currentLevelId);
}

function updateHistoryLockUI() {
  const a = document.getElementById("history-link");
  if (!a) return;

  // Ora la history è SEMPRE cliccabile (anti-cheat gestito via playState per-livello).
  a.classList.remove("disabled");
  a.removeAttribute("aria-disabled");
}

function wireHistoryLinkGuard() {
  const a = document.getElementById("history-link");
  if (!a) return;

  a.addEventListener("click", (e) => {
    // prima di uscire, salva lo stato corrente del livello in corso
    persistPlayState();
    // lascia che il link faccia navigazione normale
  });
}

function goNextOrHistory() {
  if (currentLevelId < levels.length - 1) {
    setLevel(currentLevelId + 1);
  } else {
    navigateToStatistics();
  }
}

function setLevel(levelId) {
  // salva lo stato del livello corrente prima di cambiare,
  // ma NON al primissimo caricamento pagina
  if (hasInitializedSession) persistPlayState();

  currentLevelId = clampLevel(levelId);

  gameMode = resolveInitialMode();
  if (isLevelLockedToView(currentLevelId)) gameMode = "view";

  currentPanel = 0;
  attemptsMade = 0;
  hintVisible = false;
  maxPanelReached = 0;
  levelFinished = false;

  const ps = window.GTMStorage?.getPlayState?.(currentLevelId);
  if (gameMode === "play" && ps) {
    attemptsMade = ps.attemptsMade || 0;
    maxPanelReached = ps.maxPanelReached || 0;
    currentPanel = ps.currentPanel || 0;
    hintVisible = !!ps.hintVisible;
  } else if (gameMode === "play") {
    window.GTMStorage?.markStarted?.(currentLevelId);
    persistPlayState();
  }

  if (gameMode === "view") {
    levelFinished = true;
    maxPanelReached = levels[currentLevelId].panels.length - 1;
  }

  window.GTMStorage?.setLastLevelId?.(currentLevelId);
  loadPanel();

  // da qui in poi la sessione è inizializzata
  hasInitializedSession = true;
}

function loadPanel() {
  const panelImage = document.getElementById("manga-panel");
  const hintOverlay = document.getElementById("hint-overlay");
  const levelIndicator = document.getElementById("level-indicator");
  const current = levels[currentLevelId].panels[currentPanel];

  panelImage.src = current.src;
  levelIndicator.textContent = `Manga #${currentLevelId + 1}`;

  if (hintVisible) {
    hintOverlay.textContent = current.hint;
    hintOverlay.classList.remove("hidden");
  } else {
    hintOverlay.textContent = "";
    hintOverlay.classList.add("hidden");
  }

  updateProgressBar(currentPanel + 1, levels[currentLevelId].panels.length);
  updateButtonVisibility();
  updateHistoryLockUI();
}

function updateProgressBar(currentImageIndex, totalImages) {
  const progressBar = document.getElementById("progress-bar");
  const progressPercentage = (currentImageIndex / totalImages) * 100;
  progressBar.style.width = progressPercentage + "%";
}

function finishLevel(status) {
  levelFinished = true;
  clearPlayState();

  window.GTMStorage?.markFinished?.(currentLevelId, status, attemptsMade);

  maxPanelReached = levels[currentLevelId].panels.length - 1;
  currentPanel = Math.min(currentPanel, maxPanelReached);

  updateButtonVisibility();
  updateHistoryLockUI();
}

function checkAnswer() {
  if (gameMode === "view") return;
  if (levelFinished) return;

  const input = document.getElementById("user-guess");
  const userGuess = input.value.trim();
  const result = document.getElementById("result");

  attemptsMade += 1;

  if (isCorrectGuess(currentLevelId, userGuess)) {
    result.textContent = "Correct!";
    result.style.color = "green";

    finishLevel("Correct");

    setTimeout(() => {
      result.textContent = "";
      input.value = "";
      goNextOrHistory();
    }, 900);
    return;
  }

  if (attemptsMade < maxAttempts) {
    result.textContent = "Wrong answer! Try again.";
    result.style.color = "red";

    const next = Math.min(maxPanelReached + 1, levels[currentLevelId].panels.length - 1);
    currentPanel = next;
    if (currentPanel > maxPanelReached) maxPanelReached = currentPanel;

    persistPlayState();
    loadPanel();

    setTimeout(() => { result.textContent = ""; }, 900);
  } else {
    result.textContent = "Out of attempts! Level failed.";
    result.style.color = "red";

    finishLevel("Failed");

    setTimeout(() => {
      result.textContent = "";
      input.value = "";
      goNextOrHistory();
    }, 900);
  }
}

function showHint() {
  const hintOverlay = document.getElementById("hint-overlay");
  hintVisible = !hintVisible;

  if (!hintVisible) {
    hintOverlay.textContent = "";
    hintOverlay.classList.add("hidden");
  } else {
    const current = levels[currentLevelId].panels[currentPanel];
    hintOverlay.textContent = current.hint;
    hintOverlay.classList.remove("hidden");
  }

  persistPlayState();
  updateButtonVisibility();
}

function previousPanel() {
  if (currentPanel > 0) {
    currentPanel--;
    persistPlayState();
    loadPanel();
  }
}

function nextPanel() {
  const limit = levelFinished ? (levels[currentLevelId].panels.length - 1) : maxPanelReached;
  if (currentPanel < limit) {
    currentPanel++;
    persistPlayState();
    loadPanel();
  }
}

function updateButtonVisibility() {
  const prevBtn = document.getElementById("previous-button");
  const nextBtn = document.getElementById("next-button");
  const submitBtn = document.getElementById("submit-button");
  const hintBtn = document.getElementById("hint-button");
  const input = document.getElementById("user-guess");

  const canNavigate = attemptsMade > 0 || hintVisible || levelFinished || maxPanelReached > 0;

  if (canNavigate) {
    prevBtn.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
    hintBtn.classList.remove("hidden");
  } else {
    prevBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
    hintBtn.classList.add("hidden");
  }

  if (!hintBtn.classList.contains("hidden")) {
    hintBtn.textContent = hintVisible ? "Hide Hint" : "Show Hint";
  }

  if (gameMode === "view") {
    submitBtn.classList.add("hidden");
    if (input) {
      input.disabled = true;
      input.placeholder = "View only";
      input.value = "";
    }
  } else {
    if (input) {
      input.disabled = false;
      input.placeholder = "Enter your guess here...";
    }
    if (levelFinished) submitBtn.classList.add("hidden");
    else submitBtn.classList.remove("hidden");
  }
}

function navigateToStatistics() {
  // history sempre cliccabile: anti-cheat via playState per-livello
  persistPlayState();
  localStorage.setItem("totalLevels", levels.length);
  window.location.href = "FrontEnd/history.html";
}

function wireEnterToSubmit() {
  const input = document.getElementById("user-guess");
  if (!input) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkAnswer();
    }
  });
}

function wireImageModal() {
  const img = document.getElementById("manga-panel");
  const modal = document.getElementById("img-modal");
  const modalImg = document.getElementById("img-modal-img");
  const closeBtn = document.getElementById("img-modal-close");
  const backdrop = document.getElementById("img-modal-backdrop");

  if (!img || !modal || !modalImg || !closeBtn || !backdrop) return;

  function open() {
    // usa lo stesso src già caricato
    modalImg.src = img.src;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function close() {
    modal.classList.add("hidden");
    modalImg.src = "";
    document.body.style.overflow = "";
  }

  img.style.cursor = "zoom-in";
  img.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
  });
}

localStorage.setItem("totalLevels", levels.length);

window.addEventListener("DOMContentLoaded", () => {
  wireEnterToSubmit();
  wireHistoryLinkGuard();
  wireImageModal();

  currentLevelId = resolveInitialLevelId();
  setLevel(currentLevelId);
});

