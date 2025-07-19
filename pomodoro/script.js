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
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(remainingTime);
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        const startTime = new Date().toLocaleString();
        
        timerInterval = setInterval(() => {
            remainingTime--;
            updateDisplay();
            
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                
                // Add completed session to history
                sessions.unshift({
                    startTime: startTime,
                    endTime: new Date().toLocaleString(),
                    completed: true
                });
                updateSessionHistory();
                
                alert('Pomodoro session completed!');
                resetTimer();
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        // Change start button text to "Resume"
        startBtn.textContent = remainingTime < 25 * 60 ? 'Resume' : 'Start';
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    remainingTime = 25 * 60;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = 'Start';
    updateDisplay();
}

function updateSessionHistory() {
    sessionList.innerHTML = '';
    sessions.slice(0, 10).forEach(session => { // Show last 10 sessions
        const li = document.createElement('li');
        li.textContent = `${session.startTime} - ${session.completed ? 'Completed' : 'Incomplete'}`;
        sessionList.appendChild(li);
    });
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize
updateDisplay();
updateSessionHistory();