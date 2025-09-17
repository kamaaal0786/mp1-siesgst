// chat.js (Updated)

document.addEventListener('DOMContentLoaded', () => {
    // --- Page Protection ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Theme Management ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Function to apply the saved theme on page load
    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    };

    // Event listener for the theme toggle
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // Apply theme when the page loads
    applySavedTheme();


    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            // We also remove the theme preference on logout
            localStorage.removeItem('theme');
            window.location.href = 'login.html';
        });
    }

    // --- Placeholder for future chat logic ---
    // 1. Connect to the Socket.IO server
    const socket = io('http://localhost:5000');

    // Get DOM elements for the chat
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messageArea = document.getElementById('message-area');

    // 2. Handle sending messages
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload

        const msgText = messageInput.value.trim();
        if (msgText) {
            // Send the message to the server
            socket.emit('chatMessage', msgText);

            // Display the message you just sent
            displayMessage(msgText, 'sent');

            messageInput.value = ''; // Clear the input field
            messageInput.focus();
        }
    });

    // 3. Handle receiving messages
    socket.on('chatMessage', (msg) => {
        // Display the incoming message from others
        displayMessage(msg, 'received');
    });

    // Helper function to create and append a message bubble
    function displayMessage(message, type) {
        const div = document.createElement('div');
        div.classList.add('message', type); // e.g., <div class="message sent">

        const p = document.createElement('p');
        p.textContent = message;

        div.appendChild(p);
        messageArea.appendChild(div);

        // Auto-scroll to the latest message
        messageArea.scrollTop = messageArea.scrollHeight;
    }
});