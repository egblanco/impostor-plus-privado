// Estado del Juego
let players = [];
let impostorIndex = -1;
let currentWordObj = null; // Guardará el objeto completo {name, image}
let currentCategory = "";
let currentClue = "";
let currentRevealPlayerIndex = 0;
let timerInterval = null;
let timeLeft = 300;

// Elementos del DOM
const screens = {
    start: document.getElementById('screen-start'),
    reveal: document.getElementById('screen-reveal'),
    game: document.getElementById('screen-game'),
    vote: document.getElementById('screen-vote')
};

const playerInput = document.getElementById('player-input');
const btnAddPlayer = document.getElementById('btn-add-player');
const playerList = document.getElementById('player-list');
const gameOptions = document.getElementById('game-options');
const btnStartGame = document.getElementById('btn-start-game');

const roleCard = document.getElementById('role-card');
const currentPlayerName = document.getElementById('current-player-name');
const displayCategory = document.getElementById('display-category');
const displayWord = document.getElementById('display-word');
const impostorMsg = document.getElementById('impostor-msg');
const btnNextReveal = document.getElementById('btn-next-reveal');
const revealProgress = document.getElementById('reveal-progress');

const timerDisplay = document.getElementById('timer-display');
const btnTimerToggle = document.getElementById('btn-timer-toggle');
const btnGoVote = document.getElementById('btn-go-vote');
const voteList = document.getElementById('vote-list');
const btnCancelVote = document.getElementById('btn-cancel-vote');
const gameCategoryInfo = document.getElementById('game-category-info');
const btnRestart = document.getElementById('btn-restart');
const categorySelect = document.getElementById('category-select');
const displayImage = document.getElementById('display-image');
const wordImageContainer = document.getElementById('word-image-container');

// Llenar selector de categorías
function populateCategories() {
    gameData.categories.forEach((cat, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}
populateCategories();

// --- Lógica de Jugadores ---

function addPlayer() {
    const name = playerInput.value.trim();
    if (name && players.length < 12) {
        players.push(name);
        playerInput.value = '';
        renderPlayers();
        checkMinPlayers();
    }
}

function removePlayer(index) {
    players.splice(index, 1);
    renderPlayers();
    checkMinPlayers();
}

function renderPlayers() {
    playerList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
            <span>${player}</span>
            <button class="btn-remove" onclick="removePlayer(${index})">×</button>
        `;
        playerList.appendChild(li);
    });
}

function checkMinPlayers() {
    if (players.length >= 3) {
        gameOptions.classList.remove('hidden');
    } else {
        gameOptions.classList.add('hidden');
    }
}

// --- Lógica del Juego ---

function initGame() {
    // Seleccionar categoría basada en el usuario o aleatoria
    let category;
    const selectedVal = categorySelect.value;

    if (selectedVal === "random") {
        category = gameData.categories[Math.floor(Math.random() * gameData.categories.length)];
    } else {
        category = gameData.categories[parseInt(selectedVal)];
    }

    currentWordObj = category.words[Math.floor(Math.random() * category.words.length)];

    currentCategory = category.name;
    currentClue = category.clue; // Guardamos la pista de words.js

    // Seleccionar Impostor
    impostorIndex = Math.floor(Math.random() * players.length);

    // Resetear revelado
    currentRevealPlayerIndex = 0;
    showScreen('reveal');
    setupReveal();
}

function setupReveal() {
    const isImpostor = currentRevealPlayerIndex === impostorIndex;

    currentPlayerName.textContent = players[currentRevealPlayerIndex];
    revealProgress.textContent = `Jugador ${currentRevealPlayerIndex + 1} de ${players.length}`;

    // Preparar contenido de la carta (pero oculta)
    displayCategory.textContent = currentCategory;

    if (isImpostor) {
        displayWord.textContent = "PISTA: " + currentClue.toUpperCase();
        displayWord.style.color = "#ff0000";
        displayWord.classList.remove('hidden');
        wordImageContainer.classList.add('hidden');
        impostorMsg.textContent = "¡ERES EL IMPOSTOR!";
        impostorMsg.classList.remove('hidden');
    } else {
        displayWord.classList.add('hidden'); // Ocultar el texto de la palabra
        displayImage.src = currentWordObj.image;
        wordImageContainer.classList.remove('hidden');
        impostorMsg.classList.add('hidden');
    }

    roleCard.classList.remove('flipped');
    btnNextReveal.classList.add('hidden');
}

function handleCardClick() {
    if (!roleCard.classList.contains('flipped')) {
        roleCard.classList.add('flipped');
        btnNextReveal.classList.remove('hidden');
    }
}

function nextReveal() {
    currentRevealPlayerIndex++;
    if (currentRevealPlayerIndex < players.length) {
        setupReveal();
    } else {
        startGameSession();
    }
}

function startGameSession() {
    showScreen('game');
    gameCategoryInfo.textContent = currentCategory;
    resetTimer();
    startTimer();
}

// --- Timer ---

function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            alert("¡Se acabó el tiempo! Es hora de votar.");
        }
    }, 1000);
    btnTimerToggle.textContent = '⏸';
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    btnTimerToggle.textContent = '▶';
}

function resetTimer() {
    stopTimer();
    timeLeft = 300;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- Utilidades ---

function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenKey].classList.add('active');
}

// --- Lógica de Votación ---

function setupVote() {
    stopTimer();
    showScreen('vote');
    voteList.innerHTML = '';

    players.forEach((player, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-outline';
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.marginBottom = '10px';
        btn.style.padding = '15px';
        btn.innerHTML = `👤 ${player}`;
        btn.onclick = () => checkVote(index);
        voteList.appendChild(btn);
    });
}

function checkVote(index) {
    if (index === impostorIndex) {
        alert(`¡EXCELENTE! ${players[index]} era el Impostor. Los civiles ganan.`);
    } else {
        alert(`¡OH NO! ${players[index]} era inocente. El Impostor era ${players[impostorIndex]}. El Impostor gana.`);
    }
    showScreen('start');
}

// Event Listeners
btnAddPlayer.addEventListener('click', addPlayer);
playerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });
btnStartGame.addEventListener('click', initGame);
roleCard.addEventListener('click', handleCardClick);
btnNextReveal.addEventListener('click', nextReveal);
btnTimerToggle.addEventListener('click', () => {
    if (timerInterval) stopTimer();
    else startTimer();
});
btnGoVote.addEventListener('click', setupVote);
btnCancelVote.addEventListener('click', () => {
    showScreen('game');
    startTimer();
});
btnRestart.addEventListener('click', () => {
    stopTimer();
    showScreen('start');
});

// Inicializar
checkMinPlayers();
