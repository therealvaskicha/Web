// Booking domain - SQL queries

module.exports = {

    insertBooking: `
      INSERT INTO booking (order_id, product_id, client_id, date, status) VALUES (?, ?, ?, ?, 5)
    `,
    getCompletedBookingsCalendar: `
    SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
        from booking
        WHERE date <= curdate()
    `,
};
