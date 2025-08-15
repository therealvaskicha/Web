// Hamburger menu functionality
const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
const navMenu= document.querySelector('.mobile-only .nav-menu');

mobileMenuIcon.addEventListener('click', function() {
    mobileMenuIcon.classList.toggle('active');
    navMenu.classList.toggle('active');
})

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function() {
        mobileMenuIcon.classList.remove('active');
        navMenu.classList.remove('active');
    });
});
// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

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
    

    // Clipboard functionality
    const copyAddressBtn = document.getElementById('copyAddressBtn');
    if (copyAddressBtn) {
        copyAddressBtn.addEventListener('click', function () {
            const address = 'ул. „Пенчо Минев“ 5, гр. Стара Загора';
            navigator.clipboard.writeText(address)
                .then(() => {
                    alert('Адресът е копиран в клипборда!');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    alert('Грешка при копиране на адреса.');
                });
        });
    }

// Popup form functionality

const openFormBtn = document.getElementById('openForm');
const closeFormBtn = document.getElementById('closeForm');
// Ensure buttons exist before adding event listeners
if (openFormBtn && closeFormBtn) {
    openFormBtn.addEventListener('click', function () {
        document.querySelector('.popup').style.display = 'flex';
    });
    closeFormBtn.addEventListener('click', function () {
        document.querySelector('.popup').style.display = 'none';
    });
}

// const serviceForm = document.getElementById('serviceForm');
// const formName = document.getElementById('name');
// const formPhoneNr = document.getElementById('phoneNr');

// let messages =[];
// if (formName.value === '' || formName.value == null) {
//     messages.push('Необходимо е име за връзка');
// }
// if (formPhoneNr.value === '' || formPhoneNr.value == null) {
//     messages.push('Необходим е телефон за връзка');
// }
// if (formPhoneNr.value.length < 10) {
//     messages.push('Телефонът трябва да е поне 10 цифри');
// }
// if (!/^\d+$/.test(formPhoneNr.value)) {
//     messages.push('Телефонът трябва да съдържа само цифри');
// }
// if (!/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(formName.value)) {
//     messages.push('Името трябва да съдържа само букви');
// }
// if (formName.value.length < 2) {
//     messages.push('Името трябва да е поне 2 букви');
// }
// if (formName.value.length > 50) {
//     messages.push('Името не трябва да е по-дълго от 50 букви');
// }
// if (formPhoneNr.value.length > 15) {
//     messages.push('Телефонът не трябва да е по-дълъг от 15 цифри');
// }


// Initialize FullCalendar
const calendarEl = document.getElementById('calendar');
if (calendarEl) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today, July 21, 2025
    const currentTime = new Date(); // Current time, 01:11 PM EEST

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
                    return {
                        title: 'Свободен',
                        start: `${slot.date}T${slot.time}:00`,
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
}
 else {
    console.error('Calendar element not found');
}

// Booking type selection
  document.querySelectorAll('.choose-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const choice = this.getAttribute('data-type');
      localStorage.setItem('bookingType', choice);

      // Scroll to calendar section
      const schedule = document.getElementById('schedule');
      if (schedule) {
        schedule.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Populate date and time dropdowns
  function populateBookingDropdowns() {
    const dateSelect = document.getElementById('date-select');
    const timeSelect = document.getElementById('time-select');
    if (!dateSelect || !timeSelect) return;

    // Example data, replace with your real available slots
    const availableDates = ['2025-07-21', '2025-07-22', '2025-07-23'];
    const availableTimes = {
      '2025-07-21': ['10:00', '11:00', '12:00'],
      '2025-07-22': ['13:00', '14:00'],
      '2025-07-23': ['15:00', '16:00']
    };

    dateSelect.innerHTML = '';
    availableDates.forEach(date => {
      const opt = document.createElement('option');
      opt.value = date;
      opt.textContent = date;
      dateSelect.appendChild(opt);
    });

    dateSelect.onchange = function() {
      const times = availableTimes[this.value] || [];
      timeSelect.innerHTML = '';
      times.forEach(time => {
        const opt = document.createElement('option');
        opt.value = time;
        opt.textContent = time;
        timeSelect.appendChild(opt);
      });
    };

    // Trigger initial population
    dateSelect.dispatchEvent(new Event('change'));
  }

  // Confirm button logic
const confirmBtn = document.getElementById('confirm-btn');
if (confirmBtn) {
    confirmBtn.addEventListener('click', async function() {
        const type = localStorage.getItem('bookingType');
        const date = document.getElementById('date-select').value;
        const time = document.getElementById('time-select').value;
        const client_name = prompt('Вашето име:');
        const client_phone = prompt('Вашият телефон за връзка:');
        if (!client_name || !client_phone) {
            alert('Име и телефон са необходими за обратна връзка.');
            return;
        }
        const booking = { type, date, time, client_name, client_phone };

        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        const result = await response.json();
        if (response.ok && result.message) {
            alert('Заявката е изпратена за одобрение!');
        } else {
            alert(result.error || 'Възникна грешка при подаване на заявката!');
        }
    });
}
});