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
const sounds = {
    work_end: document.getElementById('work-sound'),
    break_end: document.getElementById('short-break-sound'),
    long_break_end: document.getElementById('long-break-sound')
};

let timerInterval;
let isRunning = false;
let isMuted = false;
let lastSessionType = null;

// Generate a simple user ID
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Mute toggle
muteToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    muteToggle.textContent = isMuted ? 'Unmute Sounds' : 'Mute Sounds';
});

// Play sound based on sound_event
function playSound(soundId) {
    if (isMuted || !sounds[soundId]) return;
    const sound = sounds[soundId];
    sound.currentTime = 0;
    sound.play().catch(error => console.error('Sound playback failed:', error));
}

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
            
            if (data.sound_event) {
                playSound(data.sound_event); // Play sound for session completion
                loadSessions();
                alert(`${data.type.charAt(0).toUpperCase() + data.type.slice(1).replace('_', ' ')} session completed! Starting next session.`);
            }
            
            lastSessionType = data.type;
        })
        .catch(error => console.error('Error fetching timer status:', error));
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

// Format date/time
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