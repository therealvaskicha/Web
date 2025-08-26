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

app.listen(3000, () => console.log('Server at http://localhost:3000'));

// Everything else

// Get all pending bookings
app.get('/api/pending', (req, res) => {
    db.all(`SELECT id, booking_type, date, time, client_name, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', timestamp) as timestamp, status FROM bookings WHERE status = 'pending'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Approve or reject booking
app.post('/api/approve', (req, res) => {
    const { id, status } = req.body;
    if (!id || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid request' });
    }
    db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Booking ${status}` });
    });
});

// Get all approved bookings
app.get('/api/bookings-approved', (req, res) => {
    db.all(`SELECT id, booking_type, date, time, client_name, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', timestamp) AS timestamp FROM bookings WHERE status = 'approved' and date >= date('now') ORDER BY id desc`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get bookings history
app.get('/api/bookings-history', (req, res) => {
    db.all(`SELECT id, booking_type, date, time, client_name, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', timestamp) AS timestamp, status FROM bookings ORDER BY id desc`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get holidays
app.get('/api/holidays', (req, res) => {
    db.all(`SELECT date FROM holidays`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.date));
    });
});

// Book a slot (extended fields)
app.post('/api/book', (req, res) => {
    const {
        booking_type, date, time, client_name, client_phone,
        client_email, subscribe_email
    } = req.body;
    const timestamp = new Date().toISOString();
    if (!booking_type || !date || !time || !client_name || !client_phone || !client_email) {
        return res.status(400).json({ error: 'Липсват необходими полета.' });
    }
    db.get(`SELECT * FROM bookings WHERE date = ? AND time = ? AND status = 'approved'`, [date, time], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'За съжаление този час е зает. Моля изберете свободен час.' });
        db.run(`INSERT INTO bookings (booking_type, date, time, client_name, client_phone, client_email, subscribe_email, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [booking_type, date, time, client_name, client_phone, client_email, !!subscribe_email, timestamp],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Заявката е изпратена за одобрение.', id: this.lastID });
            });
    });
});