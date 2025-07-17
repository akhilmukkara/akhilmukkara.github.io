document.addEventListener('DOMContentLoaded', () => {
   // alert('Script loaded successfully!');

    const BASE_URL = 'pomodoro-render-deployment.onrender.com/api'; // Replace with your Render backend URL
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const sessionList = document.getElementById('session-list');
    let timerInterval;

    if (!timerDisplay || !startBtn || !pauseBtn || !resetBtn || !sessionList) {
       // alert('One or more DOM elements not found!');
        return;
    }

   // alert('DOM elements found, setting up event listeners...');

    function updateTimer() {
       // alert('Updating timer...');
        fetch(`${BASE_URL}/timer_status`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok ' + response.status);
                return response.json();
            })
            .then(data => {
                //alert('Timer data received: ' + JSON.stringify(data));
                const totalSeconds = Math.floor(data.remaining_time);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                if (totalSeconds === 0 && data.is_running) {
                    clearInterval(timerInterval);
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                    loadSessions();
                    //alert('Pomodoro completed!');
                }
            })
            .catch(error => alert('Timer update error: ' + error.message));
    }

    startBtn.addEventListener('click', () => {
        //alert('Start button clicked!');
        fetch(`${BASE_URL}/start_timer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 'default_user' })
        })
        .then(response => {
            if (!response.ok) throw new Error('Start request failed with status ' + response.status);
            //alert('Start request successful! Status: ' + response.status);
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            timerInterval = setInterval(updateTimer, 1000);
        })
        .catch(error => alert('Start error: ' + error.message));
    });

    pauseBtn.addEventListener('click', () => {
       //alert('Pause button clicked!');
        fetch(`${BASE_URL}/pause_timer`, { method: 'POST' })
            .then(response => {
                if (!response.ok) throw new Error('Pause request failed with status ' + response.status);
               // alert('Pause request successful! Status: ' + response.status);
                clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            })
            .catch(error => alert('Pause error: ' + error.message));
    });

    resetBtn.addEventListener('click', () => {
       // alert('Reset button clicked!');
        fetch(`${BASE_URL}/reset_timer`, { method: 'POST' })
            .then(response => {
                if (!response.ok) throw new Error('Reset request failed with status ' + response.status);
                alert('Reset request successful! Status: ' + response.status);
                clearInterval(timerInterval);
                timerDisplay.textContent = '25:00';
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            })
            .catch(error => alert('Reset error: ' + error.message));
    });

    function loadSessions() {
        //alert('Loading sessions...');
        fetch(`${BASE_URL}/sessions?user_id=default_user`)
            .then(response => {
                if (!response.ok) throw new Error('Sessions request failed with status ' + response.status);
                return response.json();
            })
            .then(sessions => {
               // alert('Sessions data received: ' + JSON.stringify(sessions));
                sessionList.innerHTML = '';
                sessions.forEach(session => {
                    const li = document.createElement('li');
                    li.textContent = `${session.start_time} - ${session.completed ? 'Completed' : 'Incomplete'}`;
                    sessionList.appendChild(li);
                });
            })
            .catch(error => alert('Sessions error: ' + error.message));
    }

    loadSessions();
    setInterval(loadSessions, 30000); // Refresh every 30 seconds
    //alert('Setup complete, ready to use!');
});