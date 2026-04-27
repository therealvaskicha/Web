// Booking domain module
const db = require('../../database');
const queries = require('./queries');

// Convert BigInt values to strings for JSON serialization
function convertBigIntToString(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(convertBigIntToString);
    if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToString(value);
        }
        return converted;
    }
    return obj;
}

async function getCompletedBookingsCalendar(req, res) {
    try {
        const rows = await db.query(queries.getCompletedBookingsCalendar);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function fillBookings(req, res) {
    try {
        const rows = await db.query(queries.fillBookings);
        res.json(convertBigIntToString(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getCompletedBookingsCalendar,
    fillBookings
};
