const express = require('express');
const path = require('path');
const db = require('./database');
const app = express();

app.use(express.static('public'));
app.use(express.json()); // Parse JSON requests

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Get available slots (all days 8:00–17:00)
app.get('/api/slots', (req, res) => {
    const slots = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (let day of days) {
        for (let hour = 8; hour < 17; hour++) {
            slots.push({ date: day, time: `${hour}:00` });
        }
    }
    // Filter out booked slots
    db.all(`SELECT date, time FROM bookings WHERE status = 'approved'`, [], (err, booked) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const available = slots.filter(slot => {
            return !booked.some(b => b.date === slot.date && b.time === slot.time);
        });
        res.json(available);
    });
});

// Submit booking request
app.post('/api/book', (req, res) => {
    const { date, time, client_name } = req.body;
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(date) || !time.match(/^(8|9|10|11|12|13|14|15|16):00$/)) {
        return res.status(400).json({ error: 'Invalid slot' });
    }
    db.get(`SELECT * FROM bookings WHERE date = ? AND time = ? AND status = 'approved'`, [date, time], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (row) return res.status(400).json({ error: 'Slot already booked' });
        db.run(`INSERT INTO bookings (date, time, client_name, status) VALUES (?, ?, ?, 'pending')`,
            [date, time, client_name], function (err) {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ message: 'Booking request submitted', id: this.lastID });
            });
    });
});

// Approve/reject booking (for owner)
app.post('/api/approve', (req, res) => {
    const { id, status } = req.body; // status: 'approved' or 'rejected'
    db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id], function (err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Update failed' });
        res.json({ message: `Booking ${status}` });
    });
});

// Get pending bookings for approval
app.get('/api/pending', (req, res) => {
    db.all(`SELECT * FROM bookings WHERE status = 'pending'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.listen(3000, () => console.log('Server at http://localhost:3000'));