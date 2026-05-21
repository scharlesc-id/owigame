// Game State
let gameState = {
    playerName: '',
    totalPoints: 0,
    pointsPerClick: 1,
    upgradeLevel: 1,
    upgradeCost: 10000,
    userId: null
};

// Sound Effects (menggunakan Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playSpecialSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Random Images Array
const randomImages = [
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/200/200?random=2',
    'https://picsum.photos/200/200?random=3',
    'https://picsum.photos/200/200?random=4',
    'https://picsum.photos/200/200?random=5',
    'https://picsum.photos/200/200?random=6'
];

// Inisialisasi Game
document.addEventListener('DOMContentLoaded', () => {
    // Login Screen
    const loginScreen = document.getElementById('loginScreen');
    const gameScreen = document.getElementById('gameScreen');
    const playerNameInput = document.getElementById('playerName');
    const startBtn = document.getElementById('startBtn');
    
    // Game Elements
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
    
    // Video Overlay
    const videoOverlay = document.getElementById('videoOverlay');
    const secretVideo = document.getElementById('secretVideo');
    const bonusText = document.getElementById('bonusText');
    
    // Toast
    const toast = document.getElementById('toast');
    
    // Start Game
    startBtn.addEventListener('click', async () => {
        const name = playerNameInput.value.trim();
        if (!name) {
            showToast('Masukkan nama terlebih dahulu!');
            return;
        }
        
        gameState.playerName = name;
        gameState.userId = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        
        try {
            await initializePlayerData();
            loginScreen.classList.remove('active');
            gameScreen.classList.add('active');
            updateDisplay();
            startLeaderboardListener();
        } catch (error) {
            console.error('Error:', error);
            showToast('Gagal terhubung ke server. Coba lagi.');
        }
    });
    
    // Click Handler
    clickZone.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Play click sound
        playClickSound();
        
        // 50% chance for special sound
        const isSpecialSound = Math.random() < 0.5;
        
        if (isSpecialSound) {
            playSpecialSound();
            handleSpecialSound();
        }
        
        // Add points
        gameState.totalPoints += gameState.pointsPerClick;
        
        // Show floating image
        showFloatingImage();
        
        // Update display
        updateDisplay();
        
        // Save to Firebase
        await savePlayerData();
    });
    
    // Special Sound Handler
    function handleSpecialSound() {
        videoOverlay.classList.add('active');
        
        // Calculate 10% bonus
        const bonus = Math.floor(gameState.totalPoints * 0.1);
        gameState.totalPoints += bonus;
        
        // Display bonus
        bonusText.textContent = `+${bonus} BONUS POINTS! (10%)`;
        
        // Play video
        secretVideo.currentTime = 0;
        secretVideo.play().catch(() => {
            // Fallback jika video tidak tersedia
            console.log('Video tidak tersedia, bonus tetap diberikan');
        });
        
        // Hide overlay after 3 seconds
        setTimeout(() => {
            videoOverlay.classList.remove('active');
            updateDisplay();
            savePlayerData();
        }, 3000);
    }
    
    // Floating Image Animation
    function showFloatingImage() {
        const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        floatingImage.innerHTML = `<img src="${randomImage}" alt="Random">`;
        floatingImage.classList.add('show');
        
        // Random position
        const randomX = Math.random() * 100 - 50;
        const randomY = Math.random() * 100 - 50;
        floatingImage.style.left = `${50 + randomX}%`;
        floatingImage.style.top = `${50 + randomY}%`;
        
        setTimeout(() => {
            floatingImage.classList.remove('show');
        }, 2000);
    }
    
    // Shop Modal
    shopBtn.addEventListener('click', () => {
        updateShopDisplay();
        shopModal.classList.add('active');
    });
    
    closeShop.addEventListener('click', () => {
        shopModal.classList.remove('active');
    });
    
    // Leaderboard Modal
    leaderboardBtn.addEventListener('click', async () => {
        leaderboardModal.classList.add('active');
        await loadLeaderboard();
    });
    
    closeLeaderboard.addEventListener('click', () => {
        leaderboardModal.classList.remove('active');
    });
    
    // Upgrade Handler
    upgradeBtn.addEventListener('click', async () => {
        if (gameState.totalPoints >= gameState.upgradeCost) {
            gameState.totalPoints -= gameState.upgradeCost;
            gameState.upgradeLevel++;
            gameState.pointsPerClick = gameState.upgradeLevel;
            gameState.upgradeCost = Math.floor(gameState.upgradeCost * 1.5);
            
            updateDisplay();
            updateShopDisplay();
            await savePlayerData();
            showToast(`Upgrade berhasil! Sekarang +${gameState.pointsPerClick} per click`);
        } else {
            showToast('Poin tidak cukup untuk upgrade!');
        }
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === shopModal) shopModal.classList.remove('active');
        if (e.target === leaderboardModal) leaderboardModal.classList.remove('active');
    });
    
    // Update Display
    function updateDisplay() {
        displayName.textContent = gameState.playerName;
        totalPointsDisplay.textContent = gameState.totalPoints.toLocaleString();
        pointsPerClickDisplay.textContent = `+${gameState.pointsPerClick}`;
        upgradeLevelDisplay.textContent = gameState.upgradeLevel;
        nextUpgradeCostDisplay.textContent = gameState.upgradeCost.toLocaleString();
    }
    
    // Update Shop Display
    function updateShopDisplay() {
        document.getElementById('shopCurrentLevel').textContent = gameState.upgradeLevel;
        document.getElementById('shopCurrentPoints').textContent = gameState.pointsPerClick;
        document.getElementById('upgradeCost').textContent = gameState.upgradeCost.toLocaleString();
        
        if (gameState.totalPoints < gameState.upgradeCost) {
            upgradeBtn.disabled = true;
        } else {
            upgradeBtn.disabled = false;
        }
    }
    
    // Toast Notification
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
    
    // Firebase Operations
    async function initializePlayerData() {
        const userRef = window.firebaseDoc(window.firebaseDB, 'players', gameState.userId);
        const userDoc = await window.firebaseGetDoc(userRef);
        
        if (!userDoc.exists()) {
            await window.firebaseSetDoc(userRef, {
                name: gameState.playerName,
                totalPoints: 0,
                pointsPerClick: 1,
                upgradeLevel: 1,
                upgradeCost: 10000,
                weeklyPoints: 0,
                lastWeekReset: getCurrentWeek(),
                createdAt: window.firebaseServerTimestamp(),
                lastUpdated: window.firebaseServerTimestamp()
            });
        } else {
            const data = userDoc.data();
            gameState.totalPoints = data.totalPoints || 0;
            gameState.pointsPerClick = data.pointsPerClick || 1;
            gameState.upgradeLevel = data.upgradeLevel || 1;
            gameState.upgradeCost = data.upgradeCost || 10000;
            
            // Check weekly reset
            if (data.lastWeekReset !== getCurrentWeek()) {
                // Save previous week's top score
                await saveWeeklyTopScore(data);
                
                // Reset weekly points
                await window.firebaseUpdateDoc(userRef, {
                    weeklyPoints: 0,
                    lastWeekReset: getCurrentWeek(),
                    lastUpdated: window.firebaseServerTimestamp()
                });
            }
        }
    }
    
    async function savePlayerData() {
        const userRef = window.firebaseDoc(window.firebaseDB, 'players', gameState.userId);
        await window.firebaseUpdateDoc(userRef, {
            totalPoints: gameState.totalPoints,
            pointsPerClick: gameState.pointsPerClick,
            upgradeLevel: gameState.upgradeLevel,
            upgradeCost: gameState.upgradeCost,
            weeklyPoints: window.firebaseIncrement(gameState.pointsPerClick),
            lastUpdated: window.firebaseServerTimestamp()
        });
    }
    
    async function saveWeeklyTopScore(oldData) {
        const topScoreRef = window.firebaseDoc(
            window.firebaseDB, 
            'weeklyTopScores', 
            `${oldData.lastWeekReset}_${gameState.userId}`
        );
        
        await window.firebaseSetDoc(topScoreRef, {
            name: oldData.name,
            points: oldData.weeklyPoints || 0,
            week: oldData.lastWeekReset,
            timestamp: window.firebaseServerTimestamp()
        });
    }
    
    // Leaderboard Functions
    let leaderboardUnsubscribe = null;
    
    function startLeaderboardListener() {
        const weeklyQuery = window.firebaseQuery(
            window.firebaseCollection(window.firebaseDB, 'players'),
            window.firebaseOrderBy('weeklyPoints', 'desc'),
            window.firebaseLimit(10)
        );
        
        leaderboardUnsubscribe = window.firebaseOnSnapshot(weeklyQuery, (snapshot) => {
            // Real-time update tersedia jika diperlukan
            // Tidak perlu refresh manual
        });
    }
    
    async function loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '<div class="loading">Memuat data...</div>';
        
        try {
            const weeklyQuery = window.firebaseQuery(
                window.firebaseCollection(window.firebaseDB, 'players'),
                window.firebaseOrderBy('weeklyPoints', 'desc'),
                window.firebaseLimit(10)
            );
            
            const querySnapshot = await window.firebaseGetDocs(weeklyQuery);
            leaderboardList.innerHTML = '';
            
            querySnapshot.forEach((doc, index) => {
                const data = doc.data();
                const playerDiv = document.createElement('div');
                playerDiv.className = `leaderboard-item ${index === 0 ? 'top-1' : ''}`;
                
                let rankEmoji;
                switch(index) {
                    case 0: rankEmoji = '🥇'; break;
                    case 1: rankEmoji = '🥈'; break;
                    case 2: rankEmoji = '🥉'; break;
                    default: rankEmoji = `#${index + 1}`;
                }
                
                playerDiv.innerHTML = `
                    <span class="leaderboard-rank">${rankEmoji}</span>
                    <span class="leaderboard-name">${data.name}</span>
                    <span class="leaderboard-points">${(data.weeklyPoints || 0).toLocaleString()} pts</span>
                `;
                
                leaderboardList.appendChild(playerDiv);
            });
            
            if (querySnapshot.empty) {
                leaderboardList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">Belum ada pemain minggu ini</div>';
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            leaderboardList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--danger);">Gagal memuat data</div>';
        }
    }
    
    // Weekly Reset Timer
    function updateWeeklyTimer() {
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setHours(23, 59, 59, 999);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        
        const diff = endOfWeek - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timerElement = document.getElementById('countdownTimer');
        if (timerElement) {
            timerElement.textContent = `${days} hari ${hours}:${minutes}:${seconds}`;
        }
    }
    
    setInterval(updateWeeklyTimer, 1000);
    
    // Utility Functions
    function getCurrentWeek() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${weekNumber}`;
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (leaderboardUnsubscribe) {
            leaderboardUnsubscribe();
        }
    });
});