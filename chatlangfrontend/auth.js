document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const API_BASE_URL = 'https://chatlang-u6n3.onrender.com'; // Your backend URL

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const nativeLanguage = document.getElementById('native-language').value;
            const targetLanguage = document.getElementById('target-language').value;

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/register`, { // ✅ Fixed URL
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password, nativeLanguage, targetLanguage }),
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

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/login`, { // ✅ Fixed URL
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
                
                localStorage.setItem('token', data.token);
                window.location.href = 'chat.html';
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        });
    }
});