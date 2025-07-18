const BASE_URL = 'https://pomodoro-render-deployment.onrender.com/api'; // Replace with your actual backend URL

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionList = document.getElementById('session-list');

let timerInterval;

function updateTimer() {
    fetch(`${BASE_URL}/timer_status`)
        .then(response => response.json())
        .then(data => {
            // Force integer seconds to avoid decimal issues
            const totalSeconds = Math.floor(data.remaining_time);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (totalSeconds <= 0 && data.is_running) {
                clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                loadSessions();
                alert('Pomodoro session completed!');
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
        body: JSON.stringify({ user_id: 'default_user' })
    })
    .then(response => response.json())
    .then(() => {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        timerInterval = setInterval(updateTimer, 1000);
    })
    .catch(error => {
        console.error('Error starting timer:', error);
    });
});

pauseBtn.addEventListener('click', () => {
    fetch(`${BASE_URL}/pause_timer`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(() => {
        clearInterval(timerInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    })
    .catch(error => {
        console.error('Error pausing timer:', error);
    });
});

resetBtn.addEventListener('click', () => {
    fetch(`${BASE_URL}/reset_timer`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(() => {
        clearInterval(timerInterval);
        timerDisplay.textContent = '25:00';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
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
                li.textContent = `${session.start_time} - ${session.completed ? 'Completed' : 'Incomplete'}`;
                sessionList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
        });
}

// Initialize
loadSessions();
setInterval(loadSessions, 30000); // Refresh session list every 30 seconds

// Initial timer status check
updateTimer();