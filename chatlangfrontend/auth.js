document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const API_URL = 'https://chatlang-u6n3.onrender.com/api/auth'; // ✅ Added /api/auth

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const nativeLanguage = document.getElementById('native-language').value;
            const targetLanguage = document.getElementById('target-language').value;

            try {
                const res = await fetch(`${API_URL}/register`, { // ✅ Now calls /api/auth/register
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' // ✅ Added Accept header
                    },
                    body: JSON.stringify({ username, email, password, nativeLanguage, targetLanguage }),
                });
                
                // ✅ Better error handling
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.msg || 'Registration failed');
                }
                
                const data = await res.json();
                localStorage.setItem('token', data.token);
                window.location.href = 'chat.html';
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                const res = await fetch(`${API_URL}/login`, { // ✅ Now calls /api/auth/login
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' // ✅ Added Accept header
                    },
                    body: JSON.stringify({ email, password }),
                });
                
                // ✅ Better error handling
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.msg || 'Login failed');
                }
                
                const data = await res.json();
                localStorage.setItem('token', data.token);
                window.location.href = 'chat.html';
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        });
    }
});