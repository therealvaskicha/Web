let captchaText = '';

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

document.getElementById('refresh-captcha').onclick = generateCaptcha;
document.addEventListener('DOMContentLoaded', generateCaptcha);

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const captchaInput = document.getElementById('captcha-input').value;

    if (captchaInput.toUpperCase() !== captchaText) {
        alert('Неправилен код. Опитайте отново.');
        generateCaptcha();
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/admin.html';
        } else {
            alert('Грешно потребителско име или парола');
            generateCaptcha();
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Грешка при вход');
    }
};