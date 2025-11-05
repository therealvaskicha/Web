// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);


document.addEventListener('DOMContentLoaded', function() {
    loadPending();
    loadBookings();
    loadHistory();
    loadHolidays();

    // Add bookings manually via btn
    const addBookingBtn = document.querySelector('.add-booking-btn');
    const cancelBookingBtn = document.querySelector('#cancel-booking');
    const bookingModal = document.querySelector('#bookingModal');
    const modalOverlay = document.querySelector('#modalOverlay');
    
        addBookingBtn.addEventListener('click', () => {
        bookingModal.classList.add('active');
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
    
    const hideModal = () => {
        bookingModal.classList.remove('active');
        modalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    };
    
    cancelBookingBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);
    
    // Close modal when clicking outside the form
    bookingModal.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Holidays calendar setup
    const calendarEl = document.getElementById('admin-calendar');
    const requestServices = document.getElementById('requestServices');
    const calendarHint = document.getElementById('hint');
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
                // Add header click handlers
                const header = dayCol.querySelector('.calendar-day-header');
                header.addEventListener('click', () => handleDayHeaderClick(header));

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
                fetch('/api/holidays').then(r => r.json()),
                fetch('/api/pending').then(r => r.json()),
                fetch('/api/bookings-history-approved').then(r => r.json())
            ]).then(([bookings, holidays, pendingBookings, historicalBookings]) => {
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
                        const taken = bookings.some(b => b.date === dateStr && b.time === time) || 
                                    historicalBookings.some(b => b.date === dateStr && b.time === time);
                        const pending = pendingBookings.some(d => d.date === dateStr && d.time === time && d.status === 1);
                        const isHoliday = holidays.some(h => h.date === dateStr && (h.time === null || h.time === time));
                        
                        const slotBtn = document.createElement('button');
                        const bookingDateHour = document.getElementById('booking-date-hour');

                        slotBtn.className = 'slot';
                        slotBtn.textContent = time;

                        if (isHoliday) {
                            const holiday = holidays.find(h => h.date === dateStr && (h.time === null || h.time === time));
                            slotBtn.classList.add('holiday');
                            slotBtn.title = `${holiday.description || 'Почивен ден'}`
                        } else if (taken) {
                            const booking = bookings.find(b => b.date === dateStr && b.time === time) ||
                                            historicalBookings.find(b => b.date === dateStr && b.time === time);
                            booking.client_name = `${booking.client_forename} ${booking.client_lastname}`
                            slotBtn.classList.add('taken');
                            slotBtn.title = `Резервация #${booking.id}\nТип: ${booking.booking_type}\nИме: ${booking.client_name}\nТел: ${booking.client_phone}\nДата: ${booking.date}`;
                        } else if (pending) {
                            const booking = pendingBookings.find(d => d.date === dateStr && d.time === time && d.status === 1);
                            booking.client_name = `${booking.client_forename} ${booking.client_lastname}`
                            slotBtn.classList.add('pending');
                            slotBtn.title = `Резервация #${booking.id}\nТип: ${booking.booking_type}\nИме: ${booking.client_name}\nТел: ${booking.client_phone}\nДата: ${booking.date}`;
                        } else {
                            slotBtn.classList.add('available');
                        }

                        const slotDateTime = new Date(`${dateStr}T${time}`);
                        const now = new Date(); 
                        const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
                        
                        if (slotDateTime < fourHoursLater && !taken) {
                        slotBtn.disabled = true; 
                        slotBtn.classList.add('past');
                        slotBtn.classList.remove('available');
                        }

                        slotBtn.onclick = () => {
                            if (slotBtn.classList.contains('selected')) {
                            slotBtn.classList.remove('selected');
                            } else {
                            slotBtn.classList.add('selected');
                            selectedDate = dateStr;
                            selectedTime = time;
                            bookingDateHour.value = `${dateStr} ${time}`;
                            }
                        };
                        slotsCol.appendChild(slotBtn);
                    });
                }
            });
        }

        if (bookingForm) {
            document.getElementById('cancel-booking').onclick = () => {
            const previouslySelected = document.querySelector('.slot.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }

            bookingForm.reset(); 
        }

        bookingForm.onsubmit = async function(e) {
        e.preventDefault();
        const booking_type = document.getElementById('booking-type').value;
        const client_forename = document.getElementById('client-forename').value;
        const client_lastname = document.getElementById('client-lastname').value;
        const client_phone = document.getElementById('client-phone').value;
        const client_email = document.getElementById('client-email').value;
        const booking_note = document.getElementById('booking-note').value;
        const subscribe_email = document.getElementById('subscribe-email').checked;
                
        if (!selectedDate || !selectedTime) {
            alert('Моля, изберете дата и час от календара.');
            return;
        }

        // Book via api/book and approve via api/approve
        const res = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_type, 
                date: selectedDate, 
                time: selectedTime,
                client_forename, 
                client_lastname, 
                client_phone, 
                client_email, 
                booking_note, 
                subscribe_email
            })
        });

        const result = await res.json();
        if (result.error) {
            alert(result.error);
        } else {
            await updateBooking(result.id, 2);
            requestServices.classList.remove('active');
            bookingForm.reset();
            selectedDate = null;
            selectedTime = null;
            document.getElementById('booking-date-hour').value = '';
            const previouslySelected = document.querySelector('.slot.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }
        }
    }
    };

        // Week navigation
        let weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
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
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
            renderWeek(weekStart);
        };

        // Add holiday
        const addHolidayBtn = document.querySelector('.add-holiday-btn');
        if (addHolidayBtn && !addHolidayBtn.hasListener) {
            addHolidayBtn.hasListener = true; // Flag to prevent multiple listeners
            addHolidayBtn.addEventListener('click', async () => {
                const holidays = [];
                const headers = document.querySelectorAll('.calendar-day-header.selected');
                const slots = document.querySelectorAll('.slot.selected');
                const now = new Date();
                // Get current approved bookings
                const bookingsResponse = await fetch('/api/bookings-approved');
                const approvedBookings = await bookingsResponse.json();
                const conflicts = [];

                // Process headers (full days)
                headers.forEach(header => {
                    const dayCol = header.closest('.calendar-day-col');
                    const dayIndex = Array.from(dayCol.parentNode.children).indexOf(dayCol);
                    const date = new Date(weekStart);
                    date.setDate(weekStart.getDate() + dayIndex);
                    const dateStr = date.toISOString().split('T')[0];

                    // Check if date is in the past
                    if (date < new Date(now.setHours(0, 0, 0, 0))) {
                        conflicts.push(`Отминала дата: ${dateStr}`);
                        return;
                    }

                    // Check for conflicts on full days
                    const dayConflicts = approvedBookings.filter(b => b.date === dateStr);
                    if (dayConflicts.length > 0) {
                        dayConflicts.forEach(booking => {
                            conflicts.push(`Предстояща тренировка: ${booking.date} ${booking.time}`);
                        });
                    } else {
                        holidays.push({ date: dateStr, time: null });
                    }
                });

                // Process individual slots
                slots.forEach(slot => {
                    if (!slot.closest('.calendar-day-col').querySelector('.calendar-day-header.selected')) {
                        const dayCol = slot.closest('.calendar-day-col');
                        const dayIndex = Array.from(dayCol.parentNode.children).indexOf(dayCol);
                        const date = new Date(weekStart);
                        date.setDate(weekStart.getDate() + dayIndex);
                        const dateStr = date.toISOString().split('T')[0];
                        const time = slot.textContent;

                        // Check if date and time is in the past
                        const slotDateTime = new Date(`${dateStr}T${time}`);
                        if (slotDateTime < now) {
                            conflicts.push(`Отминала дата: ${dateStr} ${time}`);
                            return;
                        }
                        
                        // Check for conflicts on specific time slots
                        const hasConflict = approvedBookings.some(b => 
                            b.date === dateStr && b.time === time
                        );
                    
                        if (hasConflict) {
                            conflicts.push(`Предстояща тренировка: ${dateStr} ${time}`);
                        } else {
                            holidays.push({
                                date: dateStr,
                                time: time
                            });
                        }
                    }
                });

                if (conflicts.length > 0) {
                    alert(`Не може да добавите почивка поради следните причини:\n\n${conflicts.join('\n')}`);
                    return;
                }

                if (holidays.length === 0) {
                    alert('Моля, изберете дни или часове за почивка');
                    return;
                }

                // Get description once before processing
                const description = prompt('Добавете описание (по желание):');
                if (description === null) return; // User clicked Cancel

                const response = await fetch('/api/add-holiday', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ holidays, description })
                });
                const result = await response.json();
                
                if (response.ok) {
                    alert(result.message);
                    // Clear selections
                    headers.forEach(h => h.classList.remove('selected'));
                    slots.forEach(s => s.classList.remove('selected'));
                    this.location.reload();
                } else {
                    alert(result.error || 'Грешка при добавяне на почивка');
                }
            });
            renderWeek(weekStart);
        }

            function handleDayHeaderClick(header) {
            header.classList.toggle('selected');
            const slotsCol = header.nextElementSibling;
            const slots = slotsCol.querySelectorAll('.slot');
            if (header.classList.contains('selected')) {
                slots.forEach(slot => {
                    slot.classList.remove('selected');
                    slot.disabled = true;
                });
            } else {
                slots.forEach(slot => {
                    slot.disabled = false;
                });
            }
        }
    }

    // Load pending bookings
    async function loadPending() {
        const response = await fetch('/api/pending');
        const bookings = await response.json();
        const table = document.getElementById('pendingBookingsTable');
        const container = table.parentElement;

        if (bookings.length < 1) {
        container.innerHTML = '<p class="no-data-message">Няма нови заявки</p>';
        return;
        }

        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            // concatenate forename and lastname
            booking.client_name = `${booking.client_forename} ${booking.client_lastname}`
            row.innerHTML = `
                <td>${booking.client_name}</td>
                <td>${booking.booking_type}</td> 
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.booking_note || '-'}</td>
                <td>
                    <img src="Images/btn-yes-test.png" class="approve-btn" data-id="${booking.id}"></img>
                    <img src="Images/btn-no-test.png" class="reject-btn" data-id="${booking.id}"></img>
                </td>
            `;
        });

        // <td>
        //     <button class="approve-btn" data-id="${booking.id}">Одобри</button>
        //     <button class="reject-btn" data-id="${booking.id}">Откажи</button>
        // </td>

        // Add event listeners for approve/reject
        table.querySelectorAll('.approve-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Сигурни ли сте, че искате да одобрите този час?')) {
                await updateBooking(btn.dataset.id, 2);
                document.getElementById('booking-date-hour').value = '';
                }
            };
        });
        table.querySelectorAll('.reject-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Сигурни ли сте, че искате да откажете този час?')) {
                    await updateBooking(btn.dataset.id, 4);
                }
            };
        });
    }

    // Approve or reject booking
    async function updateBooking(id, status) {
        const response = await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const result = await response.json();
        alert(result.message || result.error);
        loadPending();
        location.reload();
    }

    // Load approve bookings
    async function loadBookings() {
        const response = await fetch('/api/bookings-approved');
        const bookings = await response.json();
        const table = document.getElementById('approvedBookingsTable');
        const container = table.parentElement;

        if (bookings.length < 1) {
        container.innerHTML = '<p class="no-data-message">Няма предстоящи тренировки.</p>';
        return;
        }

        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            booking.client_name = `${booking.client_forename} ${booking.client_lastname}`
            row.innerHTML = `
                <td>${booking.client_name}</td>
                <td>${booking.booking_type}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.booking_note || '-'}</td>
                <td>
                    <button class="cancel-btn" data-id="${booking.id}">Отмени</button>
                </td>
            `;
        });

        // Add event listeners for cancel booking
        table.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.onclick = async () => {
            if (confirm('Сигурни ли сте, че искате да отмените този час?')) {
                await updateBooking(btn.dataset.id, 3);
            }
            };
        });
    }

    // Load holidays
    async function loadHolidays() {
        const response = await fetch('/api/holidays-current');
        const holidays = await response.json();
        const table = document.getElementById('holidaysTable');
        const container = table.parentElement;
        
        if (holidays.length < 1) {
        container.innerHTML = '<p class="no-data-message">Няма предстоящи почивни дни/часове</p>';
        return;
        }

        while (table.rows.length > 1) table.deleteRow(1);
        holidays.forEach(holiday => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${holiday.date}</td>
                <td>${holiday.time || 'Цял ден'}</td>
                <td>${holiday.description || ''}</td>
                <td>
                    <button class="remove-btn" data-id="${holiday.id}">Премахни</button>
                </td>
            `;

        const removeBtn = row.querySelector('.remove-btn');
        removeBtn.addEventListener('click', async () => {
            if (confirm('Сигурни ли сте, че искате да премахнете този почивен ден?')) {
                await deleteHoliday(holiday.id);
            }
            });
        });

        // Automatically deactivate past holidays
        await fetch('/api/auto-deactivate-past-holidays', { method: 'POST' });
}

        async function loadHistory() {
            const response = await fetch('/api/bookings-history');
            const bookings = await response.json();
            const table = document.getElementById('bookingHistoryTable');
            const paginationContainer = document.getElementById('historyPagination');
            
            // Pagination settings
            const recordsPerPage = 5;
            const totalPages = Math.ceil(bookings.length / recordsPerPage);
            let currentPage = 1;

            function displayBookings(page) {
                // Clear existing rows
                while (table.rows.length > 1) table.deleteRow(1);
                
                // Calculate start and end indices
                const start = (page - 1) * recordsPerPage;
                const end = start + recordsPerPage;
                const paginatedBookings = bookings.slice(start, end);

                // Display bookings for current page
                paginatedBookings.forEach(booking => {
                    const row = table.insertRow();
                    row.style.opacity = '0';
                    row.style.transform = 'translateY(-10px)';
                    booking.client_name = `${booking.client_forename} ${booking.client_lastname}`
                    row.innerHTML = `
                        <td>${booking.client_name}</td>
                        <td>${booking.booking_type}</td>
                        <td>${booking.date}</td>
                        <td>${booking.time}</td>
                        <td>${booking.stamp_created}</td>
                    `;

                    switch (booking.status) {
                        case 3:
                            row.classList.add('row-canceled');
                            break;
                        case 4:
                            row.classList.add('row-rejected');
                            break;
                        case 2:
                            row.classList.add('row-approved');
                            break;
                        default:
                            row.classList.add('row-pending');
                    }

                    // Animate row appearance
                    setTimeout(() => {
                        row.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
                        row.style.opacity = '1';
                        row.style.transform = 'translateY(0)';
                    }, 50 * table.rows.length);
                });

                // Update pagination UI
                updatePagination();
            }

            function updatePagination() {
                paginationContainer.innerHTML = '';
                
                // Create pagination buttons
                for (let i = 1; i <= totalPages; i++) {
                    const button = document.createElement('button');
                    button.innerText = i;
                    button.classList.add('pagination-btn');
                    if (i === currentPage) {
                        button.classList.add('active');
                    }
                    button.addEventListener('click', () => {
                        currentPage = i;
                        displayBookings(currentPage);
                    });
                    paginationContainer.appendChild(button);
                }
            }

            // Initial display
            displayBookings(currentPage);
        }

    // Remove holiday
    async function deleteHoliday(id) {
            const response = await fetch('/api/delete-holiday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                await loadHolidays();
                location.reload();
            }
    } 
});