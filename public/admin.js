document.addEventListener('DOMContentLoaded', function() {
    loadPending();
    loadBookings();
    initAdminCalendar();
    loadHistory();

    async function loadPending() {
        const response = await fetch('/api/pending');
        const bookings = await response.json();
        const table = document.getElementById('pending-bookings');
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
        const table = document.getElementById('bookings-approved');
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
            `;
        });
    }

        async function loadHistory() {
        const response = await fetch('/api/bookings-history');
        const bookings = await response.json();
        const table = document.getElementById('bookings-history');
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
    }

    function initAdminCalendar() {
        const calendarEl = document.getElementById('admin-calendar');
        if (!calendarEl) return;

        // Navigation buttons
        calendarEl.parentNode.insertBefore(navDiv, calendarEl);

        let currentDate = new Date();
        function renderCalendar(date) {
            calendarEl.innerHTML = '';
            // ...render your calendar here, similar to user-calendar...
            // For admin, you can show holidays and allow clicking to add/remove
        }
        renderCalendar(currentDate);

        document.getElementById('prev-week').onclick = () => {
            currentDate.setDate(currentDate.getDate() - 7);
            renderCalendar(currentDate);
        };
        document.getElementById('next-week').onclick = () => {
            currentDate.setDate(currentDate.getDate() + 7);
            renderCalendar(currentDate);
        };
        document.getElementById('today-week').onclick = () => {
            currentDate = new Date();
            renderCalendar(currentDate);
        };
    }
});