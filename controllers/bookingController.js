// Booking Controller - thin layer for HTTP concerns
const bookingDomain = require('../data/booking/booking');

async function getCompletedBookingsCalendar(req, res) {
    try {
        await bookingDomain.getCompletedBookingsCalendar(req, res);
        
    } catch (error) {
        console.error('Get completed bookings calendar - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getCompletedBookingsCalendar
};
