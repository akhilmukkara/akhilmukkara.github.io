const BASE_URL = 'https://pomodoro-render-deployment.onrender.com/api';
const timerDisplay = document.getElementById('timer-display');
const sessionType = document.getElementById('session-type');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionList = document.getElementById('session-list');

let timerInterval;
let isRunning = false;

// ... (generateUserId and USER_ID unchanged)

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
            
            if (!isRunning && totalSeconds < data.duration && totalSeconds > 0) {  // Use data.duration for resume check
                startBtn.textContent = 'Resume';
            } else {
                startBtn.textContent = 'Start';
            }

            // Update type display
            sessionType.textContent = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Session`;
            sessionType.className = data.type;  // For CSS colors
            
            if (totalSeconds <= 0 && data.is_running) {
                clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                loadSessions();
                alert(`${data.type.charAt(0).toUpperCase() + data.type.slice(1)} session completed! Starting next session.`);
            }
        })
        .catch(error => {
            console.error('Error fetching timer status:', error);
        });
}

// ... (startBtn event: unchanged, but backend now handles type)

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
                const type = session.type.charAt(0).toUpperCase() + session.type.slice(1);
                
                li.textContent = `${type} (${formattedDate}) - ${startTime} to ${endTime} - ${status}`;
                sessionList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
        });
}

// ... (formatDate and formatTime unchanged)

// Initialize
loadSessions();
setInterval(loadSessions, 30000);
updateTimer();
timerInterval = setInterval(updateTimer, 1000);  // Start polling immediately
