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

let gameState = {
    levels: {},
    currentLevel: 0,
    totalAttempts: 0,
    totalCompleted: 0
};

function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
    }
    updateButtonVisibility();
}

function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadPanel() {
    const panelImage = document.getElementById("manga-panel");
    const hintOverlay = document.getElementById("hint-overlay");
    const levelIndicator = document.getElementById("level-indicator");
    const current = levels[gameState.currentLevel].panels[currentPanel];

    panelImage.src = current.src;
    levelIndicator.textContent = `Manga #${gameState.currentLevel + 1}`;
    if (hintVisible) {
        hintOverlay.textContent = current.hint;
        hintOverlay.classList.remove("hidden");
    } else {
        hintOverlay.textContent = "";
        hintOverlay.classList.add("hidden");
    }

    updateProgressBar(currentPanel + 1, levels[gameState.currentLevel].panels.length);
    updateButtonVisibility();
}

function updateProgressBar(currentImageIndex, totalImages) {
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = (currentImageIndex / totalImages) * 100;
    progressBar.style.width = progressPercentage + '%';
}

function saveResult(status) {
    if (!gameState.levels[gameState.currentLevel]) {
        gameState.levels[gameState.currentLevel] = {
            completed: false,
            attempts: 0,
            maxPanelReached: 0
        };
    }

    gameState.levels[gameState.currentLevel].status = status;
    gameState.levels[gameState.currentLevel].attempts = attempts;
    if (status === "Correct") {
        gameState.levels[gameState.currentLevel].completed = true;
        gameState.totalCompleted++;
    }

    saveGameState();
}

function checkAnswer() {
    if (gameState.levels[gameState.currentLevel]?.completed) {
        return;
    }

    const userGuess = document.getElementById("user-guess").value.trim();
    const result = document.getElementById("result");
    const current = levels[gameState.currentLevel].panels[currentPanel];

    if (userGuess.toLowerCase() === current.answer.toLowerCase()) {
        result.textContent = "Correct!";
        result.style.color = "green";
        saveResult("Correct");

        gameState.currentLevel++;
        if (gameState.currentLevel >= levels.length) {
            result.textContent = "Congratulations! You've completed all levels!";
            return;
        }

        currentPanel = 0;
        attempts = 0;
        levelCompleted = true;
        maxPanelReached = 0;

        document.getElementById("hint-overlay").classList.add("hidden");
        hintVisible = false;

        setTimeout(() => {
            result.textContent = "";
            document.getElementById("user-guess").value = "";
            loadPanel();
        }, 2000);
    } else {
        attempts++;
        gameState.totalAttempts++;

        if (attempts < maxAttempts) {
            result.textContent = "Wrong answer! Try again.";
            result.style.color = "red";

            currentPanel = maxPanelReached + 1;
            if (currentPanel >= levels[gameState.currentLevel].panels.length) {
                currentPanel = levels[gameState.currentLevel].panels.length - 1;
            }

            if (currentPanel > maxPanelReached) {
                maxPanelReached = currentPanel;
            }

            loadPanel();

            setTimeout(() => {
                result.textContent = "";
                if (currentPanel === levels[gameState.currentLevel].panels.length - 1) {
                    result.textContent = "Last guess!";
                }
            }, 10000);
        } else {
            result.textContent = "Out of attempts! Moving to the next level.";
            result.style.color = "red";
            saveResult("Failed");

            gameState.currentLevel++;
            if (gameState.currentLevel >= levels.length) {
                result.textContent = "Game Over! You've completed all levels.";
                return;
            }

            currentPanel = 0;
            attempts = 0;
            levelCompleted = true;
            maxPanelReached = 0;

            document.getElementById("hint-overlay").classList.add("hidden");
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
    const current = levels[gameState.currentLevel].panels[currentPanel];
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
    if (gameState.levels[gameState.currentLevel]?.completed || currentPanel < maxPanelReached) {
        if (currentPanel < 3) { // Assuming there are 4 panels (0 to 3)
            currentPanel++;
            loadPanel();
        }
    }
}

function goToLevel(level) {
    gameState.currentLevel = level;
    currentPanel = 0;
    attempts = 0;
    hintVisible = false;
    levelCompleted = false;
    maxPanelReached = 0;
    saveGameState();
    loadPanel();
}

function resetGame() {
    localStorage.removeItem('gameState');
    gameState = {
        levels: {},
        currentLevel: 0,
        totalAttempts: 0,
        totalCompleted: 0
    };
    currentPanel = 0;
    attempts = 0;
    hintVisible = false;
    levelCompleted = false;
    maxPanelReached = 0;
    loadPanel();
}

function updateButtonVisibility() {
    if (gameState.levels[gameState.currentLevel]?.completed) {
        document.getElementById("submit-button").classList.add("hidden");
        document.getElementById("previous-button").classList.remove("hidden");
        document.getElementById("next-button").classList.remove("hidden");
    } else {
        document.getElementById("submit-button").classList.remove("hidden");
        document.getElementById("previous-button").classList.add("hidden");
        document.getElementById("next-button").classList.add("hidden");
    }

    if (attempts > 0 || levelCompleted) {
        document.getElementById("previous-button").classList.remove("hidden");
        document.getElementById("next-button").classList.remove("hidden");
        document.getElementById("hint-button").classList.remove("hidden");
    }
}

function navigateToStatistics() {
    saveGameState();
    window.location.href = "history.html";
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
