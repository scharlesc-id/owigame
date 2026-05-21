// ============================================
// OWI GAME - LOCAL STORAGE VERSION
// ============================================

// Game State
let gameState = {
    playerId: '',
    playerName: '',
    totalPoints: 0,
    pointsPerClick: 1,
    upgradeLevel: 1,
    upgradeCost: 10000
};

// Audio Context
let audioContext;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playClickSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(800, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.08);
}

function playSpecialSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, audioContext.currentTime);
    osc.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
}

// Random Images
const randomImages = [
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/200/200?random=2',
    'https://picsum.photos/200/200?random=3',
    'https://picsum.photos/200/200?random=4',
    'https://picsum.photos/200/200?random=5',
    'https://picsum.photos/200/200?random=6'
];

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

function savePlayerData() {
    const allPlayers = JSON.parse(localStorage.getItem('owi_players') || '{}');
    allPlayers[gameState.playerId] = {
        name: gameState.playerName,
        totalPoints: gameState.totalPoints,
        pointsPerClick: gameState.pointsPerClick,
        upgradeLevel: gameState.upgradeLevel,
        upgradeCost: gameState.upgradeCost,
        lastUpdated: Date.now()
    };
    localStorage.setItem('owi_players', JSON.stringify(allPlayers));
}

function loadPlayerData(playerId) {
    const allPlayers = JSON.parse(localStorage.getItem('owi_players') || '{}');
    return allPlayers[playerId] || null;
}

function getAllPlayers() {
    return JSON.parse(localStorage.getItem('owi_players') || '{}');
}

function getLeaderboard() {
    const allPlayers = getAllPlayers();
    return Object.entries(allPlayers)
        .map(([id, data]) => ({
            id,
            name: data.name,
            points: data.totalPoints || 0
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);
}

function resetWeeklyLeaderboard() {
    const allPlayers = getAllPlayers();
    // Simpan history
    const history = JSON.parse(localStorage.getItem('owi_history') || '[]');
    const topPlayer = getLeaderboard()[0];
    if (topPlayer) {
        history.push({
            name: topPlayer.name,
            points: topPlayer.points,
            week: new Date().toISOString().slice(0, 10),
            timestamp: Date.now()
        });
        localStorage.setItem('owi_history', JSON.stringify(history));
    }
    // Reset semua poin
    Object.keys(allPlayers).forEach(id => {
        allPlayers[id].totalPoints = 0;
        allPlayers[id].pointsPerClick = 1;
        allPlayers[id].upgradeLevel = 1;
        allPlayers[id].upgradeCost = 10000;
    });
    localStorage.setItem('owi_players', JSON.stringify(allPlayers));
}

// ============================================
// DOM ELEMENTS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const loginScreen = document.getElementById('loginScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    // Login
    const playerNameInput = document.getElementById('playerName');
    const startBtn = document.getElementById('startBtn');
    const switchPlayerBtn = document.getElementById('switchPlayerBtn');
    const savedPlayersDiv = document.getElementById('savedPlayers');
    
    // Game
    const displayName = document.getElementById('displayName');
    const totalPointsDisplay = document.getElementById('totalPoints');
    const pointsPerClickDisplay = document.getElementById('pointsPerClick');
    const clickZone = document.getElementById('clickZone');
    const floatingImage = document.getElementById('floatingImage');
    const upgradeLevelDisplay = document.getElementById('upgradeLevel');
    const nextUpgradeCostDisplay = document.getElementById('nextUpgradeCost');
    
    // Modals
    const shopModal = document.getElementById('shopModal');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const shopBtn = document.getElementById('shopBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const closeShop = document.getElementById('closeShop');
    const closeLeaderboard = document.getElementById('closeLeaderboard');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Video overlay
    const videoOverlay = document.getElementById('videoOverlay');
    const bonusText = document.getElementById('bonusText');
    
    // Toast
    const toast = document.getElementById('toast');
    
    // ============================================
    // SHOW SAVED PLAYERS
    // ============================================
    
    function showSavedPlayers() {
        const allPlayers = getAllPlayers();
        const playerIds = Object.keys(allPlayers);
        
        if (playerIds.length === 0) {
            savedPlayersDiv.innerHTML = '';
            switchPlayerBtn.style.display = 'none';
            return;
        }
        
        switchPlayerBtn.style.display = 'block';
        savedPlayersDiv.innerHTML = playerIds.map(id => {
            const p = allPlayers[id];
            return `<button class="saved-player-btn" data-id="${id}">
                ${p.name} (${p.totalPoints?.toLocaleString() || 0} pts)
            </button>`;
        }).join('');
        
        // Add click event to saved player buttons
        document.querySelectorAll('.saved-player-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const playerId = btn.dataset.id;
                loadGame(playerId);
            });
        });
    }
    
    showSavedPlayers();
    
    // ============================================
    // START GAME
    // ============================================
    
    startBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (!name) {
            showToast('Masukkan nama dulu!');
            return;
        }
        
        // Init audio on first interaction
        initAudio();
        
        const playerId = 'owi_' + name.toLowerCase().replace(/\s+/g, '_');
        
        // Check if player exists
        const existing = loadPlayerData(playerId);
        if (existing) {
            gameState = {
                playerId,
                ...existing
            };
        } else {
            gameState = {
                playerId,
                playerName: name,
                totalPoints: 0,
                pointsPerClick: 1,
                upgradeLevel: 1,
                upgradeCost: 10000
            };
            savePlayerData();
        }
        
        startGame();
    });
    
    // Switch player
    switchPlayerBtn.addEventListener('click', () => {
        // Just show saved players (they're already visible)
        showToast('Pilih pemain yang tersedia');
    });
    
    function loadGame(playerId) {
        const data = loadPlayerData(playerId);
        if (data) {
            gameState = {
                playerId,
                ...data
            };
            startGame();
        }
    }
    
    function startGame() {
        loginScreen.classList.remove('active');
        gameScreen.classList.add('active');
        updateDisplay();
    }
    
    // ============================================
    // CLICK HANDLER
    // ============================================
    
    clickZone.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!audioContext) initAudio();
        playClickSound();
        
        // 50% chance special sound
        const isSpecial = Math.random() < 0.5;
        if (isSpecial) {
            playSpecialSound();
            triggerSpecialSound();
        }
        
        // Add points
        gameState.totalPoints += gameState.pointsPerClick;
        
        // Show floating image
        showFloatingImage();
        
        // Update
        updateDisplay();
        savePlayerData();
    });
    
    // ============================================
    // SPECIAL SOUND
    // ============================================
    
    function triggerSpecialSound() {
        videoOverlay.classList.add('active');
        
        const bonus = Math.floor(gameState.totalPoints * 0.1);
        gameState.totalPoints += bonus;
        bonusText.textContent = `+${bonus.toLocaleString()} BONUS! (10%)`;
        
        setTimeout(() => {
            videoOverlay.classList.remove('active');
            updateDisplay();
            savePlayerData();
        }, 3000);
    }
    
    // ============================================
    // FLOATING IMAGE
    // ============================================
    
    function showFloatingImage() {
        const randomImg = randomImages[Math.floor(Math.random() * randomImages.length)];
        floatingImage.innerHTML = `<img src="${randomImg}" alt="Random">`;
        floatingImage.classList.add('show');
        
        const x = 30 + Math.random() * 40;
        const y = 30 + Math.random() * 40;
        floatingImage.style.left = x + '%';
        floatingImage.style.top = y + '%';
        
        setTimeout(() => floatingImage.classList.remove('show'), 2000);
    }
    
    // ============================================
    // SHOP MODAL
    // ============================================
    
    shopBtn.addEventListener('click', () => {
        updateShopDisplay();
        shopModal.classList.add('active');
    });
    
    closeShop.addEventListener('click', () => shopModal.classList.remove('active'));
    
    upgradeBtn.addEventListener('click', () => {
        if (gameState.totalPoints >= gameState.upgradeCost) {
            gameState.totalPoints -= gameState.upgradeCost;
            gameState.upgradeLevel++;
            gameState.pointsPerClick = gameState.upgradeLevel;
            gameState.upgradeCost = Math.floor(gameState.upgradeCost * 1.5);
            
            updateDisplay();
            updateShopDisplay();
            savePlayerData();
            showToast(`🎉 Upgrade! Sekarang +${gameState.pointsPerClick} per click`);
        } else {
            showToast('❌ Poin tidak cukup!');
        }
    });
    
    // ============================================
    // LEADERBOARD MODAL
    // ============================================
    
    leaderboardBtn.addEventListener('click', () => {
        loadLeaderboard();
        leaderboardModal.classList.add('active');
    });
    
    closeLeaderboard.addEventListener('click', () => leaderboardModal.classList.remove('active'));
    
    document.getElementById('resetLeaderboardBtn').addEventListener('click', () => {
        if (confirm('Reset semua poin minggu ini? Poin top 1 akan disimpan di history.')) {
            resetWeeklyLeaderboard();
            loadLeaderboard();
            showToast('🔄 Leaderboard direset!');
        }
    });
    
    function loadLeaderboard() {
        const leaderboard = getLeaderboard();
        const list = document.getElementById('leaderboardList');
        
        if (leaderboard.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">Belum ada pemain</div>';
            return;
        }
        
        list.innerHTML = leaderboard.map((p, i) => {
            let rankEmoji;
            switch(i) {
                case 0: rankEmoji = '🥇'; break;
                case 1: rankEmoji = '🥈'; break;
                case 2: rankEmoji = '🥉'; break;
                default: rankEmoji = `#${i + 1}`;
            }
            const isMe = p.id === gameState.playerId;
            return `
                <div class="leaderboard-item ${i === 0 ? 'top-1' : ''} ${isMe ? 'is-me' : ''}">
                    <span class="leaderboard-rank">${rankEmoji}</span>
                    <span class="leaderboard-name">${p.name} ${isMe ? '(YOU)' : ''}</span>
                    <span class="leaderboard-points">${p.points.toLocaleString()} pts</span>
                </div>
            `;
        }).join('');
    }
    
    // ============================================
    // LOGOUT
    // ============================================
    
    logoutBtn.addEventListener('click', () => {
        savePlayerData();
        gameScreen.classList.remove('active');
        loginScreen.classList.add('active');
        showSavedPlayers();
        playerNameInput.value = '';
        showToast('👋 Sampai jumpa!');
    });
    
    // ============================================
    // MODAL OUTSIDE CLICK
    // ============================================
    
    window.addEventListener('click', (e) => {
        if (e.target === shopModal) shopModal.classList.remove('active');
        if (e.target === leaderboardModal) leaderboardModal.classList.remove('active');
    });
    
    // ============================================
    // UPDATE DISPLAY
    // ============================================
    
    function updateDisplay() {
        displayName.textContent = gameState.playerName;
        totalPointsDisplay.textContent = gameState.totalPoints.toLocaleString();
        pointsPerClickDisplay.textContent = `+${gameState.pointsPerClick}`;
        upgradeLevelDisplay.textContent = gameState.upgradeLevel;
        nextUpgradeCostDisplay.textContent = gameState.upgradeCost.toLocaleString();
    }
    
    function updateShopDisplay() {
        document.getElementById('shopCurrentLevel').textContent = gameState.upgradeLevel;
        document.getElementById('shopCurrentPoints').textContent = gameState.pointsPerClick;
        document.getElementById('upgradeCost').textContent = gameState.upgradeCost.toLocaleString();
        upgradeBtn.disabled = gameState.totalPoints < gameState.upgradeCost;
    }
    
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
});
