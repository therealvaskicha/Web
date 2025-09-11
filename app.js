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

////////////////////////
/// ALL BOOKING APIs ///
////////////////////////

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
    if (!id || !['approved', 'rejected', 'canceled'].includes(status)) {
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

// Get all historically approved bookings
app.get('/api/bookings-history-approved', (req, res) => {
    db.all(`SELECT id, booking_type, date, time, client_name, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', timestamp) AS timestamp FROM bookings WHERE status = 'approved' and date <= date('now')`, [], (err, rows) => {
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

////////////////////////
///   HOLIDAY APIs   ///
////////////////////////

// Get holidays
app.get('/api/holidays', (req, res) => {
    db.all(`SELECT date, time FROM holidays`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Delete holiday
app.post('/api/delete-holiday', (req, res) => {
    const { date, time } = req.body;
    
    // Handle both full day and specific time slots
    const query = time === null 
        ? `DELETE FROM holidays WHERE date = ? AND time IS NULL`
        : `DELETE FROM holidays WHERE date = ? AND time = ?`;
    
    const params = time === null ? [date] : [date, time];
    
    db.run(query, params, function (err) {
        if (err) {
            console.error('Грешка при премахване:', err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Почивният ден не е намерен' });
        }
        res.json({ message: 'Почивният ден е премахнат.' });
    });
});

// Add holiday
// app.post('/api/add-holiday', (req, res) => {
//     const { date, time } = req.body;

//     // Handle both full day and specific time slots
//     const query = time === null 
//         ? `DELETE FROM holidays WHERE date = ? AND time IS NULL`
//         : `DELETE FROM holidays WHERE date = ? AND time = ?`;
    
//     const params = time === null ? [date] : [date, time];
    
//     db.run(query, params, function (err) {
//         if (err) {
//             console.error('Грешка при премахване:', err);
//             return res.status(500).json({ error: err.message });
//         }
//         if (this.changes === 0) {
//             return res.status(404).json({ error: 'Почивният ден не е намерен' });
//         }
//         res.json({ message: 'Почивният ден е премахнат.' });
//     });
// });