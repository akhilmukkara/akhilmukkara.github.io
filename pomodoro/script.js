// Configuration - Backend URL Setting
        let BASE_URL = localStorage.getItem('pomodoroBackendUrl') || '';
        
        // Show backend URL modal if not set
        if (!BASE_URL) {
            showBackendUrlModal();
        }
        
        // DOM Elements
        const timerDisplay = document.getElementById('timer-display');
        const sessionType = document.getElementById('session-type');
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const skipBtn = document.getElementById('skip-btn');
        const sessionList = document.getElementById('session-list');
        const progressCircle = document.getElementById('progress-circle');
        const soundToggle = document.getElementById('sound-toggle');
        const settingsToggle = document.getElementById('settings-toggle');
        const connectionStatus = document.getElementById('connection-status');
        const backendModal = document.getElementById('backend-modal');
        const backendUrlInput = document.getElementById('backend-url-input');
        
        const workTimeInput = document.getElementById('work-time');
        const shortBreakInput = document.getElementById('short-break');
        const longBreakInput = document.getElementById('long-break');
        
        const completedTodayEl = document.getElementById('completed-today');
        const currentStreakEl = document.getElementById('current-streak');
        const totalSessionsEl = document.getElementById('total-sessions');

        // State
        let timerInterval;
        let isRunning = false;
        let currentSession = 'work';
        let completedPomodoros = 0;
        let soundEnabled = true;
        let totalTime = 25 * 60;
        let remainingTime = 25 * 60;
        let offlineMode = false;
        let offlineSessions = JSON.parse(localStorage.getItem('offlineSessions') || '[]');

        // Backend URL and Connection Management
        function showBackendUrlModal() {
            backendModal.classList.remove('hidden');
            backendUrlInput.value = BASE_URL;
        }

        function hideBackendUrlModal() {
            backendModal.classList.add('hidden');
        }

        async function testConnection() {
            const url = backendUrlInput.value.trim();
            if (!url) {
                alert('Please enter a backend URL');
                return;
            }

            const testResult = document.getElementById('connection-test-result');
            testResult.innerHTML = '<div style="color: #FF9800;">Testing connection...</div>';

            try {
                const response = await fetch(`${url}/timer_status`);
                if (response.ok) {
                    BASE_URL = url;
                    localStorage.setItem('pomodoroBackendUrl', BASE_URL);
                    offlineMode = false;
                    testResult.innerHTML = '<div style="color: #4CAF50;">✅ Connection successful!</div>';
                    updateConnectionStatus('connected');
                    setTimeout(() => {
                        hideBackendUrlModal();
                    }, 1500);
                } else {
                    throw new Error('Backend responded with error');
                }
            } catch (error) {
                testResult.innerHTML = '<div style="color: #f44336;">❌ Connection failed. Check your URL.</div>';
                updateConnectionStatus('disconnected');
            }
        }

        function useOfflineMode() {
            offlineMode = true;
            BASE_URL = '';
            localStorage.removeItem('pomodoroBackendUrl');
            updateConnectionStatus('offline');
            hideBackendUrlModal();
        }

        function updateConnectionStatus(status) {
            connectionStatus.classList.remove('hidden');
            connectionStatus.className = 'connection-status';
            
            switch (status) {
                case 'connected':
                    connectionStatus.classList.add('connected');
                    connectionStatus.textContent = 'Connected';
                    break;
                case 'disconnected':
                    connectionStatus.classList.add('disconnected');
                    connectionStatus.textContent = 'Disconnected';
                    break;
                case 'offline':
                    connectionStatus.classList.add('testing');
                    connectionStatus.textContent = 'Offline Mode';
                    break;
                case 'testing':
                    connectionStatus.classList.add('testing');
                    connectionStatus.textContent = 'Testing...';
                    break;
            }
        }

        // Offline Timer Management
        let offlineTimer = null;

        function startOfflineTimer() {
            if (offlineTimer) clearInterval(offlineTimer);
            
            offlineTimer = setInterval(() => {
                if (remainingTime > 0) {
                    remainingTime--;
                    updateDisplay();
                } else {
                    clearInterval(offlineTimer);
                    playNotification();
                    
                    // Save completed session
                    const session = {
                        start_time: new Date(Date.now() - (totalTime * 1000)).toISOString(),
                        completed: true,
                        session_type: currentSession
                    };
                    offlineSessions.push(session);
                    localStorage.setItem('offlineSessions', JSON.stringify(offlineSessions));
                    
                    const sessionName = currentSession === 'work' ? 'Pomodoro' : 'Break';
                    if (Notification.permission === 'granted') {
                        new Notification(`${sessionName} completed!`, {
                            body: 'Time to switch sessions.',
                            icon: '/favicon.ico'
                        });
                    } else {
                        alert(`${sessionName} completed!`);
                    }
                    
                    nextSession();
                    loadSessions();
                    updateStats();
                    
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                    isRunning = false;
                }
            }, 1000);
        }
        // Progress circle setup
        const circumference = 2 * Math.PI * 90;
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;

        // Sound notification
        function playNotification() {
            if (!soundEnabled) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        function updateProgressCircle(remaining, total) {
            const progress = (total - remaining) / total;
            const offset = circumference - progress * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        function updateSessionType() {
            const types = {
                'work': 'Work Session',
                'short-break': 'Short Break',
                'long-break': 'Long Break'
            };
            sessionType.textContent = types[currentSession] || 'Work Session';
            
            // Update progress circle color
            progressCircle.className = 'progress-ring__progress';
            if (currentSession === 'short-break') {
                progressCircle.classList.add('break');
            } else if (currentSession === 'long-break') {
                progressCircle.classList.add('long-break');
            }
        }

        function getSessionDuration() {
            switch (currentSession) {
                case 'work': return parseInt(workTimeInput.value) * 60;
                case 'short-break': return parseInt(shortBreakInput.value) * 60;
                case 'long-break': return parseInt(longBreakInput.value) * 60;
                default: return 25 * 60;
            }
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        function updateDisplay() {
            timerDisplay.textContent = formatTime(remainingTime);
            updateProgressCircle(remainingTime, totalTime);
        }

        function nextSession() {
            if (currentSession === 'work') {
                completedPomodoros++;
                if (completedPomodoros % 4 === 0) {
                    currentSession = 'long-break';
                } else {
                    currentSession = 'short-break';
                }
            } else {
                currentSession = 'work';
            }
            
            totalTime = getSessionDuration();
            remainingTime = totalTime;
            updateSessionType();
            updateDisplay();
        }

        async function updateTimer() {
            if (offlineMode) {
                // In offline mode, we manage the timer locally
                updateDisplay();
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/timer_status`);
                const data = await response.json();
                
                remainingTime = Math.floor(data.remaining_time);
                isRunning = data.is_running;
                
                updateDisplay();
                
                startBtn.disabled = isRunning;
                pauseBtn.disabled = !isRunning;
                startBtn.textContent = (!isRunning && remainingTime < totalTime && remainingTime > 0) ? 'Resume' : 'Start';
                
                if (remainingTime <= 0 && data.is_running) {
                    clearInterval(timerInterval);
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                    playNotification();
                    
                    // Show completion message
                    const sessionName = currentSession === 'work' ? 'Pomodoro' : 'Break';
                    if (Notification.permission === 'granted') {
                        new Notification(`${sessionName} completed!`, {
                            body: 'Time to switch sessions.',
                            icon: '/favicon.ico'
                        });
                    } else {
                        alert(`${sessionName} completed!`);
                    }
                    
                    nextSession();
                    loadSessions();
                    updateStats();
                }
                
                updateConnectionStatus('connected');
            } catch (error) {
                console.error('Error fetching timer status:', error);
                updateConnectionStatus('disconnected');
            }
        }

        async function startTimer() {
            if (offlineMode) {
                isRunning = true;
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                startOfflineTimer();
                return;
            }

            try {
                await fetch(`${BASE_URL}/start_timer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: 'default_user' })
                });
                
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                startBtn.textContent = 'Start';
                
                updateTimer();
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(updateTimer, 1000);
                updateConnectionStatus('connected');
            } catch (error) {
                console.error('Error starting timer:', error);
                updateConnectionStatus('disconnected');
            }
        }

        async function pauseTimer() {
            if (offlineMode) {
                if (offlineTimer) clearInterval(offlineTimer);
                isRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                return;
            }

            try {
                await fetch(`${BASE_URL}/pause_timer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (timerInterval) clearInterval(timerInterval);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                updateTimer();
                updateConnectionStatus('connected');
            } catch (error) {
                console.error('Error pausing timer:', error);
                updateConnectionStatus('disconnected');
            }
        }

        async function resetTimer() {
            if (offlineMode) {
                if (offlineTimer) clearInterval(offlineTimer);
                isRunning = false;
                totalTime = getSessionDuration();
                remainingTime = totalTime;
                currentSession = 'work';
                
                updateSessionType();
                updateDisplay();
                
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                startBtn.textContent = 'Start';
                return;
            }

            try {
                await fetch(`${BASE_URL}/reset_timer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (timerInterval) clearInterval(timerInterval);
                
                totalTime = getSessionDuration();
                remainingTime = totalTime;
                currentSession = 'work';
                
                updateSessionType();
                updateDisplay();
                
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                startBtn.textContent = 'Start';
                updateConnectionStatus('connected');
            } catch (error) {
                console.error('Error resetting timer:', error);
                updateConnectionStatus('disconnected');
            }
        }

        async function skipSession() {
            if (timerInterval) clearInterval(timerInterval);
            nextSession();
            
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.textContent = 'Start';
            
            // Reset backend timer
            await resetTimer();
        }

        async function loadSessions() {
            if (offlineMode) {
                sessionList.innerHTML = '';
                offlineSessions.slice(-10).reverse().forEach(session => {
                    const sessionItem = document.createElement('div');
                    sessionItem.className = 'session-item';
                    
                    const timeEl = document.createElement('div');
                    timeEl.className = 'session-time';
                    timeEl.textContent = new Date(session.start_time).toLocaleString();
                    
                    const statusEl = document.createElement('div');
                    statusEl.className = `session-status ${session.completed ? 'completed' : 'incomplete'}`;
                    statusEl.textContent = session.completed ? 'Completed' : 'Incomplete';
                    
                    sessionItem.appendChild(timeEl);
                    sessionItem.appendChild(statusEl);
                    sessionList.appendChild(sessionItem);
                });
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/sessions?user_id=default_user`);
                const sessions = await response.json();
                
                sessionList.innerHTML = '';
                sessions.slice(-10).reverse().forEach(session => {
                    const sessionItem = document.createElement('div');
                    sessionItem.className = 'session-item';
                    
                    const timeEl = document.createElement('div');
                    timeEl.className = 'session-time';
                    timeEl.textContent = new Date(session.start_time).toLocaleString();
                    
                    const statusEl = document.createElement('div');
                    statusEl.className = `session-status ${session.completed ? 'completed' : 'incomplete'}`;
                    statusEl.textContent = session.completed ? 'Completed' : 'Incomplete';
                    
                    sessionItem.appendChild(timeEl);
                    sessionItem.appendChild(statusEl);
                    sessionList.appendChild(sessionItem);
                });
                updateConnectionStatus('connected');
            } catch (error) {
                console.error('Error loading sessions:', error);
                updateConnectionStatus('disconnected');
            }
        }

        function updateStats() {
            let todayCount = 0;
            let totalCount = 0;
            const today = new Date().toDateString();
            
            if (offlineMode) {
                offlineSessions.forEach(session => {
                    if (session.completed) {
                        totalCount++;
                        if (new Date(session.start_time).toDateString() === today) {
                            todayCount++;
                        }
                    }
                });
            } else {
                // In online mode, you'd want to modify your backend to provide these stats
                // For now, we'll use local approximations
            }
            
            completedTodayEl.textContent = todayCount;
            currentStreakEl.textContent = completedPomodoros % 4;
            totalSessionsEl.textContent = totalCount;
        }

        // Event listeners
        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);
        skipBtn.addEventListener('click', skipSession);

        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
        });

        settingsToggle.addEventListener('click', () => {
            showBackendUrlModal();
        });

        // Make functions global for modal buttons
        window.testConnection = testConnection;
        window.useOfflineMode = useOfflineMode;

        // Settings change handlers
        [workTimeInput, shortBreakInput, longBreakInput].forEach(input => {
            input.addEventListener('change', () => {
                if (!isRunning && currentSession === 'work') {
                    totalTime = getSessionDuration();
                    remainingTime = totalTime;
                    updateDisplay();
                }
            });
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Initialize
        updateSessionType();
        updateDisplay();
        loadSessions();
        updateStats();
        
        if (BASE_URL && !offlineMode) {
            updateTimer();
            updateConnectionStatus('connected');
        } else if (offlineMode) {
            updateConnectionStatus('offline');
        }
        
        // Auto-refresh sessions
        setInterval(() => {
            if (!offlineMode && BASE_URL) {
                loadSessions();
            }
        }, 30000);
    