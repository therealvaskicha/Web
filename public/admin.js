document.addEventListener('DOMContentLoaded', function() {
    loadPending();

    async function loadPending() {
        const response = await fetch('/api/pending');
        const bookings = await response.json();
        const table = document.getElementById('pending-bookings');
        // Clear previous rows except the header
        while (table.rows.length > 1) table.deleteRow(1);
        bookings.forEach(booking => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.client_name}</td>
                <td>${booking.client_phone || 'N/A'}</td>
                <td>
                    <button onclick="updateBooking(${booking.id}, 'approved')">Одобри</button>
                    <button onclick="updateBooking(${booking.id}, 'rejected')">Откажи</button>
                </td>
            `;
        });
    }

    window.updateBooking = async function(id, status) {
        const response = await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const result = await response.json();
        alert(result.message || result.error);
        window.location.reload(); // Refresh to update calendar
    }
});