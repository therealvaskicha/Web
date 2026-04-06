// Booking domain module
const db = require('../../database');
const queries = require('./queries');

async function getCompletedBookingsCalendar(req, res) {
    try {
        const rows = await db.query(queries.getCompletedBookingsCalendar);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getCompletedBookingsCalendar
};
