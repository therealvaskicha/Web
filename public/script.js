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

// Gallery Modal Functionality (Working as confirmed)
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal-close');

    if (modal && modalImg && modalCaption && closeBtn) {
        document.querySelectorAll('.gallery-item img').forEach(img => {
            img.addEventListener('click', function () {
                modal.style.display = 'flex';
                modalImg.src = this.src;
                modalCaption.textContent = this.dataset.caption || this.alt;
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

    // Initialize FullCalendar
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today, July 20, 2025
        const currentTime = new Date(); // Current time, 04:29 PM

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            slotMinTime: '08:00:00',
            slotMaxTime: '17:00:00',
            firstDay: 1, // Start week on Monday
            locale: 'bg', // Bulgarian locale
            buttonText: {
                today: 'Днес'
            },
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false // Remove AM/PM
            },
            allDaySlot: false, // Remove all-day line
            selectable: true, // Enable selection
            select: function (info) {
                const slotDate = new Date(info.start);
                const slotTime = info.start.getTime();
                if (slotDate < today || (slotDate.getDate() === today.getDate() && slotTime < currentTime.getTime())) {
                    return; // Prevent selection for past times
                }
                const date = slotDate.toLocaleDateString('bg-BG', { weekday: 'long' });
                const time = info.start.toTimeString().split(' ')[0].slice(0, 5);
                document.getElementById('selected-date').value = date;
                document.getElementById('selected-time').value = time;
                document.getElementById('booking-form').style.display = 'block';
                document.getElementById('client-name').focus();
                console.log('Selected slot:', date, time); // Debug
            },
            dayCellContent: function (arg) {
                return arg.dayNumberText; // Show day numbers only
            },
            eventDidMount: function (info) {
                if (info.event.title === 'Зает') {
                    info.el.style.backgroundColor = '#ff44444b';
                    info.el.style.borderColor = '#ff44444b';
                }
            },
            events: async function (fetchInfo, successCallback) {
                try {
                    const response = await fetch('/api/slots');
                    if (!response.ok) throw new Error('API error');
                    const slots = await response.json();
                    const events = slots.map(slot => {
                        const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(slot.date);
                        const date = new Date(fetchInfo.start);
                        date.setDate(date.getDate() + ((dayIndex - date.getDay() + 7) % 7 || 7));
                        return {
                            title:  'Свободен',
                            start: `${date.toISOString().split('T')[0]}T${slot.time}:00`,
                            allDay: false
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    console.error('Error fetching slots:', error);
                    successCallback([]);
                }
            }
        });
        calendar.render();
        console.log('Calendar initialized'); // Debug initialization
    } else {
        console.error('Calendar element not found');
    }
});

// Booking confirmation functions
function confirmBooking() {
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const date = document.getElementById('selected-date').value;
    const time = document.getElementById('selected-time').value;
    if (!name || !phone || !date || !time) {
        alert('Моля, попълнете всички полета.');
        return;
    }
    const btn = document.getElementById('confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Изпращане...';
    fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, client_name: name, client_phone: phone })
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message || result.error);
        if (response.ok) {
            cancelBooking();
            if (calendar) calendar.refetchEvents();
        }
    })
    .catch(error => {
        alert('Грешка при записване. Опитайте отново.');
        console.error('Booking error:', error);
    })
    .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Потвърди';
    });
}

function cancelBooking() {
    document.getElementById('booking-form').style.display = 'none';
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('selected-date').value = '';
    document.getElementById('selected-time').value = '';
}

// Example booking handlers
function confirmBooking() {
    alert('Заявката е изпратена!');
    document.getElementById('booking-form').style.display = 'none';
}
function cancelBooking() {
    document.getElementById('booking-form').style.display = 'none';
}


// Scroll to top button functionality
const scrollBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
        scrollBtn.classList.add('show');
    } else {
        scrollBtn.classList.remove('show');
    }
});
scrollBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
