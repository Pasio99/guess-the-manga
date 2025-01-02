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
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op4.png", answer: "The bugle call", hint: "I'm Luffy! The Man Who Will Become the Pirate King!" }
        ]
    },
    {
        panels: [
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op1.png", answer: "prova", hint: "No hint" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op2.png", answer: "prova", hint: "Target: Shonen" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op3.png", answer: "prova", hint: "Not Ended, N° of Tome: 110, Chapters: 1132" },
            { src: "https://github.com/Pasio99/guess-the-manga/raw/main/immagini/OnePiece/Op4.png", answer: "prova", hint: "I'm Luffy! The Man Who Will Become the Pirate King!" }
        ]
    }
];

let currentLevel = 0;
let currentPanel = 0;
let attempts = 0;
const maxAttempts = 4;
let hintVisible = false;
let levelCompleted = false;
let maxPanelReached = 0;
let completedLevels = [];

// Carica lo stato del gioco da localStorage
function loadGameState() {
    const savedLevel = localStorage.getItem('currentLevel');
    const savedPanel = localStorage.getItem('currentPanel');
    const savedAttempts = localStorage.getItem('attempts');
    const savedLevelCompleted = localStorage.getItem('levelCompleted');
    const savedMaxPanelReached = localStorage.getItem('maxPanelReached');
    const savedCompletedLevels = localStorage.getItem('completedLevels');

    if (savedLevel !== null) currentLevel = parseInt(savedLevel);
    if (savedPanel !== null) currentPanel = parseInt(savedPanel);
    if (savedAttempts !== null) attempts = parseInt(savedAttempts);
    if (savedLevelCompleted !== null) levelCompleted = JSON.parse(savedLevelCompleted);
    if (savedMaxPanelReached !== null) maxPanelReached = parseInt(savedMaxPanelReached);
    if (savedCompletedLevels !== null) completedLevels = JSON.parse(savedCompletedLevels);

    if (attempts > 0 || levelCompleted) {
        document.getElementById("previous-button").classList.remove("hidden");
        document.getElementById("next-button").classList.remove("hidden");
        document.getElementById("hint-button").classList.remove("hidden");
    }

    if (completedLevels.includes(currentLevel)) {
        document.getElementById("submit-button").classList.add("hidden");
        document.getElementById("previous-button").classList.remove("hidden");
        document.getElementById("next-button").classList.remove("hidden");
    } else {
        document.getElementById("submit-button").classList.remove("hidden");
    }
}

// Salva lo stato del gioco in localStorage
function saveGameState() {
    localStorage.setItem('currentLevel', currentLevel);
    localStorage.setItem('currentPanel', currentPanel);
    localStorage.setItem('attempts', attempts);
    localStorage.setItem('levelCompleted', levelCompleted);
    localStorage.setItem('maxPanelReached', maxPanelReached);
    localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
}

function loadPanel() {
    const panelImage = document.getElementById("manga-panel");
    const hintOverlay = document.getElementById("hint-overlay");
    const levelIndicator = document.getElementById("level-indicator");
    const current = levels[currentLevel].panels[currentPanel];

    panelImage.src = current.src;
    levelIndicator.textContent = `Manga #${currentLevel + 1}`;
    if (hintVisible) {
        hintOverlay.textContent = current.hint;
        hintOverlay.classList.remove("hidden");
    } else {
        hintOverlay.textContent = "";
        hintOverlay.classList.add("hidden");
    }

    updateProgressBar(currentPanel + 1, levels[currentLevel].panels.length);
}

function updateProgressBar(currentImageIndex, totalImages) {
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = (currentImageIndex / totalImages) * 100;
    progressBar.style.width = progressPercentage + '%';
}

function saveResult(status) {
    const resultLog = localStorage.getItem("resultLog") || "[]";
    const results = JSON.parse(resultLog);

    if (!results[currentLevel]) {
        results[currentLevel] = {
            manga: levels[currentLevel].panels[0].answer,
            status: status,
            attempts: attempts
        };
    }

    localStorage.setItem("resultLog", JSON.stringify(results));
}

function checkAnswer() {
    if (completedLevels.includes(currentLevel)) {
        return;
    }

    const userGuess = document.getElementById("user-guess").value.trim();
    const result = document.getElementById("result");
    const current = levels[currentLevel].panels[currentPanel];

    if (userGuess.toLowerCase() === current.answer.toLowerCase()) {
        result.textContent = "Correct!";
        result.style.color = "green";
        saveResult("Correct");

        completedLevels.push(currentLevel);
        currentLevel++;
        if (currentLevel >= levels.length) {
            result.textContent = "Congratulations! You've completed all levels!";
            return;
        }

        currentPanel = 0;
        attempts = 0;
        levelCompleted = true;
        maxPanelReached = 0;

        document.getElementById("previous-button").classList.remove("hidden");
        document.getElementById("next-button").classList.remove("hidden");
        document.getElementById("hint-button").classList.remove("hidden");
        document.getElementById("hint-overlay").classList.add("hidden");
        document.getElementById("submit-button").classList.add("hidden");
        hintVisible = false;

        setTimeout(() => {
            result.textContent = "";
            document.getElementById("user-guess").value = "";
            loadPanel();
        }, 2000);
    } else {
        attempts++;

        if (attempts < maxAttempts) {
            result.textContent = "Wrong answer! Try again.";
            result.style.color = "red";

            document.getElementById("previous-button").classList.remove("hidden");
            document.getElementById("next-button").classList.remove("hidden");
            document.getElementById("hint-button").classList.remove("hidden");

            currentPanel++;
            if (currentPanel >= levels[currentLevel].panels.length) {
                currentPanel = levels[currentLevel].panels.length - 1;
            }

            if (currentPanel > maxPanelReached) {
                maxPanelReached = currentPanel;
            }

            loadPanel();

            setTimeout(() => {
                result.textContent = "";
                if (currentPanel === levels[currentLevel].panels.length - 1) {
                    result.textContent = "Last guess!";
                }
            }, 10000);
        } else {
            result.textContent = "Out of attempts! Moving to the next level.";
            result.style.color = "red";
            saveResult("Failed");
            completedLevels.push(currentLevel);

            currentLevel++;
            if (currentLevel >= levels.length) {
                result.textContent = "Game Over! You've completed all levels.";
                return;
            }

            currentPanel = 0;
            attempts = 0;
            levelCompleted = true;
            maxPanelReached = 0;

            document.getElementById("previous-button").classList.remove("hidden");
            document.getElementById("next-button").classList.remove("hidden");
            document.getElementById("hint-button").classList.remove("hidden");
            document.getElementById("hint-overlay").classList.add("hidden");
            document.getElementById("submit-button").classList.add("hidden");
            hintVisible = false;

            setTimeout(() => {
                result.textContent = "";
                document.getElementById("user-guess").value = "";
                loadPanel();
            }, 2000);
        }
    }

    saveGameState();
}

function showHint() {
    const hintOverlay = document.getElementById("hint-overlay");
    const current = levels[currentLevel].panels[currentPanel];
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
    if (completedLevels.includes(currentLevel) || currentPanel < maxPanelReached) {
        if (currentPanel < 3) { // Assuming there are 4 panels (0 to 3)
            currentPanel++;
            loadPanel();
        }
    }
}

function goToLevel(level) {
    currentLevel = level;
    currentPanel = 0;
    attempts = 0;
    hintVisible = false;
    levelCompleted = false;
    maxPanelReached = 0;
    saveGameState();
    loadPanel();
}

loadGameState();

const navigateToLevel = localStorage.getItem('navigateToLevel');
if (navigateToLevel !== null) {
    goToLevel(parseInt(navigateToLevel));
    localStorage.removeItem('navigateToLevel');
} else {
    loadPanel();
}
localStorage.setItem('totalLevels', levels.length);
