// player.js - Player class and controls
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
        this.strafeSpeed = 0;
        
        // Stats
        this.health = 100;
        this.sanity = 100;
        this.stamina = 100;
        this.battery = 100;
        
        // Movement
        this.walkSpeed = 2;
        this.sprintSpeed = 4;
        this.crouchSpeed = 1;
        this.isSprinting = false;
        this.isCrouching = false;
        
        // Flashlight
        this.flashlightOn = false;
        this.batteryDrainRate = 0.5;
        
        // View
        this.height = 1.6;
        this.crouchHeight = 0.8;
        this.currentHeight = this.height;
        
        // Survival
        this.survivalTime = 0;
        this.isAlive = true;
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.survivalTime += deltaTime;
        
        // Handle input
        this.handleMovement(deltaTime);
        this.handleRotation(deltaTime);
        this.handleActions();
        
        // Update stats
        this.updateStats(deltaTime);
        
        // Check death
        if (this.health <= 0 || this.sanity <= 0) {
            this.die();
        }
    }
    
    handleMovement(deltaTime) {
        const keys = game.keys;
        let moveX = 0;
        let moveY = 0;
        
        // Forward/Backward
        if (keys['w']) moveY = 1;
        if (keys['s']) moveY = -1;
        
        // Strafe
        if (keys['a']) moveX = -1;
        if (keys['d']) moveX = 1;
        
        // Sprint
        this.isSprinting = keys['shift'] && this.stamina > 0 && !this.isCrouching;
        
        // Crouch
        if (keys['control']) {
            this.isCrouching = true;
            this.currentHeight = this.crouchHeight;
        } else {
            this.isCrouching = false;
            this.currentHeight = this.height;
        }
        
        // Calculate speed
        let currentSpeed = this.walkSpeed;
        if (this.isSprinting) currentSpeed = this.sprintSpeed;
        if (this.isCrouching) currentSpeed = this.crouchSpeed;
        
        // Calculate movement
        const rad = this.angle * Math.PI / 180;
        const dx = Math.cos(rad) * moveY * currentSpeed * deltaTime;
        const dy = Math.sin(rad) * moveY * currentSpeed * deltaTime;
        const strafeX = Math.cos(rad + Math.PI / 2) * moveX * currentSpeed * deltaTime;
        const strafeY = Math.sin(rad + Math.PI / 2) * moveX * currentSpeed * deltaTime;
        
        // Check collision
        const newX = this.x + dx + strafeX;
        const newY = this.y + dy + strafeY;
        
        if (!this.checkCollision(newX, this.y)) {
            this.x = newX;
        }
        
        if (!this.checkCollision(this.x, newY)) {
            this.y = newY;
        }
    }
    
    handleRotation(deltaTime) {
        if (game.mouse.locked) {
            const sensitivity = game.settings.sensitivity / 1000;
            this.angle += game.mouse.x * sensitivity;
            game.mouse.x = 0;
            
            // Keep angle in range
            this.angle = this.angle % 360;
        }
    }
    
    handleActions() {
        const keys = game.keys;
        
        // Flashlight toggle
        if (keys['f'] && !this.flashlightToggled) {
            this.flashlightOn = !this.flashlightOn;
            this.flashlightToggled = true;
            
            // Update UI
            const icon = document.getElementById('flashlight-icon');
            icon.style.opacity = this.flashlightOn ? '1' : '0.3';
        }
        
        if (!keys['f']) {
            this.flashlightToggled = false;
        }
    }
    
    updateStats(deltaTime) {
        // Stamina
        if (this.isSprinting) {
            this.stamina = Math.max(0, this.stamina - 10 * deltaTime);
        } else if (this.stamina < 100) {
            this.stamina = Math.min(100, this.stamina + 5 * deltaTime);
        }
        
        // Battery drain
        if (this.flashlightOn && this.battery > 0) {
            this.battery = Math.max(0, this.battery - this.batteryDrainRate * deltaTime);
            
            if (this.battery === 0) {
                this.flashlightOn = false;
            }
        }
        
        // Sanity drain (passive)
        this.sanity = Math.max(0, this.sanity - 0.1 * deltaTime);
        
        // Sanity effects
        if (this.sanity < 30) {
            // Low sanity effects
            this.applyLowSanityEffects();
        }
    }
    
    applyLowSanityEffects() {
        // Visual distortion (handled in render)
        // Audio effects
        if (Math.random() < 0.001) {
            playSound('whisper');
        }
    }
    
    checkCollision(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);
        
        return game.walls.some(wall => 
            wall.x === gridX && wall.y === gridY
        );
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Screen flash effect
        flashScreen('#f00');
        playSound('hurt');
    }
    
    drainSanity(amount) {
        this.sanity = Math.max(0, this.sanity - amount);
    }
    
    restoreSanity(amount) {
        this.sanity = Math.min(100, this.sanity + amount);
    }
    
    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }
    
    rechargeBattery(amount) {
        this.battery = Math.min(100, this.battery + amount);
    }
    
    die() {
        this.isAlive = false;
        game.state = 'dead';
        
        // Show death screen
        document.getElementById('death-screen').classList.remove('hidden');
        document.getElementById('survival-time').textContent = formatTime(this.survivalTime);
        document.getElementById('level-reached').textContent = game.level;
        
        playSound('death');
    }
}

// Helper functions
function flashScreen(color) {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = color;
    flash.style.opacity = '0.5';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '9999';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.style.transition = 'opacity 0.3s';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 300);
    }, 100);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
