document.addEventListener('DOMContentLoaded', () => {
// --- 1. INITIAL CHECKS & SETUP ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }    // Helper function to get user ID from the JWT payload
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
    if (!currentUserId) return; // Stop if token is invalid
     async function loadCurrentUserProfile() {
        const usernameLink = document.getElementById('username-link');
        if (!usernameLink) return;

        try {
            const res = await fetch('http://localhost:5000/api/profile/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            
            const user = await res.json();
            usernameLink.textContent = user.username;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // The link text will just remain "ChatLang" on error
        }
    }

    // --- 2. STATE MANAGEMENT ---
    let activeRecipient = null; // To track who we are chatting with

    // --- 3. DOM ELEMENTS ---
    const body = document.body;
    const themeToggleButton = document.getElementById('theme-toggle-btn');
const sunIcon = themeToggleButton.querySelector('.fa-sun');
const moonIcon = themeToggleButton.querySelector('.fa-moon');
    const logoutBtn = document.getElementById('logout-btn');
    const userList = document.getElementById('user-list');
    const chatHeader = document.querySelector('.chat-header h2');
    const messageArea = document.getElementById('message-area');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    messageInput.disabled = true;
messageInput.placeholder = 'Select a user to start chatting...';
    chatHeader.textContent = 'Begin your chat!';

 // --- 4. SOCKET.IO CONNECTION ---
    const socket = io('http://localhost:5000');
    
    // A) Tell the server who we are once connected
    socket.on('connect', () => {
        console.log('Connected to server with socket ID:', socket.id);
        socket.emit('storeUserId', currentUserId);
    });
     // B) Listen for incoming private messages (UPDATED)
    socket.on('privateMessage', (messageData) => {
        console.log('--- RECEIVED MESSAGE DATA FROM SERVER ---', messageData);
        // Only display the message if it's from the person we're actively chatting with
        if (activeRecipient && messageData.senderId === activeRecipient.id) {
            displayMessage(messageData, 'received');
        }
    });
    
    // --- 5. FUNCTIONS ---
     // Function to apply the saved theme from localStorage
    const applySavedTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        body.classList.remove('dark-mode');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
};
    // Function to fetch users and make the list interactive
   const fetchAndDisplayUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/users', {
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
                li.innerHTML = `<span>${user.username} <small>(${user.nativeLanguage} -> ${user.targetLanguage})</small></span>`;
                
                // This entire click listener is updated
                li.addEventListener('click', async () => { // Make the function async
                    document.querySelectorAll('.user-item.active').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');
                    activeRecipient = { id: user._id, username: user.username };
                    chatHeader.textContent = `Chat with ${activeRecipient.username}`;
                    messageInput.disabled = false;
messageInput.placeholder = 'Type a message...';
                    messageArea.innerHTML = ''; // Clear the message area first

                    // --- NEW: Fetch and display chat history ---
                    try {
                        const historyRes = await fetch(`http://localhost:5000/api/messages/${activeRecipient.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const messageHistory = await historyRes.json();
                        
                        // Loop through the history and display each message
                        messageHistory.forEach(msg => {
                            const messageType = msg.senderId === currentUserId ? 'sent' : 'received';
                            displayMessage(msg, messageType);
                        });
                    } catch (error) {
                        console.error('Failed to fetch chat history:', error);
                    }
                    // --- END NEW ---
                });
                userList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
     // Function to create and display a message bubble (UPDATED)
   function displayMessage(messageData, type) {
    const div = document.createElement('div');
    div.classList.add('message', type);
    
    const originalText = document.createElement('p');
    originalText.textContent = messageData.originalMessage;
    div.appendChild(originalText);

    // This condition is now corrected to only apply to received messages
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
   // --- 6. EVENT LISTENERS ---
    // Listener for the theme toggle switch
    themeToggleButton.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
     if (isDarkMode) {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
});
 // Listener for the logout button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('theme'); 
        window.location.href = 'login.html';
    });
// Listener for sending a message (UPDATED)
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgText = messageInput.value.trim();

        if (msgText && activeRecipient) {
            socket.emit('privateMessage', { 
                recipientId: activeRecipient.id, 
                message: msgText 
            });
            
            // Display your own sent message
            displayMessage({ originalMessage: msgText, translatedMessage: null }, 'sent');
            
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
});