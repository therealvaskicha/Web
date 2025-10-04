// Hamburger menu functionality
const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
const navMenu = document.querySelector('.mobile-only .nav-menu');
const header = document.querySelector('header');

    // Ensure elements exist
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
    bookingTypeSelect.dispatchEvent(new Event('change')); // Trigger change event for hints

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

    // Add booking type hints
document.getElementById('booking-type').addEventListener('change', function() {
const hint = document.querySelector('.booking-hint');
const bookingType = this.value;

const hints = {
    'Solo': 'Solo - €15,34 / 30лв. - 1 групова тренировка',
    'Private': 'Private - €23,01 / 45лв. - 1 индивидуална тренировка',
    'Re4Me': 'Re4Me - €56,24 / 110лв. - 4 тренировки - възможност за група',
    'Six': 'Six - €76,70 / 150лв. - 6 тренировки - възможност за група',
    'Reform 8': 'Reform ∞ - €92,04 / 180лв. - 8 тренировки - възможност за група'
};

hint.textContent = hints[bookingType] || '';
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

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
    // Modal configs
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal-close');
    const prevBtn = document.querySelector('.modal-nav.prev-btn');
    const nextBtn = document.querySelector('.modal-nav.next-btn');
    // Add intersection observer for fade-in sections
    const fadeElements = document.querySelectorAll('.fade-in-section');

    // Gallery modal logic
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

    // Fade in section observer
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });

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
    const calendarHint = document.getElementById('hint');
    const bookingForm = document.getElementById('booking-form');
    let selectedDate = null;
    let selectedTime = null;

    // Calendar rendering
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
                    times.forEach(time => {
                        const taken = bookings.some(b => b.date === dateStr && b.time === time);
                        const isHoliday = holidays.some(h => h.date === dateStr && (h.time === null || h.time === time));
                        const slotBtn = document.createElement('button');
                        slotBtn.className = 'slot'; // default class
                        slotBtn.textContent = time;
                        
                        // Add holiday and taken slots
                        if (isHoliday) {
                            slotBtn.disabled = true;
                            slotBtn.classList.add('holiday');
                        } else if (taken) {
                            slotBtn.disabled = true; 
                            slotBtn.classList.add('taken');
                            
                        } else {
                            slotBtn.classList.add('available');
                        }
                        
                        // Disable past slots
                        const slotDateTime = new Date(`${dateStr}T${time}`);
                        const now = new Date();
                        const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
                        
                        if (slotDateTime < fourHoursLater) {
                            slotBtn.disabled = true; 
                            slotBtn.classList.add('past'); 
                            slotBtn.classList.remove('available');
                        }
                        // Add click event for slots
                        slotBtn.onclick = () => {
                            if(!slotBtn.disabled) {
                            const previouslySelected = document.querySelector('.slot.selected');
                            const bookingDateHour = document.getElementById('booking-date-hour');
                            const calendarWrap = document.querySelector('.calendar-wrap');

                            if (previouslySelected) {
                                previouslySelected.classList.remove('selected');
                                slotBtn.classList.add('selected');
                            } else

                            slotBtn.classList.add('selected');
                            selectedDate = dateStr;
                            selectedTime = time;
                            bookingDateHour.value = `${dateStr} ${time}`;
                            requestServices.classList.add('active');
                            requestServices.style.opacity = '1';
                            
                            if (window.innerWidth > 768) {
                                calendarWrap.classList.add('shift-left');
                            }
                            
                            if (window.innerWidth <= 768) {
                                calendarHint.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                        };
                        slotsCol.appendChild(slotBtn);
                    });
                }
            });
        }

        // Week navigation
        let weekStart = new Date();
        const now = new Date();
        const lastSlotToday = new Date(now);
        lastSlotToday.setHours(20, 0, 0, 0);

        // Check if it's Sunday (0) and past 20:00 - 4 hours
            if (now.getDay() === 0 && now > new Date(lastSlotToday.getTime() - 4 * 60 * 60 * 1000)) {
                // Start from next Monday instead
                weekStart.setDate(weekStart.getDate() + 1);
            }
        
        // Set to Monday of current/next
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
        
        // Show week function
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
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1)); // Reset to current Monday
            renderWeek(weekStart);
        };
    }

    // Booking form logic
    if (bookingForm) {
        document.getElementById('cancel-booking').onclick = () => {
            const previouslySelected = document.querySelector('.slot.selected');
            const calendarWrap = document.querySelector('.calendar-wrap');

            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }
            if (window.innerWidth <= 768) {
                scheduleSection.scrollIntoView({ behavior: 'smooth' });
            }
            requestServices.style.opacity='0';
            
            if (window.innerWidth > 768) {
                calendarWrap.classList.remove('shift-left');
            }

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
            const booking_note = document.getElementById('booking-note').value;
            const subscribe_email = document.getElementById('subscribe-email').checked;
            const calendarWrap = document.querySelector('.calendar-wrap');
            
            if (!selectedDate || !selectedTime) {
                alert('Моля, изберете дата и час от календара.');
                return;
            }
            const res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_type, date: selectedDate, time: selectedTime,
                    client_name, client_phone, client_email, booking_note, subscribe_email
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
                if (window.innerWidth > 768) {
                    calendarWrap.classList.remove('shift-left');
                }
                // location.reload();
            }
        };
    }
});