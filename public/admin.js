document.addEventListener('DOMContentLoaded', function() {
    loadPending();
    loadBookings();
    loadHistory();
    loadHolidays();

    // Holidays calendar setup
    const calendarEl = document.getElementById('admin-calendar');

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
                        const pending = pendingBookings.some(d => d.date === dateStr && d.time === time && d.status === 'pending');
                        const isHoliday = holidays.some(h => h.date === dateStr && (h.time === null || h.time === time));
                        
                        const slotBtn = document.createElement('button');
                        slotBtn.className = 'slot';
                        slotBtn.textContent = time;

                        if (isHoliday) {
                            slotBtn.classList.add('holiday');
                        } else if (taken) {
                            const booking = bookings.find(b => b.date === dateStr && b.time === time) ||
                                            historicalBookings.find(b => b.date === dateStr && b.time === time);
                            slotBtn.classList.add('taken');
                            slotBtn.title = `Резервация #${booking.id}\nТип: ${booking.booking_type}\nИме: ${booking.client_name}\nТел: ${booking.client_phone}\nДата: ${booking.date}`;
                        } else if (pending) {
                            const booking = pendingBookings.find(d => d.date === dateStr && d.time === time && d.status === 'pending');
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
    }

    // Load pending bookings
    async function loadPending() {
        const response = await fetch('/api/pending');
        const bookings = await response.json();
        const table = document.getElementById('pendingBookingsTable');
        const container = table.parentElement;

        if (bookings.length === 0) {
        container.innerHTML = '<p class="no-data-message">Няма нови заявки</p>';
        return;
        }

        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${booking.booking_type}</td> 
                <td>${booking.client_name}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.client_phone || 'N/A'}</td>
                <td>${booking.client_email || 'N/A'}</td>
                <td>${booking.timestamp}</td>
                <td>
                    <button class="approve-btn" data-id="${booking.id}">Одобри</button>
                    <button class="reject-btn" data-id="${booking.id}">Откажи</button>
                </td>
            `;
        });

        // Add event listeners for approve/reject
        table.querySelectorAll('.approve-btn').forEach(btn => {
            btn.onclick = async () => {
                await updateBooking(btn.dataset.id, 'approved');
            };
        });
        table.querySelectorAll('.reject-btn').forEach(btn => {
            btn.onclick = async () => {
                await updateBooking(btn.dataset.id, 'rejected');
            };
        });
    }

    // Load approve bookings
    async function loadBookings() {
        const response = await fetch('/api/bookings-approved');
        const bookings = await response.json();
        const table = document.getElementById('approvedBookingsTable');
        const container = table.parentElement;

        if (bookings.length === 0) {
        container.innerHTML = '<p class="no-data-message">Няма предстоящи тренировки.</p>';
        return;
        }

        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${booking.booking_type}</td>
                <td>${booking.client_name}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.client_phone || 'N/A'}</td>
                <td>${booking.client_email || 'N/A'}</td>
                <td>${booking.timestamp}</td>
                <td>
                    <button class="cancel-btn" data-id="${booking.id}">Отмени</button>
                </td>
            `;
        });

        // Add event listeners for cancel booking
        table.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.onclick = async () => {
                await updateBooking(btn.dataset.id, 'canceled');
            };
        });
    }

    // Load holidays
    async function loadHolidays() {
        const response = await fetch('/api/holidays');
        const holidays = await response.json();
        const table = document.getElementById('holidaysTable');
        const container = table.parentElement;
        
        if (holidays.length === 0) {
        container.innerHTML = '<p class="no-data-message">Няма предстоящи почивни дни/часове</p>';
        return;
        }

        while (table.rows.length > 1) table.deleteRow(1);
        holidays.forEach(holiday => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${holiday.date}</td>
                <td>${holiday.time || 'Цял ден'}</td>
                <td>
                    <button class="remove-btn" 
                        data-date="${holiday.date}" 
                        data-time="${holiday.time || null}">Премахни</button>
                </td>
            `;
        });

        // Add event listeners for removing holiday
        table.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = async () => {
                const date = btn.dataset.date;
                const time = btn.dataset.time === "null" ? null : btn.dataset.time;
                await removeHoliday(date, time);
            };
        });
    }

        async function loadHistory() {
        const response = await fetch('/api/bookings-history');
        const bookings = await response.json();
        const table = document.getElementById('bookingHistoryTable');

        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${booking.booking_type}</td>
                <td>${booking.client_name}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.client_phone || 'N/A'}</td>
                <td>${booking.client_email || 'N/A'}</td>
                <td>${booking.subscribe_email ? 'Да' : 'Не'}</td>
                <td>${booking.timestamp}</td>
                <td>${booking.status}</td>
            `;

            switch (booking.status) {
                case 'canceled':
                    row.classList.add('row-canceled');
                case 'rejected':
                    row.classList.add('row-rejected');
                    break;
                case 'approved':
                    row.classList.add('row-approved');
                    break;
                default:
                    row.classList.add('row-pending');
            }
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

    // Remove holiday
    async function removeHoliday(date, time) {
        try {
            const response = await fetch('/api/delete-holiday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, time })
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                loadHolidays();
                location.reload(); // Refresh the page to update the calendar
            } else {
                alert(result.error || 'Грешка при премахване на почивен ден');
            }
        } catch (error) {
            console.error('Грешка:', error);
            alert('Грешка при премахване на почивен ден');
        }adHolidays();
    }
});