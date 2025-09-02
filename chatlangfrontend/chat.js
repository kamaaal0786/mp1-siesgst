const chatBox = document.getElementById('chat-box');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const msg = msgInput.value.trim();
  if (!msg) return;

  // Create user message
  const msgEl = document.createElement('div');
  msgEl.classList.add('message', 'right');
  msgEl.innerHTML = `<span class="lang-tag en">EN</span> ${msg} <button class="translate-btn">🌐</button>`;
  chatBox.appendChild(msgEl);

  chatBox.scrollTop = chatBox.scrollHeight;
  msgInput.value = "";

  // Show typing indicator
  typingIndicator.style.display = "block";

  // Simulated reply
  setTimeout(() => {
    typingIndicator.style.display = "none";
    const reply = document.createElement('div');
    reply.classList.add('message', 'left');
    reply.innerHTML = `<span class="lang-tag es">ES</span> ¡Interesante! <button class="translate-btn">🌐</button>`;
    chatBox.appendChild(reply);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 1200);
}

// Handle translation (fake for now)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('translate-btn')) {
    const msg = e.target.parentElement;
    const translated = document.createElement('div');
    translated.style.fontSize = "12px";
    translated.style.marginTop = "5px";
    translated.style.opacity = "0.8";
    translated.textContent = "🔤 Translation: (demo)";
    msg.appendChild(translated);
    e.target.disabled = true; // prevent multiple translations
  }
});
document.getElementById("toggle-sidebar")?.addEventListener("click", () => {
  document.querySelector(".user-list").classList.toggle("show");
});
// When user is clicked, show chat window
document.querySelectorAll('.user-list li').forEach(user => {
  user.addEventListener('click', () => {
    document.querySelector('.chat-window').classList.remove('hidden');
    document.querySelector('.placeholder')?.remove();
  });
});
document.querySelector('.end-chat').addEventListener('click', () => {
  const chatWindow = document.querySelector('.chat-window');
  
  // Hide chat content again
  chatWindow.classList.add('hidden');

  // Add back placeholder if not present
  if (!document.querySelector('.placeholder')) {
    const placeholder = document.createElement('p');
    placeholder.classList.add('placeholder');
    placeholder.textContent = "👋 Select a user to start chatting";
    chatWindow.prepend(placeholder);
  }
});
const typing = document.getElementById("typing-indicator");
document.getElementById("msg-input").addEventListener("input", () => {
  typing.style.display = "block";
  setTimeout(() => typing.style.display = "none", 2000);
});
