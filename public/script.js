// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Form submission (using Formspree as an example)
document.getElementById('contact-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('https://formspree.io/f/mwpqpgoo', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            alert('Message sent successfully!');
            form.reset();
        } else {
            alert('Error sending message. Please try again.');
        }
    } catch (error) {
        alert('Error sending message. Please try again.');
    }
});

// Initialize FullCalendar
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        validRange: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }, // Weekdays only
        slotMinTime: '08:00:00',
        slotMaxTime: '17:00:00',
        events: async function (fetchInfo, successCallback) {
            const response = await fetch('/api/slots');
            const slots = await response.json();
            const events = slots.map(slot => {
                const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(slot.date);
                const date = new Date(fetchInfo.start);
                date.setDate(date.getDate() + ((dayIndex - date.getDay() + 7) % 7));
                return {
                    title: 'Свободен',
                    start: `${date.toISOString().split('T')[0]}T${slot.time}:00`,
                    allDay: false
                };
            });
            successCallback(events);
        },
        eventClick: function (info) {
            document.getElementById('date').value = info.event.start.toLocaleDateString('en-US', { weekday: 'long' });
            document.getElementById('time').value = info.event.start.toTimeString().split(' ')[0].slice(0, 5);
        }
    });
    calendar.render();
});

// Function to request a booking
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // Excluded Sunday
async function requestBooking() {
    const name = document.getElementById('client-name').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    if (!name) {
        alert('Моля, въведете вашето име.');
        return;
    }
    const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, client_name: name })
    });
    const result = await response.json();
    alert(result.message || result.error);
    if (response.ok) {
        document.getElementById('client-name').value = ''; // Clear form
    }
}

// Approve booking (for owner)
app.get('/admin.html', (req, res) => {
    // Add authentication check (e.g., session or token)
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.use('/admin.html', (req, res, next) => {
    // Check for auth token or session
    next();
});

if (response.ok) {
    document.getElementById('client-name').value = '';
    calendar.refetchEvents(); // Refresh calendar
}

// Gallery Modal Functionality
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal-close');

    // Add click event listeners to gallery images
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function () {
            modal.style.display = 'flex'; // Show modal
            modalImg.src = this.src; // Set modal image to clicked image
            modalCaption.textContent = this.alt; // Set caption to image alt text
        });
    });

    // Close modal when clicking the close button
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
    }
    });

    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});