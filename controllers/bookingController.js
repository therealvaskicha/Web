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

async function fillBookings(req, res) {
    try {
        await bookingDomain.fillBookings(req, res);
        
    } catch (error) {
        console.error('Fill bookings - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getCompletedBookingsCalendar,
    fillBookings
};
