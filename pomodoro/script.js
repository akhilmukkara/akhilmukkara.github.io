const BASE_URL = 'https://pomodoro-render-deployment.onrender.com/api';
const timerDisplay = document.getElementById('timer-display');
const sessionType = document.getElementById('session-type');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const muteToggle = document.getElementById('mute-toggle'); // Added mute toggle
const sessionList = document.getElementById('session-list');

// Sound elements
const workSound = document.getElementById('work-sound');
const shortBreakSound = document.getElementById('short-break-sound');
const longBreakSound = document.getElementById('long-break-sound');

let timerInterval;
let isRunning = false;
let isMuted = false; // Track mute state (default: sounds on)
let lastSessionType = null; // Track session type to detect completion

// Mute toggle event listener
muteToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    muteToggle.textContent = isMuted ? 'Unmute Sounds' : 'Mute Sounds';
});

function updateTimer() {
    fetch(`${BASE_URL}/timer_status?user_id=${USER_ID}`)
        .then(response => response.json())
        .then(data => {
            const totalSeconds = Math.floor(data.remaining_time);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            isRunning = data.is_running;
            startBtn.disabled = isRunning;
            pauseBtn.disabled = !isRunning;
            
            if (!isRunning && totalSeconds < data.duration && totalSeconds > 0) {
                startBtn.textContent = 'Resume';
            } else {
                startBtn.textContent = 'Start';
            }

            // Update type display
            sessionType.textContent = `${data.type.charAt(0).toUpperCase() + data.type.slice(1).replace('_', ' ')} Session`;
            sessionType.className = data.type; // For CSS colors
            
            // Detect session completion and play sound
            if (totalSeconds <= 0 && data.is_running && lastSessionType === data.type) {
                clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                playEndSound(data.type); // Play sound for completed session
                loadSessions();
                alert(`${data.type.charAt(0).toUpperCase() + data.type.slice(1).replace('_', ' ')} session completed! Starting next session.`);
            }
            
            lastSessionType = data.type; // Update last session type
        })
        .catch(error => {
            console.error('Error fetching timer status:', error);
        });
}

// Play sound based on session type
function playEndSound(sessionType) {
    if (isMuted) return;
    let sound;
    if (sessionType === 'work') {
        sound = workSound;
    } else if (sessionType === 'short_break') {
        sound = shortBreakSound;
    } else if (sessionType === 'long_break') {
        sound = longBreakSound;
    }
    if (sound) {
        sound.currentTime = 0; // Reset to start
        sound.play().catch(error => console.error('Sound playback failed:', error));
    }
}

pauseBtn.addEventListener('click', () => {
    fetch(`${BASE_URL}/pause_timer`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
    })
    .then(response => response.json())
    .then(() => {
        if (timerInterval) clearInterval(timerInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        updateTimer();
    })
    .catch(error => {
        console.error('Error pausing timer:', error);
    });
});

resetBtn.addEventListener('click', () => {
    fetch(`${BASE_URL}/reset_timer`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
    })
    .then(response => response.json())
    .then(() => {
        if (timerInterval) clearInterval(timerInterval);
        timerDisplay.textContent = '25:00';
        sessionType.textContent = 'Work Session';
        sessionType.className = 'work';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = 'Start';
        lastSessionType = 'work'; // Reset session type
    })
    .catch(error => {
        console.error('Error resetting timer:', error);
    });
});

function loadSessions() {
    fetch(`${BASE_URL}/sessions?user_id=${USER_ID}`)
        .then(response => response.json())
        .then(sessions => {
            sessionList.innerHTML = '';
            sessions.forEach(session => {
                const li = document.createElement('li');
                
                const startDate = new Date(session.start_time);
                const formattedDate = formatDate(startDate);
                const startTime = formatTime(startDate);
                
                let endTime = 'Ongoing';
                if (session.end_time) {
                    const endDate = new Date(session.end_time);
                    endTime = formatTime(endDate);
                }
                
                const status = session.completed ? 'Completed' : 'Incomplete';
                const type = session.type.charAt(0).toUpperCase() + session.type.slice(1).replace('_', ' ');
                
                li.textContent = `${type} (${formattedDate}) - ${startTime} to ${endTime} - ${status}`;
                sessionList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
        });
}

// ... (formatDate and formatTime unchanged, assumed to be in your code)

// Initialize
loadSessions();
setInterval(loadSessions, 30000);
updateTimer();
timerInterval = setInterval(updateTimer, 1000); // Start polling immediately