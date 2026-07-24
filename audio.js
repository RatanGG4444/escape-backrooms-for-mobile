// multiplayer.js - Simple peer-to-peer multiplayer
const multiplayer = {
    isHost: false,
    roomCode: null,
    players: {},
    socket: null
};

// Initialize multiplayer (using simple WebRTC or Socket.io)
function initMultiplayer() {
    // For demo purposes, using localStorage for "multiplayer"
    // In production, use Socket.io or WebRTC
    
    setInterval(() => {
        updateOnlineCount();
    }, 5000);
}

function updateOnlineCount() {
    // Simulate online players
    const count = Math.floor(Math.random() * 50) + 10;
    document.getElementById('online-count').textContent = count;
}

// Simple message system
function sendMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.textContent = `${game.player.name || 'Player'}: ${message}`;
    msgMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Chat input handler
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        sendMessage(e.target.value);
        e.target.value = '';
    }
});

// Initialize
initMultiplayer();
