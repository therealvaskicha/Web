///////////////////////////
// Centralized API calls //
///////////////////////////
class APIService {
    // Make a fetch request with error handling and JSON parsing
    static async request(url, options = {}) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP Error: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${url}):`, error);
            throw error;
        }
    }

    // Logout user
    static async logout() {
        return this.request('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get approved bookings
    static async getBookingsApproved() {
        return this.request('/api/bookings-approved');
    }

    // Get historical approved bookings
    static async getBookingsHistoryApproved() {
        return this.request('/api/bookings-history-approved');
    }

    // Get pending bookings
    static async getPending() {
        return this.request('/api/pending');
    }

    // Get holidays
    static async getHolidays() {
        return this.request('/api/holidays');
    }

    // Add holiday(s)
    static async addHoliday(holidays, description) {
        return this.request('/api/add-holiday', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ holidays, description })
        });
    }

    // Delete holiday
    static async deleteHoliday(id) {
        return this.request('/api/delete-holiday', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    }

    // Auto-deactivate past holidays
    static async autoDeactivatePastHolidays() {
        return this.request('/api/auto-deactivate-past-holidays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Book an appointment
    static async book(bookingData) {
        return this.request('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
    }

    // Approve a booking
    static async approveBooking(id, status) {
        return this.request('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
    }

    // Get all clients
    static async getClients() {
        return this.request('/api/clients');
    }

    // Get booking history
    static async getBookingHistory() {
        return this.request('/api/bookings-history');
    }

    // Get client details by ID
    static async getClient(clientId) {
        return this.request(`/api/client/${clientId}`);
    }

    // Get client mailing list info
    static async getClientMailingList(clientId) {
        return this.request(`/api/client/${clientId}/mailing-list`);
    }

    // Get client subscription cards
    static async getClientCards(clientId) {
        return this.request(`/api/client/${clientId}/cards`);
    }
}

//////////////////
// Controllers ///
//////////////////
class ModalController {
    constructor(modalId, triggerId = null, closeId = null) {
        this.modal = document.getElementById(modalId);
        this.trigger = triggerId ? document.querySelector(triggerId) : null;
        this.closeBtn = closeId ? document.querySelector(closeId) : null;
        this.overlay = document.querySelector('#modalOverlay');

        if (!this.modal) {
            console.warn(`Modal with ID ${modalId} not found.`);
            return;
        }

        this.init();
    }

    init() {
        if (this.trigger) {
            this.trigger.addEventListener('click', () => this.open());
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }

        this.modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    open() { 
        if (!this.modal) return;
        this.modal.classList.add('active');
        if (this.overlay) this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
     }
    close() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        if (this.overlay) this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    isOpen() {
        return this.modal && this.modal.classList.contains('active');
    }

    onSubmit(callback) {
        const form = this.modal.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                callback(e);
            });
        }
    }
}

class PaginationController {
    constructor(tableId, paginationContainerId, recordsPerPage = 10) {
        this.table = document.getElementById(tableId);
        this.paginationContainer = document.getElementById(paginationContainerId);
        this.recordsPerPage = recordsPerPage;
        this.currentPage = 1;
        this.totalRecords = 0;

        if (!this.table || !this.paginationContainer) {
            console.warn(`Pagination: Missing table (${tableId}) or pagination container (${paginationContainerId})`);
        }
    }

        /**
     * Render pagination buttons
     * @param {number} totalRecords - Total number of records
     * @param {function} onPageChange - Callback when page changes
     */
    render(totalRecords, onPageChange) {
        if (!this.paginationContainer) return;

        this.totalRecords = totalRecords;
        this.paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(totalRecords / this.recordsPerPage);

        if (totalPages <= 1) {
            this.currentPage = 1;
            return;
        }

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.innerText = i;
            button.classList.add('pagination-btn');
            
            if (i === this.currentPage) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                this.currentPage = i;
                if (onPageChange) {
                    onPageChange(i);
                }
                this.render(totalRecords, onPageChange);
            });

            this.paginationContainer.appendChild(button);
        }
    }
    /**
     * Get start and end indices for current page
     * @returns {object} { start, end }
     */
    getPageRange() {
        const start = (this.currentPage - 1) * this.recordsPerPage;
        const end = start + this.recordsPerPage;
        return { start, end };
    }

    /**
     * Reset pagination to first page
     */
    reset() {
        this.currentPage = 1;
    }

    /**
     * Get current page number
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Set records per page
     */
    setRecordsPerPage(count) {
        this.recordsPerPage = count;
        this.reset();
    }

}

///////////////////////
// Utility Functions //
///////////////////////
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('admin.html')) return 'admin';
        if (path.includes('clients.html')) return 'clients';
        if (path.includes('subscriptions.html')) return 'subscriptions';
        return null;
    }
    
    function errorHandler(error, message) {
        console.error(message, error);
        alert(message);
    }
    
    function formatClientDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('bg-BG');
    }
    
    function getSubscriptionStatus(status) {
        const statusMap = {
            5: 'Чакащ',
            6: 'Активна',
            7: 'Изтекла',
            8: 'Анулирана',
            9: 'Използвана'
        };
        return statusMap[status] || 'Неизвестен';
    }

    // Prevent double-tap zoom on mobile devices
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

/////////////////////
// Main App Logic //
///////////////////

document.addEventListener('DOMContentLoaded', function() {
let historyFilterController = null;

// Logout button handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await APIService.logout();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout');
        }
    });
}

///////////////////////////////////
// Admin page /////////////////////
///////////////////////////////////

    if (getCurrentPage() === 'admin') {
        loadPending();
        loadBookings();
        loadHolidays();

        const bookingModal = new ModalController('bookingModal', '.add-booking-btn', '#cancel-booking');

        bookingModal.onSubmit(handleBookingFormSubmit);

        // Attach holiday delete event listener once (event delegation)
        const holidaysTable = document.getElementById('holidaysTable');
        if (holidaysTable) {
            holidaysTable.addEventListener('click', async (e) => {
                if (e.target.classList.contains('remove-btn')) {
                    const id = e.target.dataset.id;
                    
                    // Validate ID exists
                    if (!id || id === 'undefined' || id === 'null') {
                        alert('Грешка: не може да се получи ID на почивния ден. Опитайте да обновите страницата.');
                        console.error('Invalid holiday ID:', id);
                        return;
                    }
                    
                    if (confirm('Сигурни ли сте, че искате да премахнете този почивен ден?')) {
                        await deleteHoliday(id);
                        await loadHolidays();
                    }
                }
            });
        }

        // Holidays calendar setup
        const calendarEl = document.getElementById('admin-calendar');
        // const requestServices = document.getElementById('requestServices');
        const bookingForm = document.getElementById('booking-form');

        // let selectedDate = null;
        // let selectedTime = null;

        // Render calendar
        if (calendarEl) {
            const times = [];
            for (let h = 8; h <= 20; h++) {
                times.push((h < 10 ? '0' : '') + h + ':00');
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
                    dayCol.innerHTML = `<div class="calendar-day-header">${dayName} <br> ${dateStr.slice(8,10)}.${dateStr.slice(5,7)}</div>`;
                    
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
                    APIService.getBookingsApproved(),
                    APIService.getHolidays(),
                    APIService.getPending(),
                    APIService.getBookingsHistoryApproved()
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
                                booking.client_name = `${booking.firstName} ${booking.lastname}`
                                slotBtn.classList.add('taken');
                                slotBtn.title = `Резервация #${booking.id}\nТип: ${booking.booking_type}\nИме: ${booking.client_name}\nТел: ${booking.phone}\nДата: ${booking.date}`;
                            } else if (pending) {
                                const booking = pendingBookings.find(d => d.date === dateStr && d.time === time && d.status === 1);
                                booking.client_name = `${booking.firstName} ${booking.lastname}`
                                slotBtn.classList.add('pending');
                                slotBtn.title = `Резервация #${booking.id}\nТип: ${booking.booking_type}\nИме: ${booking.client_name}\nТел: ${booking.phone}\nДата: ${booking.date}`;
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
            if (addHolidayBtn) {
                addHolidayBtn.addEventListener('click', handleAddHoliday);
            }

            async function handleAddHoliday() {
                    const holidays = [];
                    const headers = document.querySelectorAll('.calendar-day-header.selected');
                    const slots = document.querySelectorAll('.slot.selected');
                    const now = new Date();
                    
                    const approvedBookings = await APIService.getBookingsApproved();
                    const conflicts = [];

                    // Process headers (full days)
                    headers.forEach(header => {
                        const dayCol = header.closest('.calendar-day-col');
                        const dayIndex = Array.from(dayCol.parentNode.children).indexOf(dayCol);
                        const date = new Date(weekStart);
                        date.setDate(weekStart.getDate() + dayIndex);
                        const dateStr = date.toISOString().split('T')[0];

                        // Check if date is in the past
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) {
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

                    const result = await APIService.addHoliday(holidays, description);

                    if (result && result.message) {
                        alert(result.message);
                        // Clear selections
                        headers.forEach(h => h.classList.remove('selected'));
                        slots.forEach(s => s.classList.remove('selected'));
                        renderWeek(weekStart);
                        // Wait for holidays to reload with fresh data from server
                        await loadHolidays();
                    } else {
                        alert(result.error || 'Грешка при добавяне на почивка');
                    }
                };
            }
        }

        // Remove holiday
        async function deleteHoliday(id) {
            try {
                if (!id || id === 'undefined' || id === 'null') {
                    throw new Error('Invalid holiday ID provided to delete function');
                }
                const result = await APIService.deleteHoliday(id);
                if (result && result.message) {
                    alert(result.message);
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
                    renderWeek(weekStart);
                } else {
                    alert(result.error || 'Грешка при изтриване');
                }
            } catch (error) {
                // Check if it's a "holiday not found" error
                if (error.message && error.message.includes('не е намерен')) {
                    errorHandler(error, 'Този почивен ден не съществува или вече е изтрит. Опитайте да обновите страницата.');
                } else {
                    errorHandler(error, 'Грешка при изтриване на почивен ден');
                }
            }
        }

        // Handle booking form submission
        async function handleBookingFormSubmit(e) {
            const booking_type = document.getElementById('booking-type').value;
            const firstName = document.getElementById('firstName').value;
            const lastname = document.getElementById('lastname').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const note = document.getElementById('booking-note').value;
            const subscribe_email = document.getElementById('subscribe-email').checked;

            const calendarEl = document.getElementById('admin-calendar');
            const selectedSlot = calendarEl?.querySelector('.slot.selected');

            if (!selectedSlot) {
                alert('Моля, изберете дата и час от календара.');
                return;
            }

            const dayCol = selectedSlot.closest('.calendar-day-col');
            const dayIndex = Array.from(dayCol.parentNode.children).indexOf(dayCol);
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + dayIndex);
            const selectedDate = date.toISOString().split('T')[0];
            const selectedTime = selectedSlot.textContent;

            try {
                const result = await APIService.book({
                    booking_type, 
                    date: selectedDate, 
                    time: selectedTime,
                    firstName, 
                    lastname, 
                    phone, 
                    email, 
                    note, 
                    subscribe_email
                });
                if (result.error) {
                    alert(result.error);
                } else {
                    await updateBooking(result.id, 2);
                    bookingForm.reset();
                    selectedSlot.classList.remove('selected');
                    document.getElementById('booking-date-hour').value = '';
                    bookingModal.close();
                    renderWeek(weekStart);
                    loadPending();
                    loadBookings();
                }
            } catch (error) {
                errorHandler(error, 'Грешка при създаване на резервация');
            }
        }
        

        // Load pending bookings
        async function loadPending() {
            const pendingBookingsTable = document.getElementById('pendingBookingsTable');
            if (!pendingBookingsTable) return;
        
            const bookings = await APIService.getPending();
            const container = pendingBookingsTable.parentElement;
        
            if (bookings.length < 1) {
                container.innerHTML = '<p class="no-data-message">Няма нови заявки</p>';
                return;
            }
        
            if (!bookings) {
                container.innerHTML = '<p class="no-data-message">Грешка при зареждане на заявките</p>';
                return;
            }
        
            // Initialize pagination controller for pending bookings
            const pendingPagination = new PaginationController('pendingBookingsTable', 'pendingPagination', 2);
        
            function displayPendingBookings() {
                // Clear existing rows
                while (pendingBookingsTable.rows.length > 1) pendingBookingsTable.deleteRow(1);
            
                const { start, end } = pendingPagination.getPageRange();
                const paginatedBookings = bookings.slice(start, end);
            
                if (paginatedBookings.length === 0) {
                    container.innerHTML = '<p class="no-data-message">Няма нови заявки</p>';
                    return;
                }
            
                paginatedBookings.forEach(booking => {
                    const row = pendingBookingsTable.insertRow();
                    booking.client_name = `${booking.firstName} ${booking.lastname}`
                    const noteCell = booking.note ? `${booking.booking_type}<br>${booking.note}` : booking.booking_type;
                    row.innerHTML = `
                        <td>${booking.client_name}</td>
                        <td>${booking.date} ${booking.time}</td>
                        <td>${noteCell}</td>
                        <td>
                            <img src="Images/btn-yes-test.png" class="approve-btn" data-id="${booking.id}">
                            <img src="Images/btn-no-test.png" class="reject-btn" data-id="${booking.id}">
                        </td>
                    `;
                });
            
                // Render pagination with callback
                pendingPagination.render(bookings.length, () => {
                    displayPendingBookings();
                });
            }
        
            // Add event delegation for approve/reject buttons
            pendingBookingsTable.addEventListener('click', async (e) => {
                if (e.target.classList.contains('approve-btn')) {
                    if (confirm('Сигурни ли сте, че искате да одобрите този час?')) {
                        const id = e.target.dataset.id;
                        await updateBooking(id, 2);
                        document.getElementById('booking-date-hour').value = '';
                    }
                }
                if (e.target.classList.contains('reject-btn')) {             
                    if (confirm('Сигурни ли сте, че искате да откажете този час?')) {
                        const id = e.target.dataset.id;
                        await updateBooking(id, 4);
                    }   
                }
            });
        
            // Initial display
            displayPendingBookings();
        }

        // Approve or reject booking
        async function updateBooking(id, status) {
            try {
                const result = await APIService.approveBooking(id, status);
                alert(result.message || result.error);
                loadPending();
                loadBookings();

                const calendarEl = document.getElementById('admin-calendar');
                if (calendarEl) {
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
                    renderWeek(weekStart);
                }
            } catch (error) {
                errorHandler(error, 'Грешка при обработка на резервацията');
            }
        }

        // Load approved bookings
        async function loadBookings() {
            const approvedBookingsTable = document.getElementById('approvedBookingsTable');
            if (!approvedBookingsTable) return;

            const bookings = await APIService.getBookingsApproved();
            const container = approvedBookingsTable.parentElement;

            if (bookings.length < 1) {
                container.innerHTML = '<p class="no-data-message">Няма предстоящи тренировки.</p>';
                return;
            }
        
            if (!bookings) {
                container.innerHTML = '<p class="no-data-message">Грешка при зареждане на тренировките</p>';
                return;
            }
        
            // Initialize pagination controller for approved bookings
            const approvedPagination = new PaginationController('approvedBookingsTable', 'approvedPagination', 5);
        
            function displayApprovedBookings() {
                // Clear existing rows
                while (approvedBookingsTable.rows.length > 1) approvedBookingsTable.deleteRow(1);
            
                const { start, end } = approvedPagination.getPageRange();
                const paginatedBookings = bookings.slice(start, end);
            
                if (paginatedBookings.length === 0) {
                    container.innerHTML = '<p class="no-data-message">Няма предстоящи тренировки.</p>';
                    return;
                }
            
                paginatedBookings.forEach(booking => {
                    const row = approvedBookingsTable.insertRow();
                    booking.client_name = `${booking.firstName} ${booking.lastname}`
                    const noteCell = booking.note ? `${booking.booking_type}<br>${booking.note}` : booking.booking_type;
                    row.innerHTML = `
                        <td>${booking.client_name}</td>
                        <td>${booking.date}</td>
                        <td>${noteCell}</td>
                        <td>
                            <img src="Images/btn-no-test.png" class="cancel-btn" data-id="${booking.id}">
                        </td>
                    `;
                });
            
                // Render pagination with callback
                approvedPagination.render(bookings.length, () => {
                    displayApprovedBookings();
                });
            }
        
            // Add event delegation for cancel button
            approvedBookingsTable.addEventListener('click', async (e) => {
                if (e.target.classList.contains('cancel-btn')) {
                    if (confirm('Сигурни ли сте, че искате да отмените този час?')) {
                        const id = e.target.dataset.id;
                        await updateBooking(id, 3);
                    }
                }
            });
        
            // Initial display
            displayApprovedBookings();
        }

        // Load holidays
        async function loadHolidays() {
            const holidaysTable = document.getElementById('holidaysTable');
            if (!holidaysTable) return; 

            const holidays = await APIService.getHolidays();
            const container = holidaysTable.parentElement;

                if (holidays.length < 1) {
                    container.innerHTML = '<p class="no-data-message">Няма предстоящи почивни дни/часове</p>';
                    return;
                }

                if (!holidays) {
                    container.innerHTML = '<p class="no-data-message">Грешка при зареждане на почивните дни</p>';
                    return;
                }

            // Initialize pagination controller for holidays
            const holidayPagination = new PaginationController('holidaysTable', 'holidayPagination', 5);

            function displayHolidays() {
                while (holidaysTable.rows.length > 1) holidaysTable.deleteRow(1);

                const { start, end } = holidayPagination.getPageRange();
                const paginatedHolidays = holidays.slice(start, end);

                if (paginatedHolidays.length === 0) {
                    container.innerHTML = '<p class="no-data-message">Няма предстоящи почивни дни/часове</p>';
                    return;
                }

                paginatedHolidays.forEach(holiday => {
                    if (!holiday.id) {
                        console.warn('Holiday missing ID:', holiday);
                        return; // Skip holidays without IDs
                    }
                    const row = holidaysTable.insertRow();
                    row.innerHTML = `
                        <td>${holiday.date}</td>
                        <td>${holiday.time || 'Цял ден'}</td>
                        <td>${holiday.description || ''}</td>
                        <td>
                            <button class="remove-btn" data-id="${holiday.id}">Отмени</button>
                        </td>
                    `;
                });

                // Render pagination with callback
                holidayPagination.render(holidays.length, () => {
                    displayHolidays();
                });
            }

            displayHolidays();

            // Automatically deactivate past holidays
            await APIService.autoDeactivatePastHolidays();
        }

        document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await APIService.logout();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout');
        }
        });
    }

///////////////////////////////////
// Clients page ///////////////////
///////////////////////////////////

    if (getCurrentPage() === 'clients') {
        const bookingHistoryTable = document.getElementById('bookingHistoryTable');
        const clientsTable = document.getElementById('clientsTable');

        if (bookingHistoryTable && clientsTable) {
            // Initialize async functions
            (async () => {
                historyFilterController = await loadHistory();
                loadClients();

                const clearDateFilterBtn = document.getElementById('clearFilters');
                if (clearDateFilterBtn) {
                    clearDateFilter();
                }
            })();
        }
    
        // Mobile drawer functionality
        if (window.innerWidth <= 768) {
            const showHideBtn = document.querySelector('.mobile-only .showhide');
            const container = document.querySelector('.mobile-only .container');
            
            if (showHideBtn && container) {
                let isOpen = false;
                let isDragging = false;
                let startY = 0;
                let currentY = 0;
                
                // Initialize button position
                showHideBtn.style.right = '0';
                currentY = window.innerHeight / 2;
                showHideBtn.style.top = currentY + 'px';
                container.style.top = currentY + 'px';
                
                // Toggle drawer on button click
                showHideBtn.addEventListener('click', (e) => {
                    if (!isDragging) {
                        isOpen = !isOpen;
                        updateDrawerPosition();
                    }
                });
                
                // Mouse down - start dragging
                showHideBtn.addEventListener('mousedown', (e) => {
                    isDragging = false;
                    startY = e.clientY;
                    currentY = parseInt(window.getComputedStyle(showHideBtn).top) || window.innerHeight / 2;
                });
                
                // Touch start - for mobile devices
                showHideBtn.addEventListener('touchstart', (e) => {
                    isDragging = false;
                    startY = e.touches[0].clientY;
                    currentY = parseInt(window.getComputedStyle(showHideBtn).top) || window.innerHeight / 2;
                }, { passive: false });
                
                // Mouse move - drag the button and container
                document.addEventListener('mousemove', (e) => {
                    if (e.buttons === 1 && Math.abs(e.clientY - startY) > 10) {
                        isDragging = true;
                        const diff = e.clientY - startY;
                        let newY = currentY + diff;
                        
                        // Constrain button within viewport
                        newY = Math.max(0, Math.min(newY, window.innerHeight - showHideBtn.offsetHeight));
                        
                        showHideBtn.style.top = newY + 'px';
                        // Make container follow the button
                        container.style.top = newY + 'px';
                    }
                });
                
                // Touch move - drag the button and container on mobile
                document.addEventListener('touchmove', (e) => {
                    if (isDragging) {
                        e.preventDefault(); // Prevent scrolling while dragging
                        const diff = e.touches[0].clientY - startY;
                        let newY = currentY + diff;
                        
                        // Constrain button within viewport
                        newY = Math.max(0, Math.min(newY, window.innerHeight - showHideBtn.offsetHeight));
                        
                        showHideBtn.style.top = newY + 'px';
                        // Make container follow the button
                        container.style.top = newY + 'px';
                    }
                }, { passive: false });
                
                // Mouse up - stop dragging
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                    }
                });
                
                // Touch end - stop dragging on mobile
                document.addEventListener('touchend', () => {
                    if (isDragging) {
                        isDragging = false;
                    }
                });
                
                // Detect drag start on touch to prevent scroll
                showHideBtn.addEventListener('touchstart', (e) => {
                    startY = e.touches[0].clientY;
                    currentY = parseInt(window.getComputedStyle(showHideBtn).top) || window.innerHeight / 2;
                }, { passive: false });
                
                showHideBtn.addEventListener('touchmove', (e) => {
                    const diff = Math.abs(e.touches[0].clientY - startY);
                    // If user is dragging vertically, mark as dragging and prevent scroll
                    if (diff > 10) {
                        isDragging = true;
                        e.preventDefault();
                    }
                }, { passive: false });
                
                // Update drawer position
                function updateDrawerPosition() {
                    if (isOpen) {
                        container.style.right = '0';
                        container.style.pointerEvents = 'auto';
                        showHideBtn.style.right = '40vw';
                    } else {
                        container.style.right = '-40vw';
                        container.style.pointerEvents = 'none';
                        showHideBtn.style.right = '0';
                    }
                }
                
                // Handle window resize
                window.addEventListener('resize', () => {
                    if (window.innerWidth > 768) {
                        // Reset to desktop view
                        isOpen = false;
                        showHideBtn.style.display = 'none';
                    }
                });
            }
        }
        else {
            const showHideBtn = document.querySelector('.mobile-only .showhide');
            showHideBtn.style.display = 'none';
        }

        // Clear date filter
        async function clearDateFilter() {
            const clearDateFilterBtn = document.getElementById('clearFilters');
            if (clearDateFilterBtn) {
                clearDateFilterBtn.addEventListener('click', () => {
                    const startDateInput = document.getElementById('startDate');
                    const endDateInput = document.getElementById('endDate');
                    if (startDateInput) startDateInput.value = '';
                    if (endDateInput) endDateInput.value = '';

                    if (historyFilterController) {
                        historyFilterController.clearClientFilter();
                    }
                });
            }
        }

        // Load clients from API
        async function loadClients() {
            const clientsTable = document.getElementById('clientsTable');
            if (!clientsTable) return;

            const clients = await APIService.getClients();

                if (clients.length < 1) {
                    clientsTable.parentElement.innerHTML = '<p class="no-data-message">Няма регистрирани клиенти</p>';
                    return;
                }

                if (!clients) {
                    clientsTable.parentElement.innerHTML = '<p class="no-data-message">Грешка при зареждане на клиентите</p>';
                    return;
                }

            while (clientsTable.rows.length > 1) clientsTable.deleteRow(1);
            clients.forEach(client => {
                const row = clientsTable.insertRow();
                row.innerHTML = `<td>${client.firstName} ${client.lastname}</td>`;
                row.style.cursor = 'pointer';

                row.addEventListener('click', async () => {
                    await showClientInfo(client.client_id); 
                });
            })
        }

        // Show client info
        async function showClientInfo(clientId) {
        try {
            const client = await APIService.getClient(clientId);

            const topClients = document.querySelector('.topClients');
            const clientInfo = document.querySelector('.clientInfo');
            const closeBtn = document.querySelector('.close-client-info');

            document.getElementById('clientName').textContent = `${client.firstName} ${client.lastname}`;
            document.getElementById('clientPhone').textContent = client.phone || 'N/A';
            if (client.phone) document.getElementById('clientPhone').href = 'tel:' + client.phone;
            document.getElementById('clientEmail').textContent = client.email || 'N/A';
            if (client.email) document.getElementById('clientEmail').href = 'mailto:' + client.email;
            document.getElementById('clientCreated').textContent = formatClientDate(client.stamp_created);

            const mailingList = await APIService.getClientMailingList(clientId);

            const cards = await APIService.getClientCards(clientId);

            const mailingListSection = document.getElementById('mailingListSection');
            if (mailingList && mailingList.date_subscribed) {
                document.getElementById('mailingListDate').textContent = formatClientDate(mailingList.date_subscribed);
                mailingListSection.style.display = 'block';
            } else {
                mailingListSection.style.display = 'none';
            }

            const cardSection = document.getElementById('cardSection');
            const clientCards = document.getElementById('clientCards');
            if (cards && cards.length > 0) {
                clientCards.innerHTML = '';
                cards.forEach(card => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card-item';
                    cardDiv.innerHTML = `
                        <h5>${card.service_name}</h5>
                        <div class="card-item-detail">
                            <label>Статус:</label>
                            <span>${getSubscriptionStatus(card.subscription_status)}</span>
                        </div>
                        <div class="card-item-detail">
                            <label>Кредити:</label>
                            <span>${card.credits_balance}</span>
                        </div>
                        <div class="card-item-detail">
                            <label>Заявена на:</label>
                            <span>${(card.stamp_created)}</span>
                        </div>
                        <div class="card-item-detail">
                            <label>За период:</label>
                            <span>${formatClientDate(card.start_date)} - ${formatClientDate(card.end_date)}</span>
                        </div>
                    `;
                    clientCards.appendChild(cardDiv);
                });
                cardSection.style.display = 'block';
            } else {
                cardSection.style.display = 'none';
            }

            topClients.style.display = 'none';
            clientInfo.style.display = 'block';

            filterBookingHistoryByClient(client.firstName, client.lastname);

            closeBtn.onclick = () => {
                clientInfo.style.display = 'none';
                topClients.style.display = 'flex';
                resetBookingHistoryFilter();
            };

        } catch (error) {
            errorHandler(error, 'Грешка при зареждане на информацията на клиента');
        }
        }

        // Filter by client
        function filterBookingHistoryByClient(firstName, lastname) {
            const clientName = `${firstName} ${lastname}`;
            if (historyFilterController) {
                historyFilterController.setClientFilter(clientName);
            }
        }

        // Reset booking history filter
        function resetBookingHistoryFilter() {
            if (historyFilterController) {
                historyFilterController.clearClientFilter();
            }
        }

        // Load booking history with filters
        async function loadHistory() {
            const bookingHistoryTable = document.getElementById('bookingHistoryTable');
            const paginationContainer = document.getElementById('historyPagination');
            const filterButtons = document.querySelectorAll('.by-status .slot');
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');

            if (!bookingHistoryTable || !paginationContainer || !startDateInput || !endDateInput) {
                console.warn('Required history filter elements not found');
                return {
                    setClientFilter: () => {},
                    clearClientFilter: () => {}
                };
            }

            try {
                const bookings = await APIService.getBookingHistory();

                let filteredBookings = [...bookings];
                let selectedClient = null;
                let activeStatusFilter = null;

                const paginationController = new PaginationController('bookingHistoryTable', 'historyPagination', 10);

                function applyFilters() {
                    filteredBookings = [...bookings];

                    if (selectedClient) {
                        filteredBookings = filteredBookings.filter(booking => {
                            const clientName = `${booking.firstName} ${booking.lastname}`;
                            return clientName === selectedClient;
                        });
                    }

                    if (activeStatusFilter) {
                        filteredBookings = filteredBookings.filter(booking => booking.status === activeStatusFilter);
                    }

                    if (startDateInput.value || endDateInput.value) {
                        filteredBookings = filteredBookings.filter(booking => {
                            const bookingDate = new Date(booking.date);
                            const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
                            const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

                            if (startDate && bookingDate < startDate) return false;
                            if (endDate && bookingDate > endDate) return false;
                            return true;
                        });
                    }

                    paginationController.reset();
                    displayBookings(paginationController.getCurrentPage());
                }

                // Status filter buttons
                filterButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        if (button.classList.contains('active')) {
                            button.classList.remove('active');
                            activeStatusFilter = null;
                        } else {
                            filterButtons.forEach(btn => btn.classList.remove('active'));
                            button.classList.add('active');

                            if (button.classList.contains('pending')) {
                                activeStatusFilter = 1;
                            } else if (button.classList.contains('available')) {
                                activeStatusFilter = 2;
                            } else if (button.classList.contains('rejected')) {
                                activeStatusFilter = 4;
                            } else if (button.classList.contains('canceled')) {
                                activeStatusFilter = 3;
                            }
                        }
                        applyFilters();
                    });
                });

                startDateInput.addEventListener('change', applyFilters);
                endDateInput.addEventListener('change', applyFilters);

                function displayBookings(page) {
                    const tableContainer = bookingHistoryTable.parentElement;
                    const existingMsg = tableContainer.querySelector('.no-data-message');
                    if (existingMsg) existingMsg.remove();

                    while (bookingHistoryTable.rows.length > 1) bookingHistoryTable.deleteRow(1);

                    const { start, end } = paginationController.getPageRange();
                    const paginatedBookings = filteredBookings.slice(start, end);

                    if (paginatedBookings.length === 0) {
                        const noDataMsg = document.createElement('p');
                        noDataMsg.className = 'no-data-message';
                        noDataMsg.textContent = 'Няма заявки, отговарящи на избраните филтри';
                        tableContainer.appendChild(noDataMsg);
                        paginationContainer.innerHTML = '';
                        return;
                    }

                    paginatedBookings.forEach(booking => {
                        const row = bookingHistoryTable.insertRow();
                        row.classList.add('row-initial');
                        booking.client_name = `${booking.firstName} ${booking.lastname}`
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

                        setTimeout(() => {
                            row.classList.remove('row-initial');
                        }, 50 * bookingHistoryTable.rows.length);
                    });

                    paginationController.render(filteredBookings.length, (page) => {
                        displayBookings(page);
                    });
                }

                displayBookings(paginationController.getCurrentPage());

                return {
                    setClientFilter: (clientName) => {
                        selectedClient = clientName;
                        applyFilters();
                    },
                    clearClientFilter: () => {
                        selectedClient = null;
                        startDateInput.value = '';
                        endDateInput.value = '';
                        activeStatusFilter = null;
                        filterButtons.forEach(btn => btn.classList.remove('active'));
                        applyFilters();
                    }
                };

             } catch (error) {
                console.error('Error loading history:', error);
                return {
                    setClientFilter: () => {},
                    clearClientFilter: () => {}
                };
            }
        }

        document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await APIService.logout();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout');
        }
        });
    }

///////////////////////////////////
// Subscriptions page  ////////////
///////////////////////////////////

    if (getCurrentPage() === 'subscriptions') {
        document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await APIService.logout();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout');
        }
        });
    }

});

// 3. TableFilterController - Skeleton for future use
class TableFilterController {
    constructor(tableId, paginationId, recordsPerPage = 10) {
        this.tableId = tableId;
        this.paginationId = paginationId;
        this.recordsPerPage = recordsPerPage;
        // TODO: Implement filter logic when needed
    }
}

// 4. NotificationService - for future
class NotificationService {
    // TODO: Implement notification system
}
