// Hamburger menu functionality
const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
const navMenu = document.querySelector('.mobile-only .nav-menu');
const header = document.querySelector('header');

if (mobileMenuIcon && navMenu && header) {
    mobileMenuIcon.addEventListener('click', function () {
        const isActive = navMenu.classList.toggle('active');
        mobileMenuIcon.classList.toggle('active');

        if (isActive) {
            // Position menu below header and adjust for scroll
            const headerHeight = header.offsetHeight; // Get dynamic header height
            navMenu.style.top = `${headerHeight}px`;
            navMenu.style.opacity = '1';
            navMenu.style.visibility = 'visible';
        } else {
            // Fade out and hide after transition
            navMenu.style.opacity = '0';
            setTimeout(() => {
                navMenu.style.visibility = 'hidden';
            }, 300); // Match CSS transition duration
        }
    });

    // Close menu when a nav link is clicked
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", function () {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuIcon.classList.remove('active');
                navMenu.style.opacity = '0';
                setTimeout(() => {
                    navMenu.style.visibility = 'hidden';
                }, 300); // Match CSS transition duration
            }
        });
    });

    // Adjust menu position on scroll
    window.addEventListener('scroll', () => {
        if (navMenu.classList.contains('active')) {
            const headerHeight = header.offsetHeight;
            navMenu.style.top = `${headerHeight}px`; // Keep it below header
        }
    });
}

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

// Choose price card button functionality
const priceBtns = document.getElementsByClassName('price-card-btn'); // Correct class name
const scheduleSection = document.getElementById('schedule');


// Convert HTMLCollection to array and add event listener to each button
Array.from(priceBtns).forEach(button => {
    button.addEventListener('click', function() {
        if (scheduleSection) {
            scheduleSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.error('Element with ID "schedule" not found.');
        }
    });
});

// Add event listener to price-card-btn elements
document.querySelectorAll('.price-card-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dataType = btn.dataset.type;
    const bookingTypeSelect = document.getElementById('booking-type');
    bookingTypeSelect.value = dataType;
    // if (dataType === 'Re4Me' || dataType === 'Reform 8') {
    //   const numBookingsInput = document.getElementById('num-bookings');
    //   numBookingsInput.value = dataType === 'Re4Me' ? 4 : 8;
    //   // Enable multiple selections in calendar
    //   calendarEl.classList.add('multiple-selections');
    // } else {
    //   numBookingsInput.value = 1;
    //   calendarEl.classList.remove('multiple-selections');
    // }
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
            alert('Съобщението е изпратено успешно!');
            form.reset();
        } else {
            alert('Грешка при изпращане на съобщението. Моля опитайте отново.');
        }
    } catch (error) {
        alert('EГрешка при изпращане на съобщението. Моля опитайте отново.');
    }
});

// Gallery Modal Functionality (Working as confirmed)
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal-close');
    const prevBtn = document.querySelector('.modal-nav.prev-btn');
    const nextBtn = document.querySelector('.modal-nav.next-btn');

    if (modal && modalImg && modalCaption && closeBtn && prevBtn && nextBtn) {
        const galleryImages = document.querySelectorAll('.gallery-item img');
        let currentIndex = 0;

        function openModal(index) {
            currentIndex = index;
            const img = galleryImages[currentIndex];
            modal.style.display = 'flex';
            modalImg.src = img.src;
            modalCaption.textContent = img.dataset.caption || img.alt;
            updateNavButtons();
        }

        function updateNavButtons() {
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === galleryImages.length - 1;
        }

        galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => openModal(index));
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                openModal(currentIndex - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < galleryImages.length - 1) {
                openModal(currentIndex + 1);
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            } else if (e.key === 'ArrowLeft' && modal.style.display === 'flex') {
                if (currentIndex > 0) openModal(currentIndex - 1);
            } else if (e.key === 'ArrowRight' && modal.style.display === 'flex') {
                if (currentIndex < galleryImages.length - 1) openModal(currentIndex + 1);
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

    // Calendar config
    const calendarEl = document.getElementById('user-calendar');
    const requestServices = document.getElementById('requestServices');
    const bookingForm = document.getElementById('booking-form');
    let selectedDate = null;
    let selectedTime = null;

    if (calendarEl) {
        const times = [];
        for (let h = 8; h <= 20; h++) {
            times.push((h < 10 ? '0' : '') + h + ':00');
        }

        function renderWeek(startDate) {
            calendarEl.innerHTML = '';
            const weekRow = document.createElement('div');
            weekRow.className = 'calendar-week-row';
            const today = new Date();
            for (let d = 0; d < 7; d++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + d);
                const dateStr = date.toISOString().split('T')[0];
                const dayName = ['нд','пн','вт','ср','чт','пт','сб'][date.getDay() === 0 ? 0 : date.getDay() - 0];
                const dayCol = document.createElement('div');
                dayCol.className = 'calendar-day-col';
                dayCol.innerHTML = `<div class="calendar-day-header">${dayName} ${dateStr.slice(8,10)}.${dateStr.slice(5,7)}</div>`;
                // console.log(`Checking date: ${dateStr}, Today: ${today.toISOString().split('T')[0]}`); // Debug log
                if (date.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
                dayCol.classList.add('today-highlight'); 
                }
                const slotsCol = document.createElement('div');
                slotsCol.className = 'calendar-slots-col';
                dayCol.appendChild(slotsCol);
                weekRow.appendChild(dayCol);
            }
            calendarEl.appendChild(weekRow);

            // Fetch bookings and holidays
            Promise.all([
                fetch('/api/bookings-approved').then(r => r.json()),
                fetch('/api/holidays').then(r => r.json())
            ]).then(([bookings, holidays]) => {
                for (let d = 0; d < 7; d++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + d);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayCol = weekRow.children[d];
                    const slotsCol = dayCol.querySelector('.calendar-slots-col');
                    if (holidays.includes(dateStr)) {
                        dayCol.classList.add('holiday');
                        slotsCol.innerHTML = '<div class="holiday-label">Почивен ден</div>';
                        continue;
                    }
                    times.forEach(time => {
                        const taken = bookings.some(b => b.date === dateStr && b.time === time);
                        const slotBtn = document.createElement('button');
                        slotBtn.className = taken ? 'slot taken' : 'slot available';
                        slotBtn.textContent = time;
                        slotBtn.disabled = taken;
                        // Disable past slots
                        const slotDateTime = new Date(`${dateStr}T${time}`);
                        const now = new Date(); // Current time: 11:38 AM EEST, 2025-08-25
                        if (slotDateTime < now) {
                        slotBtn.disabled = true; // Disable if in the past
                        slotBtn.classList.add('past-slot'); // Optional class for styling
                        }

                        if (slotDateTime >= now) {
                        slotBtn.disabled = false; // Enable open slots
                        slotBtn.classList.add('open-slot'); // Optional class for styling
                        }

                        slotBtn.onclick = () => {
                            if(!slotBtn.disabled) {
                            selectedDate = dateStr;
                            selectedTime = time;
                            document.getElementById('booking-date-hour').value = `${dateStr} ${time}`;
                            requestServices.classList.add('active');
                            requestServices.style.opacity = '1';
                            requestServices.scrollIntoView({ behavior: 'smooth' });
                            }
                        };
                        slotsCol.appendChild(slotBtn);
                    })
                    
                    ;
                }
            });
        }

        // Week navigation
        let weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1)); // Set to Monday
        // console.log('Initial weekStart:', weekStart.toISOString().split('T')[0]); // Debug initial weekStart
        // weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
        function showWeek(offset) {
            weekStart.setDate(weekStart.getDate() + offset * 7);
            renderWeek(weekStart);
        }
        renderWeek(weekStart);

        // Add navigation buttons
        document.getElementById('prev-week').onclick = () => showWeek(-1);
        document.getElementById('next-week').onclick = () => showWeek(1);
        document.getElementById('today-week').onclick = () => {
            weekStart = new Date();
            // weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1)); // Reset to current Monday
            // console.log('Today reset weekStart:', weekStart.toISOString().split('T')[0]); // Debug reset
            renderWeek(weekStart);
        };
    }

    // Booking form logic
    if (bookingForm) {
        document.getElementById('cancel-booking').onclick = () => {
            scheduleSection.scrollIntoView({ behavior: 'smooth' });
            requestServices.style.opacity='0';
            setTimeout(() => {
                requestServices.classList.remove('active');
                bookingForm.reset();  
            }, 300);
        };
        bookingForm.onsubmit = async function (e) {
            e.preventDefault();
            const booking_type = document.getElementById('booking-type').value;
            const client_name = document.getElementById('client-name').value;
            const client_phone = document.getElementById('client-phone').value;
            const client_email = document.getElementById('client-email').value;
            const subscribe_email = document.getElementById('subscribe-email').checked;
            if (!selectedDate || !selectedTime) {
                alert('Моля, изберете дата и час от календара.');
                return;
            }
            const res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_type, date: selectedDate, time: selectedTime,
                    client_name, client_phone, client_email, subscribe_email
                })
            });
            const result = await res.json();
            if (result.error) {
                alert(result.error);
            } else {
                alert('Заявката е изпратена за одобрение!');
                requestServices.classList.remove('active');
                bookingForm.reset();
                selectedDate = null;
                selectedTime = null;
                document.getElementById('booking-date-hour').value = '';
                location.reload();
            }
        };
    }
});