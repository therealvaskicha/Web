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

    ////////////////////
    // CALENDAR API's //
    ////////////////////

    static async getPendingC() {
        return this.request('/api/c-pending');
    }

    static async getApprovedRequestsC() {
        return this.request('/api/c-approved-requests');
    }

    static async getBookingsHistoryApprovedC() {
        return this.request('/api/c-completed-bookings');
    }

    static async getHolidaysC() {
        return this.request('/api/c-holidays');
    }

    /////////////////
    // TABLE API's //
    /////////////////

    // Requests
    static async getPending() {
        return this.request('/api/pending');
    }

    static async getApprovedRequests() {
        return this.request('/api/approved-requests');
    }

    static async getHolidays() {
        return this.request ('/api/holidays');
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
    static async deleteHoliday(date) {
        return this.request('/api/disable-holiday', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date })
        });
    }

    // Auto-deactivate past holidays
    static async autoDeactivatePastHolidays() {
        return this.request('/api/auto-deactivate-past-holidays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Request an appointment
    static async makerequest(requestData) {
        return this.request('/api/makerequest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
    }

    // Create bookings
    static async book() {
        return this.request('/api/book', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify()
        })
    }

    // Approve a request
    static async approveRequest(data) {
        return this.request('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    // Reject a request
    static async rejectRequest(data) {
        return this.request('/api/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    // Cancel a request
    static async cancelRequest(data) {
        return this.request('/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    // Get all clients
    static async getClients() {
        return this.request('/api/clients');
    }

    // Get request history
    static async getRequestHistory() {
        return this.request('/api/request-history');
    }

    // Get client details by ID
    static async getClient(firstName, lastName, phone) {
        return this.request(`/api/client/${firstName}/${lastName}/${phone}`);
    }

    // Get client mailing list info
    static async getClientMailingList(firstName, lastName, phone) {
        return this.request(`/api/client/${firstName}/${lastName}/${phone}/mailing-list`);
    }

    // Get client subscription cards
    static async getClientCards(firstName, lastName, phone) {
        return this.request(`/api/client/${firstName}/${lastName}/${phone}/cards`);
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
        loadRequests();
        loadHolidays();

        const requestModal = new ModalController('requestModal', '.add-booking-btn', '#cancel-booking');

        requestModal.onSubmit(handleRequestFormSubmit);

        // Attach holiday delete event listener once (event delegation)
        const holidaysTable = document.getElementById('holidaysTable');
        if (holidaysTable) {
            holidaysTable.addEventListener('click', async (e) => {
                if (e.target.classList.contains('remove-btn')) {
                    const datetime = e.target.dataset.id;
                    
                    // Validate ID exists
                    if (!datetime) {
                        alert('Грешка: Не намирам празника. Опитайте да обновите страницата.');
                        console.error('Невалиден празничен идентификатор:', datetime);
                        return;
                    }
                    
                    if (confirm('Сигурни ли сте, че искате да премахнете този почивен ден?')) {
                        await deleteHoliday(datetime);
                        await loadHolidays();
                    }
                }
            });
        }

        function highlightTableRow(dateStr, time) {
            const allRows = document.querySelectorAll('table tbody tr, table tr.highlighted');
            const datetimeStr = `${dateStr} ${time}`;
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 1) {
                        const cellText = cells[1].textContent.trim();
                        if (cellText === datetimeStr) {
                            row.classList.add('highlighted');
                        }
                    }
                });
            });
        }

        function deHighlightTableRow(dateStr, time) {
            const allRows = document.querySelectorAll('table tbody tr, table tr.highlighted');
            const datetimeStr = `${dateStr} ${time}`;
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 1) {
                        const cellText = cells[1].textContent.trim();
                        if (cellText === datetimeStr) {
                            row.classList.remove('highlighted');
                        }
                    }
                });
            });
        }

        // Holidays calendar setup
        const calendarEl = document.getElementById('admin-calendar');
        const requestForm = document.getElementById('request-form');

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
                    APIService.getApprovedRequestsC(),
                    APIService.getHolidaysC(),
                    APIService.getPendingC(),
                    APIService.getBookingsHistoryApprovedC()
                ]).then(([approved, holidays, pendingRequests, bookings]) => { // bookings, holidays, pendingBookings, historicalBookings
                    for (let d = 0; d < 7; d++) {
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + d);
                        const dateStr = date.toISOString().split('T')[0];
                        const dayCol = weekRow.children[d];
                        const slotsCol = dayCol.querySelector('.calendar-slots-col');
                        // Check for full-day holiday (time === '00:00:00')
                        const fullDayHoliday = holidays.find(h => h.date === dateStr && h.time === '00:00:00');
                        if (fullDayHoliday) {
                            dayCol.classList.add('holiday');
                            slotsCol.innerHTML = '<div class="holiday-label">Почивен ден</div>';
                            continue;
                        }
                        times.forEach(time => {
                            const taken = approved.some(b => b.date === dateStr && b.time === time) || 
                                        bookings.some(b => b.date === dateStr && b.time === time);
                            const pending = pendingRequests.some(d => d.date === dateStr && d.time === time);
                            const isHoliday = holidays.some(h => h.date === dateStr && (h.time === '00:00' || h.time === time));

                            const slotBtn = document.createElement('button');
                            const bookingDateHour = document.getElementById('booking-date-hour');

                            slotBtn.className = 'slot';
                            slotBtn.textContent = time;

                            if (isHoliday) {
                                const holiday = holidays.find(h => h.date === dateStr && (h.time === '00:00' || h.time === time));
                                slotBtn.classList.add('holiday');
                                slotBtn.title = `${holiday.description || 'Почивен ден'}`
                            } else if (taken) {
                                const request = approved.find(b => b.date === dateStr && b.time === time) ||
                                                bookings.find(b => b.date === dateStr && b.time === time);
                                slotBtn.classList.add('taken');
                            } else if (pending) {
                                const request = pendingRequests.find(d => d.date === dateStr && d.time === time && d.status === 1);
                                slotBtn.classList.add('pending');
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
                                deHighlightTableRow(dateStr, time);
                                } else {
                                slotBtn.classList.add('selected');
                                selectedDate = dateStr;
                                selectedTime = time;
                                bookingDateHour.value = `${dateStr} ${time}`;
                                highlightTableRow(dateStr, time);
                                }
                            };
                            slotsCol.appendChild(slotBtn);
                        });
                    }
                });
            }

            if (requestForm) {
                document.getElementById('cancel-booking').onclick = () => {
                const previouslySelected = document.querySelector('.slot.selected');
                if (previouslySelected) {
                    previouslySelected.classList.remove('selected');
                }
                // Remove row highlighting
                const highlightedRows = document.querySelectorAll('table tr.highlighted');
                highlightedRows.forEach(row => row.classList.remove('highlighted'));

                requestForm.reset(); 
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
                    
                    const approvedBookings = await APIService.getApprovedRequestsC();
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
                            dayConflicts.forEach(request => {
                                conflicts.push(`Предстояща тренировка: ${request.date} ${request.time}`);
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
                    } else {
                        alert(result.error || 'Грешка при добавяне на почивка');
                    }
                    loadHolidays();
                };
            }
        }

        // Remove holiday
        async function deleteHoliday(date) {
            try {
                if (!date || date === 'undefined' || date === 'null') {
                    throw new Error('Invalid holiday date provided to delete function');
                }
                const result = await APIService.deleteHoliday(date);
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
        async function handleRequestFormSubmit(e) {
            const booking_type = document.getElementById('booking-type').value;
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
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
                const result = await APIService.requestlog({
                    booking_type, 
                    date: selectedDate, 
                    time: selectedTime,
                    firstName, 
                    lastName, 
                    phone, 
                    email, 
                    note, 
                    subscribe_email
                });
                if (result.error) {
                    alert(result.error);
                } else {
                    // Construct composite key for the newly created request
                    const compositeKey = `${firstName}|${lastName}|${selectedDate}|${selectedTime}|${booking_type}`;
                    await updateRequest(compositeKey, 1);
                    requestForm.reset();
                    selectedSlot.classList.remove('selected');
                    document.getElementById('booking-date-hour').value = '';
                    requestModal.close();
                    renderWeek(weekStart);
                }
            } catch (error) {
                errorHandler(error, 'Грешка при създаване на резервация');
            }
            loadPending();
            loadRequests();
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
            const pendingPagination = new PaginationController('pendingBookingsTable', 'pendingPagination', 5);
        
            function displayPendingBookings() {
                // Clear existing rows
                while (pendingBookingsTable.rows.length > 1) pendingBookingsTable.deleteRow(1);
            
                const { start, end } = pendingPagination.getPageRange();
                const paginatedBookings = bookings.slice(start, end);
            
                if (paginatedBookings.length === 0) {
                    container.innerHTML = '<p class="no-data-message">Няма нови заявки</p>';
                    return;
                }
            
                paginatedBookings.forEach(request => {
                    const row = pendingBookingsTable.insertRow();
                    request.client_name = `${request.firstName} ${request.lastName}`
                    const noteCell = request.note ? `${request.booking_type}<br>${request.note}` : request.booking_type;
                    // Use composite key instead of id
                    const compositeKey = `${request.firstName}|${request.lastName}|${request.date}|${request.time}|${request.booking_type}`;
                    row.innerHTML = `
                        <td>${request.client_name}</td>
                        <td>${request.date} ${request.time}</td>
                        <td>${noteCell}</td>
                        <td>
                            <img src="Images/btn-yes-test.png" title="Одобри" class="approve-btn" data-key="${compositeKey}">
                            <img src="Images/btn-no-test.png" title="Откажи" class="reject-btn" data-key="${compositeKey}">
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
                        const key = e.target.dataset.key;
                        await updateRequest(key, 1);
                        document.getElementById('booking-date-hour').value = '';
                    }
                }
                if (e.target.classList.contains('reject-btn')) {             
                    if (confirm('Сигурни ли сте, че искате да откажете този час?')) {
                        const key = e.target.dataset.key;
                        await updateRequest(key, 2);
                    }   
                }
            });
        
            // Initial display
            displayPendingBookings();
        }

        // Approve, reject, or cancel request
        async function updateRequest(compositeKey, action) {
            try {
                // Parse composite key: firstName|lastName|date|time|booking_type
                const [firstName, lastName, date, time, booking_type] = compositeKey.split('|');
                const data = { firstName, lastName, date, time, booking_type };
                
                let result;
                if (action === 1) {
                    result = await APIService.approveRequest(data);
                } else if (action === 2) {
                    result = await APIService.rejectRequest(data);
                } else if (action === 3) {
                    result = await APIService.cancelRequest(data);
                } else {
                    throw new Error('Invalid action: ' + action);
                }
                
                alert(result.message || result.error);
                loadPending();
                loadRequests();

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

        // Load approved requests
        async function loadRequests() {
            const approvedBookingsTable = document.getElementById('approvedBookingsTable');
            if (!approvedBookingsTable) return;

            const requests = await APIService.getApprovedRequests();
            const container = approvedBookingsTable.parentElement;

            if (requests.length < 1) {
                container.innerHTML = '<p class="no-data-message">Няма предстоящи тренировки.</p>';
                return;
            }
        
            if (!requests) {
                container.innerHTML = '<p class="no-data-message">Грешка при зареждане на тренировките</p>';
                return;
            }
        
            // Initialize pagination controller for approved requests
            const approvedPagination = new PaginationController('approvedBookingsTable', 'approvedPagination', 5);
        
            function displayApprovedRequests() {
                // Clear existing rows
                while (approvedBookingsTable.rows.length > 1) approvedBookingsTable.deleteRow(1);
            
                const { start, end } = approvedPagination.getPageRange();
                const paginatedBookings = requests.slice(start, end);
            
                if (paginatedBookings.length === 0) {
                    container.innerHTML = '<p class="no-data-message">Няма предстоящи тренировки.</p>';
                    return;
                }
            
                paginatedBookings.forEach(request => {
                    const row = approvedBookingsTable.insertRow();
                    request.client_name = `${request.firstName} ${request.lastName}`
                    const noteCell = request.note ? `${request.booking_type}<br>${request.note}` : request.booking_type;
                    const compositeKey = `${request.firstName}|${request.lastName}|${request.date}|${request.time}|${request.booking_type}`;
                    row.innerHTML = `
                        <td>${request.client_name}</td>
                        <td>${request.date} ${request.time}</td>
                        <td>${noteCell}</td>
                        <td>
                            <img src="Images/btn-no-test.png" class="cancel-btn" title="Отмени" data-key="${compositeKey}">
                        </td>
                    `;
                });
            
                // Render pagination with callback
                approvedPagination.render(requests.length, () => {
                    displayApprovedRequests();
                });
            }
        
            // Add event delegation for cancel button
            approvedBookingsTable.addEventListener('click', async (e) => {
                if (e.target.classList.contains('cancel-btn')) {
                    if (confirm('Сигурни ли сте, че искате да отмените този час?')) {
                        const key = e.target.dataset.key;
                        await updateRequest(key, 3);
                    }
                }
            });
        
            // Initial display
            displayApprovedRequests();
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
                    if (!holiday.date) {
                        console.warn('Holiday missing date:', holiday);
                        return; // Skip holidays without dates
                    }
                    const row = holidaysTable.insertRow();
                    row.innerHTML = `
                        <td>${holiday.date}</td>
                        <td>${holiday.time === '00:00' ? 'Цял ден' : holiday.time}</td>
                        <td>${holiday.description || ''}</td>
                        <td>
                            <button class="remove-btn" data-id="${holiday.date} ${holiday.time}">Отмени</button>
                        </td>
                    `;
                });

                // Render pagination with callback
                holidayPagination.render(holidays.length, () => {
                    displayHolidays();
                });
            }

            displayHolidays();
        }

        const refreshBtn = document.querySelector('.refresh-btn');

        refreshBtn.addEventListener('click', async () => {
            try {
                await APIService.book();
            } catch (error) {
                console.error('Error filling bookings: ', error);
                alert('Грешка при обновяване на резервациите. Моля, опитайте отново.');
            }});

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
                row.innerHTML = `<td>${client.firstName} ${client.lastName}</td>`;
                row.style.cursor = 'pointer';

                row.addEventListener('click', async () => {
                    await showClientInfo(client.firstName, client.lastName, client.phone); 
                });
            })
        }

        // Show client info
        async function showClientInfo(firstName, lastName, phone) {
        try {
            const client = await APIService.getClient(firstName, lastName, phone);

            const topClients = document.querySelector('.topClients');
            const clientInfo = document.querySelector('.clientInfo');
            const closeBtn = document.querySelector('.close-client-info');

            document.getElementById('clientName').textContent = `${firstName} ${lastName}`;
            document.getElementById('clientPhone').textContent = phone || 'N/A';
            if (phone) document.getElementById('clientPhone').href = 'tel:' + phone;
            document.getElementById('clientEmail').textContent = client.email || 'N/A';
            if (client.email) document.getElementById('clientEmail').href = 'mailto:' + client.email;
            document.getElementById('clientCreated').textContent = formatClientDate(client.stamp_created);

            const mailingList = await APIService.getClientMailingList(firstName, lastName, phone);

            const cards = await APIService.getClientCards(firstName, lastName, phone);

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

            filterBookingHistoryByClient(client.firstName, client.lastName);

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
        function filterBookingHistoryByClient(firstName, lastName) {
            const clientName = `${firstName} ${lastName}`;
            if (historyFilterController) {
                historyFilterController.setClientFilter(clientName);
            }
        }

        // Reset request history filter
        function resetBookingHistoryFilter() {
            if (historyFilterController) {
                historyFilterController.clearClientFilter();
            }
        }

        // Load request history with filters
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
                const bookings = await APIService.getRequestHistory();

                let filteredBookings = [...bookings];
                let selectedClient = null;
                let activeStatusFilter = null;

                const paginationController = new PaginationController('bookingHistoryTable', 'historyPagination', 10);

                function applyFilters() {
                    filteredBookings = [...bookings];

                    if (selectedClient) {
                        filteredBookings = filteredBookings.filter(request => {
                            const clientName = `${request.firstName} ${request.lastName}`;
                            return clientName === selectedClient;
                        });
                    }

                    if (activeStatusFilter) {
                        filteredBookings = filteredBookings.filter(request => request.status === activeStatusFilter);
                    }

                    if (startDateInput.value || endDateInput.value) {
                        filteredBookings = filteredBookings.filter(request => {
                            const requestDate = new Date(request.date);
                            const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
                            const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

                            if (startDate && requestDate < startDate) return false;
                            if (endDate && requestDate > endDate) return false;
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
                            } else if (button.classList.contains('taken')) {
                                activeStatusFilter = 2;
                            } else if (button.classList.contains('approved')) {
                                activeStatusFilter = 3;
                            } else if (button.classList.contains('past')) {
                                activeStatusFilter = 5;
                            } else if (button.classList.contains('rejected')) {
                                activeStatusFilter = 7;
                            } else if (button.classList.contains('canceled')) {
                                activeStatusFilter = 9;
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

                    paginatedBookings.forEach(request => {
                        const row = bookingHistoryTable.insertRow();
                        row.classList.add('row-initial');
                        request.client_name = `${request.firstName} ${request.lastName}`
                        row.innerHTML = `
                            <td>${request.client_name}</td>
                            <td>${request.booking_type}</td>
                            <td>${request.date}</td>
                            <td>${request.time}</td>
                            <td>${request.stamp_created}</td>
                        `;

                        switch (request.status) {
                            case 9:
                                row.classList.add('row-canceled');
                                break;
                            case 7:
                                row.classList.add('row-rejected');
                                break;
                            case 2:
                                row.classList.add('row-taken');
                                break;
                            case 5:
                                row.classList.add('row-past');
                                break;
                            case 3:
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
