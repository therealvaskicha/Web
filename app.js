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

// Test connection
// app.get('/test-db', (req, res) => {
//     db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='bookings'`, [], (err, row) => {
//         if (err) return res.status(500).json({ error: 'Test failed: ' + err.message });
//         res.json({ tableExists: !!row });
//     });
// });

// Get available slots (all days 8:00–17:00)
app.get('/api/slots', (req, res) => {
    const slots = [];
    const today = new Date();
    for (let d = 0; d < 28; d++) { // Increased from 7 to 28 days
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        for (let h = 8; h <= 17; h++) {
            const time = (h < 10 ? '0' : '') + h + ':00';
            slots.push({ date: dateStr, time });
        }
    }
    res.json(slots);
});

// Submit booking request
app.post('/api/book', (req, res) => {
    const { date, time, client_name, client_phone } = req.body;
    console.log('Received booking request:', { date, time, client_name, client_phone });
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !time.match(/^(0[8-9]|1[0-7]):00$/)) {
        return res.status(400).json({ error: 'Invalid slot' });
    }
    db.get(`SELECT * FROM bookings WHERE date = ? AND time = ? AND status = 'approved'`, [date, time], (err, row) => {
        if (err) {
            console.error('Database error in GET query:', err.message);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        if (row) return res.status(400).json({ error: 'Slot already booked' });
        db.run(`INSERT INTO bookings (date, time, client_name, client_phone, status) VALUES (?, ?, ?, ?, 'pending')`,
            [date, time, client_name, client_phone], function (err) {
                if (err) {
                    console.error('Database error in INSERT query:', err.message);
                    return res.status(500).json({ error: 'Database error: ' + err.message });
                }
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
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.json(rows);
    });
});

// Delete booking (for owner)
app.delete('/api/bookings/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM bookings WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

app.listen(3000, () => console.log('Server at http://localhost:3000'));