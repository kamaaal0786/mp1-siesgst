// chat.js (Corrected)
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
    let activeRecipient = null; // Will store { id, username, nativeLanguage }
    let currentUser = null; // Will store current user's profile info

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
    const chatContent = document.getElementById('chat-content');
    const userProfileName = document.getElementById('user-profile-name');
    const userProfileLang = document.getElementById('user-profile-lang');
    
    // --- 4. SOCKET.IO INITIALIZATION ---
    const socket = io(BACKEND_URL, {
      query: { userId: currentUserId }
    });

    // --- 5. FUNCTIONS ---

    // Apply saved theme from localStorage
    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'inline-block';
        } else {
            body.classList.remove('dark-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline-block';
        }
    };

    // Fetch and display the current user's profile
    const loadCurrentUserProfile = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            
            currentUser = await response.json();
            userProfileName.textContent = currentUser.username;
            userProfileLang.textContent = currentUser.nativeLanguage;
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };
    
    // Fetch and render the list of other users
    const loadUsers = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const users = await response.json();
            userList.innerHTML = ''; // Clear placeholder or old list
            
            users.forEach(user => {
                const li = document.createElement('li');
                li.dataset.userId = user._id;
                li.dataset.username = user.username;
                li.dataset.lang = user.nativeLanguage;
                li.innerHTML = `
                    <img src="https://i.pravatar.cc/40?u=${user._id}" alt="${user.username}" class="avatar">
                    <div class="user-info">
                        <span class="username">${user.username}</span>
                        <span class="language">${user.nativeLanguage}</span>
                    </div>
                `;
                li.addEventListener('click', () => selectUserForChat(li, user));
                userList.appendChild(li);
            });

        } catch (error) {
            console.error('Error loading users:', error);
            userList.innerHTML = '<li>Failed to load users.</li>';
        }
    };
    
    const selectUserForChat = (liElement, user) => {
        // Update active recipient
        activeRecipient = {
            id: user._id,
            username: user.username,
            nativeLanguage: user.nativeLanguage
        };
        
        // Update UI
        chatHeader.textContent = `Chat with ${user.username}`;
        
        // Highlight active user
        document.querySelectorAll('#user-list li').forEach(li => li.classList.remove('active'));
        liElement.classList.add('active');

        // Clear previous messages and show chat
        messageArea.innerHTML = '';
        updateChatState('chatting');
        
        // Fetch message history
        loadMessageHistory(user._id);
    };

    const loadMessageHistory = async (recipientId) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/messages/${recipientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch messages');
            const messages = await response.json();
            messages.forEach(msg => {
                const type = msg.senderId === currentUserId ? 'sent' : 'received';
                displayMessage(msg, type);
            });
        } catch (error) {
            console.error('Error loading message history:', error);
        }
    }

    // Display a single message in the chat area
    const displayMessage = (msg, type) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        
        const messageContent = (type === 'sent') 
            ? msg.originalMessage 
            : `${msg.translatedMessage} <em>(${msg.originalMessage})</em>`;

        messageElement.innerHTML = `<p>${messageContent}</p>`;
        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;
    };
    
    // Update the UI between welcome screen and chat screen
    const updateChatState = (state) => {
        if (state === 'welcome') {
            welcomeScreen.classList.remove('hidden');
            chatContent.classList.add('hidden');
            messageInput.disabled = true;
            messageInput.placeholder = 'Select a user to start chatting';
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
    
    // Listen for incoming messages from the server
    socket.on('privateMessage', (msg) => {
        // Only display if the message is from the currently active chat partner
        if (activeRecipient && msg.senderId === activeRecipient.id) {
            displayMessage(msg, 'received');
        }
    });

    // --- 7. INITIALIZATION ---
    loadCurrentUserProfile();
    loadUsers(); // <-- This is the new function call to populate the sidebar
    applySavedTheme();
    updateChatState('welcome'); // Start with the welcome screen
});