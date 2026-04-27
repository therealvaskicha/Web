// Booking domain - SQL queries
module.exports = {
    getCompletedBookingsCalendar: `
    SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
        from booking
        WHERE date <= curdate()
    `,
    fillBookings: `
    call fillBookings();
    `
};
