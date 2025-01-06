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
    currentLevel: 0,
    currentPanel: 0,
    attempts: 0,
    completedLevels: [],
    hintVisible: false
};

// Load the game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
    }
    loadPanel();
}

// Save the game state to localStorage
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadPanel() {
    const panelImage = document.getElementById("manga-panel");
    const hintOverlay = document.getElementById("hint-overlay");
    const levelIndicator = document.getElementById("level-indicator");
    const current = levels[gameState.currentLevel].panels[gameState.currentPanel];

    panelImage.src = current.src;
    levelIndicator.textContent = `Manga #${gameState.currentLevel + 1}`;
    if (gameState.hintVisible) {
        hintOverlay.textContent = current.hint;
        hintOverlay.classList.remove("hidden");
    } else {
        hintOverlay.textContent = "";
        hintOverlay.classList.add("hidden");
    }

    updateProgressBar(gameState.currentPanel + 1, levels[gameState.currentLevel].panels.length);
}

function updateProgressBar(currentImageIndex, totalImages) {
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = (currentImageIndex / totalImages) * 100;
    progressBar.style.width = progressPercentage + '%';
}

function checkAnswer() {
    const userGuess = document.getElementById("user-guess").value.trim();
    const result = document.getElementById("result");
    const current = levels[gameState.currentLevel].panels[gameState.currentPanel];

    if (userGuess.toLowerCase() === current.answer.toLowerCase()) {
        result.textContent = "Correct!";
        result.style.color = "green";

        gameState.completedLevels.push(gameState.currentLevel);
        gameState.currentLevel++;
        if (gameState.currentLevel >= levels.length) {
            result.textContent = "Congratulations! You've completed all levels!";
            return;
        }

        gameState.currentPanel = 0;
        gameState.attempts = 0;
        gameState.hintVisible = false;

        setTimeout(() => {
            result.textContent = "";
            document.getElementById("user-guess").value = "";
            loadPanel();
        }, 2000);
    } else {
        gameState.attempts++;
        result.textContent = "Wrong answer! Try again.";
        result.style.color = "red";
        if (gameState.attempts >= 4) {
            result.textContent = "Out of attempts! Moving to the next level.";
            gameState.currentLevel++;
            gameState.currentPanel = 0;
            gameState.attempts = 0;
            setTimeout(() => loadPanel(), 2000);
        }
    }
    saveGameState();
}

function showHint() {
    const hintOverlay = document.getElementById("hint-overlay");
    const current = levels[gameState.currentLevel].panels[gameState.currentPanel];
    hintOverlay.textContent = current.hint;
    hintOverlay.classList.remove("hidden");
    gameState.hintVisible = true;
    saveGameState();
}

function resetGame() {
    localStorage.removeItem('gameState');
    gameState = {
        currentLevel: 0,
        currentPanel: 0,
        attempts: 0,
        completedLevels: [],
        hintVisible: false
    };
    loadPanel();
}

loadGameState();
