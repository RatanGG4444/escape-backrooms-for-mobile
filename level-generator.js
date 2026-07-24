// level-generator.js - Level generation
function generateLevel(levelNum) {
    game.walls = [];
    
    switch(levelNum) {
        case 0:
            generateLevel0();
            break;
        case 1:
            generatePoolrooms();
            break;
        case 2:
            generateLevel2();
            break;
        case 3:
            generateLevel3();
            break;
        default:
            generateLevel0();
    }
}

// Level 0 - Mono Yellow Rooms
function generateLevel0() {
    const width = 50;
    const height = 50;
    const grid = createGrid(width, height);
    
    // Generate maze using recursive backtracker
    carveMaze(grid, 1, 1);
    
    // Convert to walls
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (grid[x][y] === 0) {
                game.walls.push({ x, y, color: '#f4e4a6' });
            }
        }
    }
    
    // Set player spawn
    game.player.x = 2;
    game.player.y = 2;
}

// Poolrooms
function generatePoolrooms() {
    const width = 60;
    const height = 60;
    const grid = createGrid(width, height);
    
    // Create large rooms with pools
    for (let i = 0; i < 10; i++) {
        const roomX = Math.floor(Math.random() * (width - 20)) + 5;
        const roomY = Math.floor(Math.random() * (height - 20)) + 5;
        const roomW = Math.floor(Math.random() * 10) + 10;
        const roomH = Math.floor(Math.random() * 10) + 10;
        
        // Carve room
        for (let x = roomX; x < roomX + roomW && x < width; x++) {
            for (let y = roomY; y < roomY + roomH && y < height; y++) {
                grid[x][y] = 1;
            }
        }
        
        // Add pool in center
        const poolX = roomX + Math.floor(roomW / 4);
        const poolY = roomY + Math.floor(roomH / 4);
        const poolW = Math.floor(roomW / 2);
        const poolH = Math.floor(roomH / 2);
        
        for (let x = poolX; x < poolX + poolW && x < width; x++) {
            for (let y = poolY; y < poolY + poolH && y < height; y++) {
                grid[x][y] = 2; // Pool tile
            }
        }
    }
    
    // Connect rooms
    connectRooms(grid, width, height);
    
    // Convert to walls
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (grid[x][y] === 0) {
                game.walls.push({ x, y, color: '#b8d4d4' });
            } else if (grid[x][y] === 2) {
                // Pool water (slower movement)
                game.walls.push({ x, y, color: '#4a90a4', isWater: true });
            }
        }
    }
    
    game.player.x = 5;
    game.player.y = 5;
}

// Level 2 - Pipe Dreams
function generateLevel2() {
    const width = 70;
    const height = 70;
    const grid = createGrid(width, height);
    
    // Create tight corridors
    carveTightMaze(grid, 1, 1);
    
    // Add random rooms
    for (let i = 0; i < 8; i++) {
        const roomX = Math.floor(Math.random() * (width - 15)) + 5;
        const roomY = Math.floor(Math.random() * (height - 15)) + 5;
        const roomSize = Math.floor(Math.random() * 6) + 6;
        
        for (let x = roomX; x < roomX + roomSize && x < width; x++) {
            for (let y = roomY; y < roomY + roomSize && y < height; y++) {
                grid[x][y] = 1;
            }
        }
    }
    
    // Convert to walls
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (grid[x][y] === 0) {
                game.walls.push({ x, y, color: '#4a4a4a' });
            }
        }
    }
    
    game.player.x = 2;
    game.player.y = 2;
}

// Level 3 - Electrical Station
function generateLevel3() {
    const width = 60;
    const height = 60;
    const grid = createGrid(width, height);
    
    // Grid of server rooms
    const roomSize = 8;
    const spacing = 12;
    
    for (let rx = 0; rx < 5; rx++) {
        for (let ry = 0; ry < 5; ry++) {
            const startX = rx * spacing + 2;
            const startY = ry * spacing + 2;
            
            for (let x = startX; x < startX + roomSize && x < width; x++) {
                for (let y = startY; y < startY + roomSize && y < height; y++) {
                    grid[x][y] = 1;
                }
            }
        }
    }
    
    // Connect rooms with corridors
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (x % spacing === 0 || y % spacing === 0) {
                if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                    grid[x][y] = 1;
                    grid[x + 1][y] = 1;
                    grid[x][y + 1] = 1;
                }
            }
        }
    }
    
    // Convert to walls
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (grid[x][y] === 0) {
                game.walls.push({ x, y, color: '#2a2a2a' });
            }
        }
    }
    
    game.player.x = 3;
    game.player.y = 3;
}

// Helper functions
function createGrid(width, height) {
    const grid = [];
    for (let x = 0; x < width; x++) {
        grid[x] = [];
        for (let y = 0; y < height; y++) {
            grid[x][y] = 0;
        }
    }
    return grid;
}

function carveMaze(grid, x, y) {
    const directions = [
        [0, -2], [2, 0], [0, 2], [-2, 0]
    ];
    
    // Shuffle directions
    directions.sort(() => Math.random() - 0.5);
    
    grid[x][y] = 1;
    
    for (let [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx > 0 && nx < grid.length - 1 && 
            ny > 0 && ny < grid[0].length - 1 && 
            grid[nx][ny] === 0) {
            
            grid[x + dx/2][y + dy/2] = 1;
            carveMaze(grid, nx, ny);
        }
    }
}

function carveTightMaze(grid, x, y) {
    const stack = [[x, y]];
    grid[x][y] = 1;
    
    while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];
        
        const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        
        for (let [dx, dy] of directions) {
            const nx = cx + dx;
            const ny = cy + dy;
            
            if (nx > 0 && nx < grid.length - 1 && 
                ny > 0 && ny < grid[0].length - 1 && 
                grid[nx][ny] === 0) {
                neighbors.push([nx, ny, dx, dy]);
            }
        }
        
        if (neighbors.length > 0) {
            const [nx, ny, dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
            grid[cx + dx/2][cy + dy/2] = 1;
            grid[nx][ny] = 1;
            stack.push([nx, ny]);
        } else {
            stack.pop();
        }
    }
}

function connectRooms(grid, width, height) {
    for (let x = 1; x < width - 1; x++) {
        for (let y = 1; y < height - 1; y++) {
            if (Math.random() < 0.05 && grid[x][y] === 0) {
                grid[x][y] = 1;
            }
        }
    }
}
