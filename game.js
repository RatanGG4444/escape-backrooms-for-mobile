// Game.js - Main game engine
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game state
const game = {
    state: 'loading',
    level: 0,
    player: null,
    entities: [],
    walls: [],
    settings: {
        sensitivity: 50,
        volume: 100,
        quality: 'medium'
    },
    keys: {},
    mouse: { x: 0, y: 0, locked: false },
    time: 0,
    deltaTime: 0,
    lastTime: 0
};

// Initialize
window.addEventListener('load', init);

function init() {
    // Resize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Load assets
    loadAssets();
    
    // Setup controls
    setupControls();
    
    // Show main menu after loading
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        game.state = 'menu';
    }, 2000);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function loadAssets() {
    // Simulate loading
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        document.getElementById('loading-progress').style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 200);
}

function setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        game.keys[e.key.toLowerCase()] = true;
        
        if (e.key === 'Escape' && game.state === 'playing') {
            pauseGame();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        game.keys[e.key.toLowerCase()] = false;
    });
    
    // Mouse
    canvas.addEventListener('click', () => {
        if (game.state === 'playing' && !game.mouse.locked) {
            canvas.requestPointerLock();
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        game.mouse.locked = document.pointerLockElement === canvas;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (game.mouse.locked) {
            game.mouse.x += e.movementX;
            game.mouse.y += e.movementY;
        }
    });
}

// Game functions
function startSinglePlayer() {
    document.getElementById('main-menu').classList.add('hidden');
    startGame();
}

function hostMultiplayer() {
    const roomCode = generateRoomCode();
    alert(`Room Code: ${roomCode}\nShare this with friends!`);
    startGame();
}

function showJoinMenu() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('join-menu').classList.remove('hidden');
}

function joinRoom() {
    const code = document.getElementById('room-code').value;
    const name = document.getElementById('player-name').value;
    
    if (code && name) {
        alert(`Joining room: ${code} as ${name}`);
        startGame();
    }
}

function backToMenu() {
    document.getElementById('join-menu').classList.add('hidden');
    document.getElementById('death-screen').classList.add('hidden');
    document.getElementById('game-canvas').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    game.state = 'menu';
}

function startGame() {
    // Hide menus
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('join-menu').classList.add('hidden');
    
    // Show game
    document.getElementById('game-canvas').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    
    // Initialize game
    game.state = 'playing';
    game.player = new Player(0, 0);
    game.level = 0;
    
    // Generate level
    generateLevel(game.level);
    
    // Spawn entities
    spawnEntities();
    
    // Start game loop
    gameLoop();
}

function gameLoop() {
    if (game.state !== 'playing') return;
    
    // Calculate delta time
    const now = Date.now();
    game.deltaTime = (now - game.lastTime) / 1000;
    game.lastTime = now;
    game.time += game.deltaTime;
    
    // Update
    update();
    
    // Render
    render();
    
    // Loop
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update player
    if (game.player) {
        game.player.update(game.deltaTime);
    }
    
    // Update entities
    game.entities.forEach(entity => {
        entity.update(game.deltaTime);
    });
    
    // Update HUD
    updateHUD();
}

function render() {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render 3D view (simplified raycasting)
    renderView();
    
    // Render minimap
    renderMinimap();
}

function renderView() {
    // Simple raycasting renderer
    const player = game.player;
    const fov = 60;
    const rays = canvas.width / 2;
    
    for (let i = 0; i < rays; i++) {
        const angle = (player.angle - fov / 2) + (fov / rays) * i;
        const ray = castRay(player.x, player.y, angle);
        
        if (ray.hit) {
            const distance = ray.distance * Math.cos((angle - player.angle) * Math.PI / 180);
            const wallHeight = (canvas.height / distance) * 10;
            const brightness = Math.max(50, 255 - distance * 5);
            
            // Draw wall slice
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness * 0.9})`;
            ctx.fillRect(
                i * 2,
                canvas.height / 2 - wallHeight / 2,
                2,
                wallHeight
            );
        }
    }
}

function castRay(x, y, angle) {
    // Simplified raycasting
    const rad = angle * Math.PI / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    
    for (let i = 0; i < 100; i++) {
        const checkX = Math.floor(x + dx * i);
        const checkY = Math.floor(y + dy * i);
        
        if (isWall(checkX, checkY)) {
            return { hit: true, distance: i };
        }
    }
    
    return { hit: false, distance: 100 };
}

function isWall(x, y) {
    return game.walls.some(wall => 
        wall.x === x && wall.y === y
    );
}

function renderMinimap() {
    const size = 150;
    const scale = 5;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - size - 10, 10, size, size);
    
    // Draw walls
    ctx.fillStyle = '#444';
    game.walls.forEach(wall => {
        ctx.fillRect(
            canvas.width - size - 10 + wall.x * scale,
            10 + wall.y * scale,
            scale,
            scale
        );
    });
    
    // Draw player
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(
        canvas.width - size - 10 + game.player.x * scale,
        10 + game.player.y * scale,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function updateHUD() {
    if (!game.player) return;
    
    document.getElementById('health-fill').style.width = game.player.health + '%';
    document.getElementById('sanity-fill').style.width = game.player.sanity + '%';
    document.getElementById('stamina-fill').style.width = game.player.stamina + '%';
    document.getElementById('battery-percent').textContent = game.player.battery + '%';
    document.getElementById('level-name').textContent = `LEVEL ${game.level}`;
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function pauseGame() {
    game.state = 'paused';
    showSettings();
}

function showSettings() {
    document.getElementById('settings-panel').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-panel').classList.add('hidden');
    if (game.state === 'paused') {
        game.state = 'playing';
        gameLoop();
    }
}

function saveSettings() {
    game.settings.sensitivity = document.getElementById('sensitivity').value;
    game.settings.volume = document.getElementById('volume').value;
    game.settings.quality = document.getElementById('quality').value;
    closeSettings();
}

function showControls() {
    document.getElementById('controls-panel').classList.remove('hidden');
}

function closeControls() {
    document.getElementById('controls-panel').classList.add('hidden');
}

function respawn() {
    document.getElementById('death-screen').classList.add('hidden');
    game.player = new Player(0, 0);
    game.state = 'playing';
    gameLoop();
}

// Update sensitivity slider display
document.getElementById('sensitivity')?.addEventListener('input', (e) => {
    document.getElementById('sens-value').textContent = e.target.value;
});

document.getElementById('volume')?.addEventListener('input', (e) => {
    document.getElementById('vol-value').textContent = e.target.value;
});
