// auth.js (Updated Version)

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    // The base URL for your backend API
    const API_URL = 'https://chatlang-backend.onrender.com/api/auth';

    // --- Handle Registration ---
    // auth.js

// --- Handle Registration ---
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Get all form values, including the new language selections
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const nativeLanguage = document.getElementById('native-language').value;
        const targetLanguage = document.getElementById('target-language').value;

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // 2. Include the languages in the body of the request
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password, 
                    nativeLanguage, 
                    targetLanguage 
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Registration failed');
            }

            localStorage.setItem('token', data.token);
            window.location.href = 'chat.html';

        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    });
}

    // --- Handle Login ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Send a POST request to the /login endpoint
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Login failed');
                }

                // If successful, save the token and redirect
                localStorage.setItem('token', data.token);
                window.location.href = 'chat.html';

            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        });
    }
});