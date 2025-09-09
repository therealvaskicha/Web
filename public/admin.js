document.addEventListener('DOMContentLoaded', function() {
    loadPending();
    loadBookings();
    loadHistory();

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
                fetch('/api/pending').then(r => r.json())
            ]).then(([bookings, holidays, pendingBookings]) => {
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
                        const pending = pendingBookings.some(d => d.date === dateStr && d.time === time && d.status === 'pending');
                        const slotBtn = document.createElement('button');
                        // slotBtn.className = taken ? 'slot taken' : 'slot available';
                        slotBtn.className = 'slot'; // default class
                        if (taken) {
                            slotBtn.classList.add('taken');
                        } else if (pending) {
                            slotBtn.classList.add('pending');
                        } else {
                            slotBtn.classList.add('available');
                        }
                        slotBtn.textContent = time;
                        slotBtn.disabled = taken;

                        // Disable past slots
                        const slotDateTime = new Date(`${dateStr}T${time}`);
                        const now = new Date(); 
                        const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

                        if (slotDateTime < fourHoursLater) {
                        slotBtn.disabled = true; 
                        slotBtn.classList.add('past');
                        slotBtn.classList.remove('available');
                        }

                        slotBtn.onclick = () => {
                            if(!slotBtn.disabled) {
                            selectedDate = dateStr;
                            selectedTime = time;
                            document.getElementById('booking-date-hour').value = `${dateStr} ${time}`;
                            requestServices.classList.add('active');
                            requestServices.style.opacity = '1';
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

    async function loadPending() {
        const response = await fetch('/api/pending');
        const bookings = await response.json();
        const table = document.getElementById('pendingBookingsTable');
        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.booking_type}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.client_name}</td>
                <td>${booking.client_phone || 'N/A'}</td>
                <td>${booking.client_email || 'N/A'}</td>
                <td>${booking.subscribe_email ? 'Да' : 'Не'}</td>
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

    async function loadBookings() {
        const response = await fetch('/api/bookings-approved');
        const bookings = await response.json();
        const table = document.getElementById('approvedBookingsTable');
        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.client_name}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.booking_type}</td>
                <td>${booking.client_phone || 'N/A'}</td>
                <td>${booking.client_email || 'N/A'}</td>
                <td>${booking.timestamp}</td>
            `;
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
                <td>${booking.id}</td>
                <td>${booking.booking_type}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.client_name}</td>
                <td>${booking.client_phone || 'N/A'}</td>
                <td>${booking.client_email || 'N/A'}</td>
                <td>${booking.subscribe_email ? 'Да' : 'Не'}</td>
                <td>${booking.timestamp}</td>
                <td>${booking.status}</td>
            `;
        });
    }

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
});