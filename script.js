//Audios System
const audioFiles = {
    click: 'Click.mp3',
    win: 'Win.mp3',
    draw: 'draw.mp3'
}

const audioPool = {
    click: [],
    win: [],
    draw: []
};

// Initialize audio pool
function initAudioPool() {
    ['click', 'win', 'draw'].forEach(type => {
        for (let i = 0; i < 5; i++) {
            const audio = new Audio(audioFiles[type]);
            audio.preload = 'auto';
            audioPool[type].push(audio);
        }
    });
}

/**
 * Play audio from pool (reuses audio elements to avoid conflicts)
 * @param {string} type - Type of sound: 'click', 'win', or 'draw'
 */
function playAudio(type = 'click') {
    try {
        if (!audioPool[type] || audioPool[type].length === 0) {
            return;
        }

        let audio = audioPool[type].find(a => a.paused);
        if (!audio) {
            audio = audioPool[type][0];
        }

        audio.currentTime = 0;
        audio.volume = 0.5; // Adjust volume as needed (0.0 to 1.0)
        audio.play().catch(err => {
            console.log('Audio playback failed:', err);
        });
    } catch (e) {
        console.log('Audio error:', e);
    }
}

function playCellClickSound() {
    playAudio('click');
}

function playButtonClickSound() {
    playAudio('click');
}

function playWinSound() {
    playAudio('win');
}

function playDrawSound() {
    playAudio('draw');
}

// Initialize audio pool when page loads
window.addEventListener('load', initAudioPool);

// Game System

const gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameActive: true,
    gameMode: null, // 'pvp' or 'ai'
    scores: {
        X: 0,
        O: 0,
        draw: 0
    }
};

// Winning combinations
const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Elements
const menuElement = document.getElementById('menu');
const gameSectionElement = document.getElementById('gameSection');
const boardElement = document.getElementById('board');
const cellElements = document.querySelectorAll('.cell');
const gameStatusElement = document.getElementById('gameStatus');
const scoreXElement = document.getElementById('scoreX');
const scoreOElement = document.getElementById('scoreO');
const scoreDrawElement = document.getElementById('scoreDraw');
const scoreOLabelElement = document.getElementById('scoreOLabel');
const modalElement = document.getElementById('modal');
const modalMessageElement = document.getElementById('modalMessage');
const modalContinueBtnElement = document.getElementById('modalContinueBtn');
const restartBtnElement = document.getElementById('restartBtn');
const resetBtnElement = document.getElementById('resetBtn');
const backBtnElement = document.getElementById('backBtn');
const modeButtonsElements = document.querySelectorAll('.btn-mode');


// Mode selection buttons
modeButtonsElements.forEach(btn => {
    btn.addEventListener('click', () => {
        playButtonClickSound();
        gameState.gameMode = btn.dataset.mode;
        startGame();
    });
});

// Cell click handler
cellElements.forEach(cell => {
    cell.addEventListener('click', (e) => {
        playCellClickSound();
        handleCellClick(e);
    });
});

// Action buttons
restartBtnElement.addEventListener('click', () => {
    playButtonClickSound();
    restartRound();
});
resetBtnElement.addEventListener('click', () => {
    playButtonClickSound();
    resetScore();
});
backBtnElement.addEventListener('click', () => {
    playButtonClickSound();
    backToMenu();
});
modalContinueBtnElement.addEventListener('click', () => {
    playButtonClickSound();
    closeModal();
});

//Stsrts Game
function startGame() {
    menuElement.classList.add('hidden');
    gameSectionElement.classList.add('active');
    resetBoard();
    updateScoreboard();
    updateGameStatus();

    // Update AI label if AI mode
    if (gameState.gameMode === 'ai') {
        scoreOLabelElement.textContent = 'AI (O)';
    } else {
        scoreOLabelElement.textContent = 'Player O';
    }
}

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);

    // Check if cell is already filled or game is not active
    if (gameState.board[index] !== '' || !gameState.gameActive) {
        return;
    }

    // Place player's move
    gameState.board[index] = gameState.currentPlayer;
    updateCell(index);

    // Check for win or draw
    const result = checkGameResult();
    if (result) {
        handleGameEnd(result);
        return;
    }

    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateGameStatus();

    // AI move if in AI mode and it's O's turn
    if (gameState.gameMode === 'ai' && gameState.currentPlayer === 'O') {
        gameState.gameActive = false;
        setTimeout(makeAIMove, 600); // 600ms delay for realism
    }
}

function makeAIMove() {
    const emptyIndices = gameState.board
        .map((cell, index) => cell === '' ? index : null)
        .filter(val => val !== null);

    if (emptyIndices.length === 0) {
        gameState.gameActive = true;
        return;
    }

    let aiMove = null;

    // Priority 1: Try to win
    aiMove = findWinningMove('O');
    if (aiMove !== null) {
        gameState.board[aiMove] = 'O';
        updateCell(aiMove);
        const result = checkGameResult();
        if (result) {
            handleGameEnd(result);
            return;
        }
    } else {
        // Priority 2: Block player's winning move
        aiMove = findWinningMove('X');
        if (aiMove !== null) {
            gameState.board[aiMove] = 'O';
            updateCell(aiMove);
            const result = checkGameResult();
            if (result) {
                handleGameEnd(result);
                return;
            }
        } else {
            // Priority 3: Take center if available
            if (gameState.board[4] === '') {
                aiMove = 4;
            }
            // Priority 4: Take a corner
            else if ([0, 2, 6, 8].some(i => gameState.board[i] === '')) {
                const corners = [0, 2, 6, 8].filter(i => gameState.board[i] === '');
                aiMove = corners[Math.floor(Math.random() * corners.length)];
            }
            // Priority 5: Take any available space
            else {
                aiMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            }

            gameState.board[aiMove] = 'O';
            updateCell(aiMove);
            const result = checkGameResult();
            if (result) {
                handleGameEnd(result);
                return;
            }
        }
    }

    // Switch back to player
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    updateGameStatus();
}

function findWinningMove(player) {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        const cells = [gameState.board[a], gameState.board[b], gameState.board[c]];
        const playerCount = cells.filter(cell => cell === player).length;
        const emptyCount = cells.filter(cell => cell === '').length;

        if (playerCount === 2 && emptyCount === 1) {
            // Found a winning opportunity
            for (let index of combo) {
                if (gameState.board[index] === '') {
                    return index;
                }
            }
        }
    }
    return null;
}

//Result Check
function checkGameResult() {
    // Check for win
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (
            gameState.board[a] !== '' &&
            gameState.board[a] === gameState.board[b] &&
            gameState.board[a] === gameState.board[c]
        ) {
            return {
                type: 'win',
                winner: gameState.board[a],
                combo: combo
            };
        }
    }

    // Check for draw
    if (gameState.board.every(cell => cell !== '')) {
        return {
            type: 'draw'
        };
    }

    return null;
}

function handleGameEnd(result) {
    gameState.gameActive = false;

    if (result.type === 'win') {
        const winner = result.winner;
        gameState.scores[winner]++;

        // Highlight winning combination
        result.combo.forEach(index => {
            cellElements[index].classList.add('winner');
        });

        // Play win sound
        playWinSound();

        // Show modal
        let message;
        if (gameState.gameMode === 'ai' && winner === 'O') {
            message = 'AI Wins!';
        } else {
            message = `Player ${winner} Wins!`;
        }
        showModal(message);
    } else if (result.type === 'draw') {
        gameState.scores.draw++;
        playDrawSound();
        showModal("It's a Draw!");
    }

    updateScoreboard();
}

function updateCell(index) {
    const cell = cellElements[index];
    cell.textContent = gameState.board[index];
    cell.classList.add(gameState.board[index].toLowerCase());
    cell.classList.add('disabled');
}

function updateGameStatus() {
    if (gameState.gameActive) {
        if (gameState.gameMode === 'ai' && gameState.currentPlayer === 'O') {
            gameStatusElement.textContent = 'AI is thinking...';
        } else {
            gameStatusElement.textContent = `Current Player: ${gameState.currentPlayer}`;
        }
    }
}

function updateScoreboard() {
    scoreXElement.textContent = gameState.scores.X;
    scoreOElement.textContent = gameState.scores.O;
    scoreDrawElement.textContent = gameState.scores.draw;
}

function resetBoard() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;

    cellElements.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'disabled', 'winner');
    });

    updateGameStatus();
}

function restartRound() {
    resetBoard();
}

function resetScore() {
    gameState.scores = {
        X: 0,
        O: 0,
        draw: 0
    };
    updateScoreboard();
    resetBoard();
}

function backToMenu() {
    menuElement.classList.remove('hidden');
    gameSectionElement.classList.remove('active');
    gameState.gameMode = null;
    gameState.scores = {
        X: 0,
        O: 0,
        draw: 0
    };
    resetBoard();
    updateScoreboard();
}

//Popup
function showModal(message) {
    modalMessageElement.textContent = message;
    modalElement.classList.add('active');
}

function closeModal() {
    modalElement.classList.remove('active');
    restartRound();
}

// Load scores from localStorage if available
function loadScores() {
    const savedScores = localStorage.getItem('aluCrossScores');
    if (savedScores) {
        gameState.scores = JSON.parse(savedScores);
    }
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('aluCrossScores', JSON.stringify(gameState.scores));
}

// Auto-save scores when they change
const originalUpdateScoreboard = updateScoreboard;
updateScoreboard = function () {
    originalUpdateScoreboard();
    saveScores();
};

// Load scores on page load
loadScores();
updateScoreboard();

// Initialize audio pool on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioPool);
} else {
    initAudioPool();
}
