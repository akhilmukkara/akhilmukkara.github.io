document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://your-pomodoro-app.onrender.com'; // Replace with your actual Render URL
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const sessionList = document.getElementById('session-list');
    let timerInterval;

    if (!timerDisplay || !startBtn || !pauseBtn || !resetBtn || !sessionList) {
        return;
    }

    function updateTimer() {
        fetch(`${BASE_URL}/timer_status`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok ' + response.status);
                return response.json();
            })
            .then(data => {
                const totalSeconds = Math.floor(data.remaining_time);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                if (totalSeconds === 0 && data.is_running) {
                    clearInterval(timerInterval);
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                    loadSessions();
                }
            })
            .catch(error => console.error('Timer update error:', error.message));
    }

    startBtn.addEventListener('click', () => {
        fetch(`${BASE_URL}/start_timer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 'default_user' })
        })
        .then(response => {
            if (!response.ok) throw new Error('Start request failed with status ' + response.status);
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            timerInterval = setInterval(updateTimer, 1000);
        })
        .catch(error => console.error('Start error:', error.message));
    });

    pauseBtn.addEventListener('click', () => {
        fetch(`${BASE_URL}/pause_timer`, { method: 'POST' })
            .then(response => {
                if (!response.ok) throw new Error('Pause request failed with status ' + response.status);
                clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            })
            .catch(error => console.error('Pause error:', error.message));
    });

    resetBtn.addEventListener('click', () => {
        fetch(`${BASE_URL}/reset_timer`, { method: 'POST' })
            .then(response => {
                if (!response.ok) throw new Error('Reset request failed with status ' + response.status);
                clearInterval(timerInterval);
                timerDisplay.textContent = '25:00';
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            })
            .catch(error => console.error('Reset error:', error.message));
    });

    function loadSessions() {
        fetch(`${BASE_URL}/sessions?user_id=default_user`)
            .then(response => {
                if (!response.ok) throw new Error('Sessions request failed with status ' + response.status);
                return response.json();
            })
            .then(sessions => {
                sessionList.innerHTML = '';
                sessions.forEach(session => {
                    const li = document.createElement('li');
                    li.textContent = `${session.start_time} - ${session.completed ? 'Completed' : 'Incomplete'}`;
                    sessionList.appendChild(li);
                });
            })
            .catch(error => console.error('Sessions error:', error.message));
    }

    loadSessions();
    setInterval(loadSessions, 30000); // Refresh every 30 seconds
});