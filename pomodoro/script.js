const BASE_URL = 'https://pomodoro-render-deployment.onrender.com/api'; // Replace with your actual backend URL
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionList = document.getElementById('session-list');

let timerInterval;
let isRunning = false;
let currentSessionPauses = 0;
let sessionStartTime = null;

function updateTimer() {
    fetch(`${BASE_URL}/timer_status`)
        .then(response => response.json())
        .then(data => {
            // Force integer seconds to avoid decimal issues
            const totalSeconds = Math.floor(data.remaining_time);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update button states based on server state
            isRunning = data.is_running;
            startBtn.disabled = isRunning;
            pauseBtn.disabled = !isRunning;
            
            // Update button text based on remaining time
            if (!isRunning && totalSeconds < 25 * 60 && totalSeconds > 0) {
                startBtn.textContent = 'Resume';
            } else {
                startBtn.textContent = 'Start';
            }
            
            if (totalSeconds <= 0 && data.is_running) {
                clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                
                // Log completed session with pause count
                logCompletedSession();
                
                loadSessions();
                alert(`Pomodoro session completed! You paused ${currentSessionPauses} time(s) during this session.`);
                
                // Reset for next session
                resetSessionTracking();
            }
        })
        .catch(error => {
            console.error('Error fetching timer status:', error);
        });
}

startBtn.addEventListener('click', () => {
    // If this is a fresh start (25:00), record session start time
    if (startBtn.textContent === 'Start') {
        sessionStartTime = new Date().toLocaleString();
        currentSessionPauses = 0;
    }
    
    fetch(`${BASE_URL}/start_timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'default_user' })
    })
    .then(response => response.json())
    .then(() => {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        startBtn.textContent = 'Start';
        
        // Update immediately, then start the interval
        updateTimer();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
    })
    .catch(error => {
        console.error('Error starting timer:', error);
    });
});

pauseBtn.addEventListener('click', () => {
    // Increment pause counter
    currentSessionPauses++;
    
    fetch(`${BASE_URL}/pause_timer`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(() => {
        if (timerInterval) clearInterval(timerInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        // Update display to get current state and set resume button
        updateTimer();
    })
    .catch(error => {
        console.error('Error pausing timer:', error);
    });
});

resetBtn.addEventListener('click', () => {
    // Log incomplete session if there was an active session
    if (sessionStartTime) {
        logIncompleteSession();
    }
    
    fetch(`${BASE_URL}/reset_timer`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(() => {
        if (timerInterval) clearInterval(timerInterval);
        timerDisplay.textContent = '25:00';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = 'Start';
        
        // Reset session tracking and reload sessions
        resetSessionTracking();
        loadSessions();
    })
    .catch(error => {
        console.error('Error resetting timer:', error);
    });
});

function loadSessions() {
    fetch(`${BASE_URL}/sessions?user_id=default_user`)
        .then(response => response.json())
        .then(sessions => {
            sessionList.innerHTML = '';
            sessions.forEach(session => {
                const li = document.createElement('li');
                const pauseText = session.pause_count !== undefined ? ` (${session.pause_count} pauses)` : '';
                const statusText = session.completed ? 'Completed' : 'Incomplete';
                li.textContent = `${session.start_time} - ${statusText}${pauseText}`;
                sessionList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
        });
}

function logCompletedSession() {
    const sessionData = {
        user_id: 'default_user',
        start_time: sessionStartTime,
        end_time: new Date().toLocaleString(),
        completed: true,
        pause_count: currentSessionPauses
    };
    
    fetch(`${BASE_URL}/log_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
    })
    .catch(error => {
        console.error('Error logging session:', error);
    });
}

function logIncompleteSession() {
    const sessionData = {
        user_id: 'default_user',
        start_time: sessionStartTime,
        end_time: new Date().toLocaleString(),
        completed: false,
        pause_count: currentSessionPauses
    };
    
    fetch(`${BASE_URL}/log_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
    })
    .catch(error => {
        console.error('Error logging incomplete session:', error);
    });
}

function resetSessionTracking() {
    currentSessionPauses = 0;
    sessionStartTime = null;
}

// Initialize
loadSessions();
setInterval(loadSessions, 30000); // Refresh session list every 30 seconds
// Initial timer status check
updateTimer();