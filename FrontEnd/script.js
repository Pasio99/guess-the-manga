const levels = [
    {
        panels: [
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/image1.png", answer: "Naruto", hint: "No hint" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/image2Naruto.png", answer: "Naruto", hint: "Target: Shonen" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/Naruto3.png", answer: "Naruto", hint: "Ended, N° of Tome: 72, Chapters: 700" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/Naruto/Naruto5.png", answer: "Naruto", hint: "I'm gonna become Hokage!" }
        ]
    },
    {
        panels: [
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op1.png", answer: "One Piece", hint: "No hint" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op2.png", answer: "One Piece", hint: "Target: Shonen" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op3.png", answer: "One Piece", hint: "Not Ended, N° of Tome: 110, Chapters: 1132" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op4.png", answer: "One Piece", hint: "I'm Luffy! The Man Who Will Become the Pirate King!" }
        ]
    },
    {
        panels: [
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op1.png", answer: "The bugle call", hint: "No hint" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op2.png", answer: "The bugle call", hint: "Target: Shonen" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op3.png", answer: "The bugle call", hint: "Not Ended, N° of Tome: 110, Chapters: 1132" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op4.png", answer: "prova", hint: "I'm Luffy! The Man Who Will Become the Pirate King!" }
        ]
    }
];

let currentLevelId = 0;     // 0-based
let currentPanel = 0;       // 0..3
let attemptsMade = 0;       // numero di submit fatti su questo livello
const maxAttempts = 4;

let hintVisible = false;
let maxPanelReached = 0;    // quante immagini hai “sbloccato” via tentativi
let levelFinished = false;  // finito (correct o failed)

// nuovo: modalità partita
// play = gameplay normale
// view = solo visione (usata per livelli Failed: non si possono trasformare in Solved)
let gameMode = "play";

function clampLevel(id) {
    if (id < 0) return 0;
    if (id >= levels.length) return levels.length - 1;
    return id;
}

// Carica livello da:
// 1) navigateToLevel in localStorage (history.html)
// 2) querystring ?level= (opzionale)
// 3) stato salvato GTMStorage.lastLevelId
function resolveInitialLevelId() {
    const nav = localStorage.getItem("navigateToLevel");
    if (nav !== null) {
        localStorage.removeItem("navigateToLevel");
        const n = parseInt(nav, 10);
        return clampLevel(Number.isNaN(n) ? 0 : n);
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get("level");
    if (q !== null) {
        const n = parseInt(q, 10);
        // accettiamo sia 0-based sia 1-based: se utente passa 1, interpretiamo come level 1 (1-based)
        if (!Number.isNaN(n)) {
            if (n >= 1 && n <= levels.length) return clampLevel(n - 1);
            return clampLevel(n);
        }
    }

    const st = window.GTMStorage?.load?.();
    const last = st?.lastLevelId ?? 0;
    return clampLevel(last);
}

// Legge la modalità passata da history.html (navigateMode = play/view)
function resolveInitialMode() {
    const m = localStorage.getItem("navigateMode");
    if (m !== null) localStorage.removeItem("navigateMode");
    return (m === "view" || m === "play") ? m : "play";
}

function isLevelLockedToView(levelId) {
    const state = window.GTMStorage?.load?.();
    const lvl = state?.levels?.[String(levelId)];
    // locked = qualsiasi livello già giocato (Failed o Solved)
    return !!(lvl && lvl.played);
}

function setLevel(levelId) {
    currentLevelId = clampLevel(levelId);
    currentPanel = 0;
    attemptsMade = 0;
    hintVisible = false;
    maxPanelReached = 0;
    levelFinished = false;

    // Modalità richiesta (di default play)
    gameMode = resolveInitialMode();

    // Regola definitiva: se un livello è già stato giocato (Solved o Failed), è sempre view-only
    if (isLevelLockedToView(currentLevelId)) {
        gameMode = "view";
    }

    // In view: sblocca tutte le immagini e blocca il submit
    if (gameMode === "view") {
        levelFinished = true; // così submit sparisce e non conteggiamo tentativi
        maxPanelReached = levels[currentLevelId].panels.length - 1;
    }

    window.GTMStorage?.setLastLevelId?.(currentLevelId);
    loadPanel();
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
}

function updateProgressBar(currentImageIndex, totalImages) {
    const progressBar = document.getElementById("progress-bar");
    const progressPercentage = (currentImageIndex / totalImages) * 100;
    progressBar.style.width = progressPercentage + "%";
}

function finishLevel(status) {
    // status: "Correct" | "Failed"
    levelFinished = true;

    // salva in progress persistente (sticky solved)
    window.GTMStorage?.markFinished?.(currentLevelId, status, attemptsMade);

    // UX: se corretto o fallito, mostra tutto il livello sbloccato
    maxPanelReached = levels[currentLevelId].panels.length - 1;
    currentPanel = Math.min(currentPanel, maxPanelReached);

    updateButtonVisibility();
}

function checkAnswer() {
    // view-only: niente submit
    if (gameMode === "view") return;

    if (levelFinished) return;

    const input = document.getElementById("user-guess");
    const userGuess = input.value.trim();
    const result = document.getElementById("result");
    const current = levels[currentLevelId].panels[currentPanel];

    // conta un tentativo per ogni Submit
    attemptsMade += 1;

    if (userGuess.toLowerCase() === current.answer.toLowerCase()) {
        result.textContent = "Correct!";
        result.style.color = "green";

        finishLevel("Correct");

        setTimeout(() => {
            result.textContent = "";
            input.value = "";
            loadPanel();
        }, 1200);

        return;
    }

    // sbagliato
    if (attemptsMade < maxAttempts) {
        result.textContent = "Wrong answer! Try again.";
        result.style.color = "red";

        // sblocca immagine successiva (fino a max 3)
        const next = Math.min(maxPanelReached + 1, levels[currentLevelId].panels.length - 1);
        currentPanel = next;
        if (currentPanel > maxPanelReached) maxPanelReached = currentPanel;

        loadPanel();

        setTimeout(() => {
            result.textContent = "";
            if (attemptsMade === maxAttempts - 1) {
                result.textContent = "Last guess!";
                result.style.color = "orange";
            }
        }, 1200);
    } else {
        result.textContent = "Out of attempts! Level failed.";
        result.style.color = "red";

        finishLevel("Failed");

        setTimeout(() => {
            result.textContent = "";
            input.value = "";
            loadPanel();
        }, 1200);
    }
}

function showHint() {
    const hintOverlay = document.getElementById("hint-overlay");
    const current = levels[currentLevelId].panels[currentPanel];
    hintOverlay.textContent = current.hint;
    hintOverlay.classList.remove("hidden");
    hintVisible = true;
}

function previousPanel() {
    if (currentPanel > 0) {
        currentPanel--;
        loadPanel();
    }
}

function nextPanel() {
    // puoi andare avanti solo fino a quello che hai sbloccato,
    // oppure fino alla fine se il livello è finito (o in view-only)
    const limit = levelFinished ? (levels[currentLevelId].panels.length - 1) : maxPanelReached;
    if (currentPanel < limit) {
        currentPanel++;
        loadPanel();
    }
}

function resetGame() {
    // reset completo (incl. export/import state)
    window.GTMStorage?.resetAll?.();

    // reset runtime
    currentLevelId = 0;
    currentPanel = 0;
    attemptsMade = 0;
    hintVisible = false;
    maxPanelReached = 0;
    levelFinished = false;
    gameMode = "play";

    loadPanel();
}

function updateButtonVisibility() {
    const prevBtn = document.getElementById("previous-button");
    const nextBtn = document.getElementById("next-button");
    const submitBtn = document.getElementById("submit-button");
    const hintBtn = document.getElementById("hint-button");
    const input = document.getElementById("user-guess");

    // prev/next visibili se hai almeno 1 tentativo o hint o fine livello
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

    // gestione input + submit
    if (gameMode === "view") {
        // view-only: niente submit e input disabilitato
        submitBtn.classList.add("hidden");
        if (input) {
            input.disabled = true;
            input.placeholder = "Level locked (view only)";
            input.value = "";
        }
    } else {
        if (input) {
            input.disabled = false;
            input.placeholder = "Enter your guess here...";
        }

        // submit sparisce se livello finito
        if (levelFinished) submitBtn.classList.add("hidden");
        else submitBtn.classList.remove("hidden");
    }
}

function navigateToStatistics() {
    localStorage.setItem("totalLevels", levels.length);
    window.location.href = "FrontEnd/history.html";
}

// ---- init ----
localStorage.setItem("totalLevels", levels.length);

currentLevelId = resolveInitialLevelId();
setLevel(currentLevelId);

