// View domain module
const db = require('../../database');
const queries = require('./queries');

async function getUnavailableSlots(req, res) {
    try {
        const [rows] = await db.query(queries.getUnavailableSlots);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getUnavailableSlots
}