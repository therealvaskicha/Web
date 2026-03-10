let captchaText = '';
let csrfToken = '';

function generateCaptcha() {
    const canvas = document.getElementById('captcha-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 150;
    canvas.height = 50;

    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate random text
    captchaText = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Draw text with noise
    ctx.font = '30px Arial';
    ctx.fillStyle = '#333';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Add noise
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = '#999';
        ctx.stroke();
    }

    // Draw text
    ctx.fillText(captchaText, canvas.width/2, canvas.height/2);
}

// Fetch CSRF token on page load
async function getCsrfToken() {
    try {
        const response = await fetch('/api/csrf-token');
        if (response.ok) {
            const data = await response.json();
            csrfToken = data.token;
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

document.getElementById('refresh-captcha').onclick = generateCaptcha;
document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();
    getCsrfToken();
});

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const captchaInput = document.getElementById('captcha-input').value;
    const errorDiv = document.getElementById('error-message') || createErrorDiv();
    const submitBtn = document.getElementById('login-form').querySelector('button[type="submit"]');

    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';

    // Validate inputs
    if (!username || !password || !captchaInput) {
        showError('Всички полета са задължителни', errorDiv);
        return;
    }

    if (captchaInput.toUpperCase() !== captchaText) {
        showError('Неправилен проверочен код. Опитайте отново.', errorDiv);
        generateCaptcha();
        return;
    }

    // Disable button to prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Влизане...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/admin.html';
        } else {
            const data = await response.json();
            showError(data.error || 'Грешка при вход', errorDiv);
            generateCaptcha();
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Мрежна грешка. Проверете интернет връзката и опитайте отново.', errorDiv);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Вход';
    }
};

function createErrorDiv() {
    const div = document.createElement('div');
    div.id = 'error-message';
    div.style.color = '#d32f2f';
    div.style.marginBottom = '15px';
    div.style.padding = '10px';
    div.style.border = '1px solid #d32f2f';
    div.style.borderRadius = '4px';
    div.style.backgroundColor = '#ffebee';
    div.style.display = 'none';
    
    const form = document.getElementById('login-form');
    form.parentNode.insertBefore(div, form);
    
    return div;
}

function showError(message, errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}