document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION & INITIAL CHECKS ---
    const BACKEND_URL = 'https://chatlang-backend.onrender.com';
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    function decodeToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user.id;
        } catch (e) {
            console.error('Invalid token:', e);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return null;
        }
    }
    const currentUserId = decodeToken(token);
    if (!currentUserId) return;

    // --- 2. STATE MANAGEMENT ---
    let activeRecipient = null;

    // --- 3. DOM ELEMENTS ---
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    const logoutBtn = document.getElementById('logout-btn');
    const userList = document.getElementById('user-list');
    const chatHeader = document.querySelector('.chat-header h2');
    const messageArea = document.getElementById('message-area');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatContent = document.querySelector('.chat-content');
    const usernameLink = document.getElementById('username-link');

    // --- 4. SOCKET.IO CONNECTION ---
    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
        if (currentUserId) {
            socket.emit('storeUserId', currentUserId);
        }
    });

    socket.on('privateMessage', (messageData) => {
        if (activeRecipient && messageData.senderId === activeRecipient.id) {
            displayMessage(messageData, 'received');
        }
    });

    // --- 5. FUNCTIONS ---
    async function loadCurrentUserProfile() {
        if (!usernameLink) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/profile/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const user = await res.json();
            usernameLink.textContent = user.username;
        } catch (error) {
            usernameLink.textContent = 'Profile';
        }
    }

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const isDarkMode = savedTheme === 'dark';
        body.classList.toggle('dark-mode', isDarkMode);
        if (sunIcon && moonIcon) {
            sunIcon.classList.toggle('hidden', isDarkMode);
            moonIcon.classList.toggle('hidden', !isDarkMode);
        }
    };

    const fetchAndDisplayUsers = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const users = await res.json();
            userList.innerHTML = '';
            users.forEach(user => {
                const li = document.createElement('li');
                li.className = 'user-item';
                li.dataset.id = user._id;
                li.dataset.username = user.username;
                const nativeLang = user.nativeLanguage || '?';
                const targetLang = user.targetLanguage || '?';
                li.innerHTML = `<span>${user.username} <small>(${nativeLang} -> ${targetLang})</small></span>`;
                
                li.addEventListener('click', async () => {
                    // This is the corrected line
                    document.querySelectorAll('.user-item.active').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');
                    
                    activeRecipient = { id: user._id, username: user.username };
                    chatHeader.textContent = `Chat with ${activeRecipient.username}`;
                    setChatState('chatting');
                    messageArea.innerHTML = '';

                    try {
                        const historyRes = await fetch(`${BACKEND_URL}/api/messages/${activeRecipient.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const messageHistory = await historyRes.json();
                        messageHistory.forEach(msg => {
                            const messageType = msg.senderId === currentUserId ? 'sent' : 'received';
                            displayMessage(msg, messageType);
                        });
                    } catch (error) {
                        console.error('Failed to fetch chat history:', error);
                    }
                });
                userList.appendChild(li);
            });
        } catch (error) { console.error('Error fetching users:', error); }
    };

    function displayMessage(messageData, type) {
        const div = document.createElement('div');
        div.classList.add('message', type);
        const originalText = document.createElement('p');
        originalText.textContent = messageData.originalMessage;
        div.appendChild(originalText);
        if (type === 'received' && messageData.translatedMessage && messageData.originalMessage !== messageData.translatedMessage) {
            const translatedText = document.createElement('p');
            translatedText.className = 'translation hidden';
            translatedText.textContent = messageData.translatedMessage;
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-translation';
            toggleBtn.textContent = 'See Translation';
            toggleBtn.addEventListener('click', () => {
                translatedText.classList.toggle('hidden');
                toggleBtn.textContent = translatedText.classList.contains('hidden') ? 'See Translation' : 'Hide Translation';
            });
            div.appendChild(toggleBtn);
            div.appendChild(translatedText);
        }
        messageArea.appendChild(div);
        messageArea.scrollTop = messageArea.scrollHeight;
    }
    
    const setChatState = (state) => {
        if (state === 'welcome') {
            welcomeScreen.classList.remove('hidden');
            chatContent.classList.add('hidden');
            messageInput.disabled = true;
            messageInput.placeholder = 'Select a user to start chatting...';
        } else if (state === 'chatting') {
            welcomeScreen.classList.add('hidden');
            chatContent.classList.remove('hidden');
            messageInput.disabled = false;
            messageInput.placeholder = 'Type a message...';
        }
    };
    
    // --- 6. EVENT LISTENERS ---
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        applySavedTheme();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('theme');
        window.location.href = 'login.html';
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgText = messageInput.value.trim();
        if (msgText && activeRecipient) {
            socket.emit('privateMessage', {
                recipientId: activeRecipient.id,
                message: msgText
            });
            displayMessage({ originalMessage: msgText }, 'sent');
            messageInput.value = '';
            messageInput.focus();
        } else if (!activeRecipient) {
            alert('Please select a user to chat with first.');
        }
    });

    // --- 7. INITIALIZATION ---
    loadCurrentUserProfile();
    applySavedTheme();
    fetchAndDisplayUsers();
    setChatState('welcome');
});