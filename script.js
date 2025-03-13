import { Conversation } from '@11labs/client';

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const connectionStatus = document.getElementById('connectionStatus');
const agentStatus = document.getElementById('agentStatus');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

let conversation;

// Theme toggle functionality - add this section
try {
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
} catch (e) {
    console.log('localStorage not available - theme preferences will not be saved');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        themeToggle.textContent = '☀️';
        try { localStorage.setItem('darkMode', 'enabled'); } catch(e) {}
    } else {
        themeToggle.textContent = '🌙';
        try { localStorage.setItem('darkMode', 'disabled'); } catch(e) {}
    }
});

// Update status indicators function - add this section
function updateIndicators() {
    const currentConnectionStatus = connectionStatus.textContent;
    const currentAgentStatus = agentStatus.textContent;
    
    const connectionIndicator = document.getElementById('connectionIndicator');
    const agentIndicator = document.getElementById('agentIndicator');
    
    // Connection indicator
    connectionIndicator.className = 'status-indicator';
    if (currentConnectionStatus === 'Connected') {
        connectionIndicator.classList.add('connected');
    } else {
        connectionIndicator.classList.add('disconnected');
    }
    
    // Agent indicator
    agentIndicator.className = 'status-indicator';
    if (currentAgentStatus === 'listening') {
        agentIndicator.classList.add('listening');
    } else if (currentAgentStatus === 'speaking') {
        agentIndicator.classList.add('speaking');
    }
}

// Initialize indicators and set up observers - add this section
updateIndicators();

const statusObserver = new MutationObserver(updateIndicators);
statusObserver.observe(connectionStatus, { childList: true });
statusObserver.observe(agentStatus, { childList: true });

// Original conversation code
async function getSignedUrl() {
    const response = await fetch('http://localhost:3001/api/get-signed-url');
    if (!response.ok) {
        throw new Error(`Failed to get signed url: ${response.statusText}`);
    }
    const { signedUrl } = await response.json();
    return signedUrl;
}

async function startConversation() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const signedUrl = await getSignedUrl();

        conversation = await Conversation.startSession({
            signedUrl,
            // agentId has been removed...
            onConnect: () => {
                connectionStatus.textContent = 'Connected';
                startButton.disabled = true;
                stopButton.disabled = false;
                updateIndicators(); // Add this line to update indicators immediately
            },
            onDisconnect: () => {
                connectionStatus.textContent = 'Disconnected';
                startButton.disabled = false;
                stopButton.disabled = true;
                updateIndicators(); // Add this line to update indicators immediately
            },
            onError: (error) => {
                console.error('Error:', error);
            },
            onModeChange: (mode) => {
                agentStatus.textContent = mode.mode === 'speaking' ? 'speaking' : 'listening';
                updateIndicators(); // Add this line to update indicators immediately
            },
        });
    } catch (error) {
        console.error('Failed to start conversation:', error);
    }
}

// Add event listeners for the buttons
startButton.addEventListener('click', startConversation);
stopButton.addEventListener('click', () => {
    if (conversation) {
        conversation.endSession();
        conversation = null;
    }
});