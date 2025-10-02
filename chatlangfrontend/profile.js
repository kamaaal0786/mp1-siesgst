// profile.js
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_URL = 'http://localhost:5000/api/profile/me';
    const form = document.getElementById('profile-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const nativeLangSelect = document.getElementById('native-language');
    const targetLangSelect = document.getElementById('target-language');

    const languages = [
    'English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 
    'Portuguese', 'Russian', 'Japanese', 'Arabic', 'Italian'
];

    // Function to populate select options
    function populateLanguages(selectElement, selectedLang, defaultText) {
        selectElement.innerHTML = `<option value="" disabled>${defaultText}</option>`;
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            if (lang === selectedLang) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    // 1. Fetch and display current user data
    async function loadProfile() {
        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = await res.json();

            usernameInput.value = user.username;
            emailInput.value = user.email;
            populateLanguages(nativeLangSelect, user.nativeLanguage, 'Select Native Language');
            populateLanguages(targetLangSelect, user.targetLanguage, 'Select Target Language');

        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    // 2. Handle form submission to update profile
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: usernameInput.value,
                    nativeLanguage: nativeLangSelect.value,
                    targetLanguage: targetLangSelect.value
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update profile');
            }
            alert('Profile updated successfully!');

        } catch (error) {
            console.error('Update error:', error);
            alert('Error updating profile.');
        }
    });

    loadProfile();
});