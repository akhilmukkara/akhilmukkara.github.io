const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionList = document.getElementById('session-list');

let timerInterval;
let remainingTime = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let sessions = [];

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(remainingTime);
}

function updateTimer() {
    if (remainingTime > 0) {
        remainingTime--;
        updateDisplay();
    } else {
        // Timer finished
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        // Add completed session
        const now = new Date();
        sessions.push({
            start_time: now.toLocaleString(),
            completed: true
        });
        updateSessionList();
        
        alert('Pomodoro session completed!');
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timerInterval = setInterval(updateTimer, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    remainingTime = 25 * 60;
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function updateSessionList() {
    sessionList.innerHTML = '';
    sessions.forEach(session => {
        const li = document.createElement('li');
        li.textContent = `${session.start_time} - ${session.completed ? 'Completed' : 'Incomplete'}`;
        sessionList.appendChild(li);
    });
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize display
updateDisplay();