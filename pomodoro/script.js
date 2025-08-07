// Generate a simple user ID (replace with your actual implementation if different)
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}
const USER_ID = generateUserId(); // Persistent user ID

const BASE_URL = 'https://pomodoro-render-deployment.onrender.com/api';
const timerDisplay = document.getElementById('timer-display');
const sessionType = document.getElementById('session-type');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const muteToggle = document.getElementById('mute-toggle');
const sessionList = document.getElementById('session-list');

// Sound elements
const workSound = document.getElementById('work-sound');
const shortBreakSound = document.getElementById('short-break-sound');
const longBreakSound = document.getElementById('long-break-sound');

let timerInterval;
let isRunning = false;
let isMuted = false;
let lastSessionType = null;

// Mute toggle
muteToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    muteToggle.textContent = isMuted ? 'Unmute Sounds' : 'Mute Sounds';
});

// Start button
startBtn.addEventListener('click', () => {
    console.log('Start button clicked - sending request to /start_timer with user_id:', USER_ID);
    fetch(`${BASE_URL}/start_timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Start response:', data);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        startBtn.textContent = 'Start'; // Reset text if resuming
        updateTimer(); // Immediate update
        if (!timerInterval) {
            timerInterval = setInterval(updateTimer, 1000);
        }
    })
    .catch(error => {
        console.error('Error starting timer:', error);
        startBtn.disabled = false;
    });
});

// Pause button
pauseBtn.addEventListener('click', () => {
    console.log('Pause button clicked');
    fetch(`${BASE_URL}/pause_timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
    })
    .then(response => response.json())
    .then(() => {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        updateTimer();
    })
    .catch(error => console.error('Error pausing timer:', error));
});

// Reset button
resetBtn.addEventListener('click', () => {
    console.log('Reset button clicked');
    fetch(`${BASE_URL}/reset_timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
    })
    .then(response => response.json())
    .then(() => {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        timerDisplay.textContent = '25:00';
        sessionType.textContent = 'Work Session';
        sessionType.className = 'work';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = 'Start';
        lastSessionType = 'work';
    })
    .catch(error => console.error('Error resetting timer:', error));
});

// Update timer
function updateTimer() {
    fetch(`${BASE_URL}/timer_status?user_id=${USER_ID}`)
        .then(response => response.json())
        .then(data => {
            console.log('Timer status:', data);
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

            sessionType.textContent = `${data.type.charAt(0).toUpperCase() + data.type.slice(1).replace('_', ' ')} Session`;
            sessionType.className = data.type;
            
            if (totalSeconds <= 0 && data.is_running && lastSessionType === data.type) {
                playEndSound(data.type);
                loadSessions();
                alert(`${data.type.charAt(0).toUpperCase() + data.type.slice(1).replace('_', ' ')} session completed! Starting next session.`);
                clearInterval(timerInterval);
                timerInterval = setInterval(updateTimer, 1000); // Restart polling
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
            
            lastSessionType = data.type;
        })
        .catch(error => console.error('Error fetching timer status:', error));
}

// Play sound
function playEndSound(sessionType) {
    if (isMuted) return;
    let sound;
    if (sessionType === 'work') sound = workSound;
    else if (sessionType === 'break') sound = shortBreakSound; // Match backend 'break' type
    else if (sessionType === 'long_break') sound = longBreakSound;
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => console.error('Sound playback failed:', error));
    }
}

// Load sessions
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
        .catch(error => console.error('Error loading sessions:', error));
}

// Format date/time (replace with your actual functions if different)
function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Initialize
console.log('Initializing with user_id:', USER_ID);
loadSessions();
setInterval(loadSessions, 30000);
updateTimer();
timerInterval = setInterval(updateTimer, 1000);