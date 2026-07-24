// entities.js - Entity classes
class Entity {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.angle = 0;
        this.speed = 0;
        this.health = 100;
        this.state = 'idle';
        this.detectionRange = 15;
        this.attackRange = 2;
        this.damage = 10;
        this.moveSpeed = 1.5;
    }
    
    update(deltaTime) {
        this.updateAI(deltaTime);
        this.move(deltaTime);
    }
    
    updateAI(deltaTime) {
        if (!game.player || !game.player.isAlive) return;
        
        const distance = this.distanceToPlayer();
        
        switch(this.state) {
            case 'idle':
                if (distance < this.detectionRange) {
                    this.state = 'chasing';
                    this.onDetectPlayer();
                } else {
                    this.wander(deltaTime);
                }
                break;
                
            case 'chasing':
                if (distance < this.attackRange) {
                    this.state = 'attacking';
                } else if (distance > this.detectionRange * 2) {
                    this.state = 'idle';
                } else {
                    this.chasePlayer(deltaTime);
                }
                break;
                
            case 'attacking':
                this.attackPlayer(deltaTime);
                if (distance > this.attackRange) {
                    this.state = 'chasing';
                }
                break;
        }
    }
    
    move(deltaTime) {
        if (this.speed === 0) return;
        
        const rad = this.angle * Math.PI / 180;
        const newX = this.x + Math.cos(rad) * this.speed * deltaTime;
        const newY = this.y + Math.sin(rad) * this.speed * deltaTime;
        
        // Check collision
        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
    }
    
    wander(deltaTime) {
        // Random wandering
        if (Math.random() < 0.01) {
            this.angle = Math.random() * 360;
            this.speed = this.moveSpeed * 0.5;
        }
    }
    
    chasePlayer(deltaTime) {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        this.angle = Math.atan2(dy, dx) * 180 / Math.PI;
        this.speed = this.moveSpeed;
    }
    
    attackPlayer(deltaTime) {
        if (Math.random() < 0.02) {
            game.player.takeDamage(this.damage);
            this.onAttack();
        }
    }
    
    distanceToPlayer() {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    checkCollision(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);
        
        return game.walls.some(wall => 
            wall.x === gridX && wall.y === gridY
        );
    }
    
    onDetectPlayer() {
        playSound('detect');
    }
    
    onAttack() {
        playSound('entity_attack');
    }
}

// Smiler Entity
class Smiler extends Entity {
    constructor(x, y) {
        super(x, y, 'smiler');
        this.detectionRange = 15;
        this.attackRange = 1.5;
        this.damage = 50;
        this.moveSpeed = 0.8;
        this.isInvisible = true;
    }
    
    updateAI(deltaTime) {
        super.updateAI(deltaTime);
        
        // Only visible in darkness or when player looks at it
        if (!game.player.flashlightOn) {
            this.isInvisible = false;
        } else {
            this.isInvisible = true;
        }
    }
    
    onDetectPlayer() {
        playSound('smiler_laugh');
        game.player.drainSanity(10);
    }
}

// Hound Entity
class Hound extends Entity {
    constructor(x, y) {
        super(x, y, 'hound');
        this.detectionRange = 25;
        this.attackRange = 2;
        this.damage = 30;
        this.moveSpeed = 3.5;
        this.canLunge = true;
        this.lungeCooldown = 5;
        this.lungeTimer = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.lungeTimer > 0) {
            this.lungeTimer -= deltaTime;
        }
    }
    
    chasePlayer(deltaTime) {
        super.chasePlayer(deltaTime);
        
        const distance = this.distanceToPlayer();
        
        // Lunge attack
        if (distance < 8 && distance > 3 && this.lungeTimer <= 0 && this.canLunge) {
            this.lunge();
        }
    }
    
    lunge() {
        this.speed = this.moveSpeed * 3;
        this.lungeTimer = this.lungeCooldown;
        playSound('hound_bark');
        
        setTimeout(() => {
            this.speed = this.moveSpeed;
        }, 500);
    }
}

// Bacteria Entity (Poolrooms)
class Bacteria extends Entity {
    constructor(x, y) {
        super(x, y, 'bacteria');
        this.detectionRange = 20;
        this.attackRange = 2;
        this.damage = 20;
        this.moveSpeed = 1.2;
        this.infectionChance = 0.3;
    }
    
    attackPlayer(deltaTime) {
        super.attackPlayer(deltaTime);
        
        // Apply infection
        if (Math.random() < this.infectionChance) {
            game.player.drainSanity(5);
        }
    }
    
    onDetectPlayer() {
        playSound('bacteria_growl');
    }
}

// Clump Entity
class Clump extends Entity {
    constructor(x, y) {
        super(x, y, 'clump');
        this.detectionRange = 12;
        this.attackRange = 1.5;
        this.damage = 60;
        this.moveSpeed = 0.5;
        this.isEnraged = false;
        this.enrageDuration = 10;
        this.enrageTimer = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isEnraged) {
            this.enrageTimer -= deltaTime;
            if (this.enrageTimer <= 0) {
                this.calmDown();
            }
        }
    }
    
    updateAI(deltaTime) {
        // Check if player is looking at Clump
        if (this.isPlayerLookingAtMe() && !this.isEnraged) {
            this.becomeEnraged();
        }
        
        super.updateAI(deltaTime);
    }
    
    isPlayerLookingAtMe() {
        const player = game.player;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const angleToEntity = Math.atan2(dy, dx) * 180 / Math.PI;
        const angleDiff = Math.abs(angleToEntity - player.angle);
        
        return angleDiff < 30 && this.distanceToPlayer() < 15;
    }
    
    becomeEnraged() {
        this.isEnraged = true;
        this.moveSpeed = 2.5;
        this.enrageTimer = this.enrageDuration;
        playSound('clump_scream');
        game.player.drainSanity(20);
    }
    
    calmDown() {
        this.isEnraged = false;
        this.moveSpeed = 0.5;
    }
}

// Facelings Group
class FacelingsGroup {
    constructor(x, y, count = 5) {
        this.x = x;
        this.y = y;
        this.members = [];
        this.state = 'wandering';
        
        for (let i = 0; i < count; i++) {
            const angle = (360 / count) * i;
            const rad = angle * Math.PI / 180;
            const memberX = x + Math.cos(rad) * 3;
            const memberY = y + Math.sin(rad) * 3;
            
            this.members.push({
                x: memberX,
                y: memberY,
                angle: angle
            });
        }
    }
    
    update(deltaTime) {
        const player = game.player;
        if (!player || !player.isAlive) return;
        
        const distance = this.distanceToPlayer();
        
        switch(this.state) {
            case 'wandering':
                if (distance < 20) {
                    this.state = 'approaching';
                }
                this.wander(deltaTime);
                break;
                
            case 'approaching':
                if (distance < 5) {
                    this.state = 'circling';
                }
                this.approach(deltaTime);
                break;
                
            case 'circling':
                if (this.isPlayerLooking()) {
                    this.state = 'fleeing';
                    playSound('faceling_laugh');
                }
                this.circle(deltaTime);
                break;
                
            case 'fleeing':
                if (distance > 15) {
                    this.state = 'wandering';
                }
                this.flee(deltaTime);
                break;
        }
    }
    
    wander(deltaTime) {
        if (Math.random() < 0.01) {
            const newX = this.x + (Math.random() - 0.5) * 10;
            const newY = this.y + (Math.random() - 0.5) * 10;
            this.moveGroup(newX, newY, deltaTime);
        }
    }
    
    approach(deltaTime) {
        const player = game.player;
        this.moveGroup(player.x, player.y, deltaTime * 0.5);
    }
    
    circle(deltaTime) {
        const player = game.player;
        this.members.forEach(member => {
            member.angle += 20 * deltaTime;
            const rad = member.angle * Math.PI / 180;
            member.x = player.x + Math.cos(rad) * 5;
            member.y = player.y + Math.sin(rad) * 5;
        });
        
        game.player.drainSanity(2 * deltaTime);
    }
    
    flee(deltaTime) {
        const player = game.player;
        const awayX = this.x + (this.x - player.x) * 2;
        const awayY = this.y + (this.y - player.y) * 2;
        this.moveGroup(awayX, awayY, deltaTime * 2);
    }
    
    moveGroup(targetX, targetY, deltaTime) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
            this.x += (dx / distance) * deltaTime;
            this.y += (dy / distance) * deltaTime;
            
            // Update members
            this.members.forEach((member, i) => {
                const angle = (360 / this.members.length) * i;
                const rad = angle * Math.PI / 180;
                member.x = this.x + Math.cos(rad) * 3;
                member.y = this.y + Math.sin(rad) * 3;
            });
        }
    }
    
    distanceToPlayer() {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    isPlayerLooking() {
        const player = game.player;
        
        return this.members.some(member => {
            const dx = member.x - player.x;
            const dy = member.y - player.y;
            const angleToMember = Math.atan2(dy, dx) * 180 / Math.PI;
            const angleDiff = Math.abs(angleToMember - player.angle);
            
            return angleDiff < 30;
        });
    }
}

// Spawn entities function
function spawnEntities() {
    game.entities = [];
    
    // Spawn based on level
    switch(game.level) {
        case 0: // Level 0 - Smilers
            for (let i = 0; i < 3; i++) {
                const pos = getRandomSpawnPoint();
                game.entities.push(new Smiler(pos.x, pos.y));
            }
            break;
            
        case 1: // Poolrooms - Bacteria
            for (let i = 0; i < 5; i++) {
                const pos = getRandomSpawnPoint();
                game.entities.push(new Bacteria(pos.x, pos.y));
            }
            break;
            
        case 2: // Level 2 - Hounds & Clumps
            for (let i = 0; i < 2; i++) {
                const pos = getRandomSpawnPoint();
                game.entities.push(new Hound(pos.x, pos.y));
            }
            for (let i = 0; i < 2; i++) {
                const pos = getRandomSpawnPoint();
                game.entities.push(new Clump(pos.x, pos.y));
            }
            break;
            
        case 3: // Level 3 - Facelings
            for (let i = 0; i < 2; i++) {
                const pos = getRandomSpawnPoint();
                game.entities.push(new FacelingsGroup(pos.x, pos.y));
            }
            break;
    }
}

function getRandomSpawnPoint() {
    // Find random empty spot
    let x, y;
    let attempts = 0;
    
    do {
        x = Math.floor(Math.random() * 50);
        y = Math.floor(Math.random() * 50);
        attempts++;
    } while (isWall(x, y) && attempts < 100);
    
    return { x, y };
}
