const BASE_URL = 'https://pomodoro-render-deployment.onrender.com/api';
const timerDisplay = document.getElementById('timer-display');
const sessionType = document.getElementById('session-type');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionList = document.getElementById('session-list');

let timerInterval;
let isRunning = false;

// Generate a unique user ID for this session
function generateUserId() {
    let userId = localStorage.getItem('pomodoro_user_id');
    
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('pomodoro_user_id', userId);
    }
    
    return userId;
}

const USER_ID = generateUserId();

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

            // Update type display (handle 'long_break')
            let displayType = data.type.charAt(0).toUpperCase() + data.type.slice(1);
            if (data.type === 'long_break') {
                displayType = 'Long Break';
            }
            sessionType.textContent = `${displayType} Session`;
            sessionType.className = data.type;  // For CSS colors
            
            if (totalSeconds <= 0 && data.is_running) {
                clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                loadSessions();
                alert(`${displayType} session completed! Starting next session.`);
            }
        })
        .catch(error => {
            console.error('Error fetching timer status:', error);
        });
}

startBtn.addEventListener('click', () => {
    fetch(`${BASE_URL}/start_timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
    })
    .then(response => response.json())
    .then(() => {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        startBtn.textContent = 'Start';
        
        updateTimer();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
    })
    .catch(error => {
        console.error('Error starting timer:', error);
    });
});

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
                let typeDisplay = session.type.charAt(0).toUpperCase() + session.type.slice(1);
                if (session.type === 'long_break') {
                    typeDisplay = 'Long Break';
                }
                
                li.textContent = `${typeDisplay} (${formattedDate}) - ${startTime} to ${endTime} - ${status}`;
                sessionList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
        });
}

function formatDate(date) {
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).split(',')[0];  // e.g., "28/07/2025"
}

function formatTime(date) {
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });  // e.g., "20:10"
}

// Initialize
loadSessions();
setInterval(loadSessions, 30000);
updateTimer();
timerInterval = setInterval(updateTimer, 1000);