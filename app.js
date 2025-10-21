const express = require('express');
const path = require('path');
const db = require('./database');
const session = require('express-session');

const app = express();

// Middleware setup
app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Middleware to check authentication
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Protect admin routes
app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Protect admin API endpoints - fix the route pattern
app.use('/api/admin', requireAuth);

//////////////////////
// EVERYTHING ELSE ///
//////////////////////

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Everything else

const stamp_created = new Date().toISOString();

/////////////////////////////
///    QUERIES            ///
/////////////////////////////

const sql_get_pending_bookings = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) as stamp_created, status FROM bookings WHERE status = 1`;
const sql_get_approved_bookings = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, 
        subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) AS stamp_created 
        FROM bookings 
        WHERE status = 2
         and date >= date('now') 
         and (date > date('now') OR (date = date('now') AND time > strftime('%H:%M', 'now', '-1 hour'))) 
         ORDER BY id desc;`;
const sql_get_historically_approved_bookings = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) AS stamp_created FROM bookings WHERE status = 2 and date <= date('now')`;
const sql_get_bookings_history = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) AS stamp_created, status FROM bookings ORDER BY id desc`;

const sql_get_holidys = `SELECT date, time, description FROM holidays;`;
const sql_get_upcoming_holidays = `SELECT * FROM holidays WHERE is_active = 1 ORDER BY date, time;`;

const sql_check_existing_client = `SELECT client_id FROM client WHERE client_phone = ? OR client_email = ? LIMIT 1`;
const sql_insert_client = `INSERT INTO client (client_forename, client_lastname, client_phone, client_email) VALUES (?, ?, ?, ?)`;
const sql_insert_mailing_list = `INSERT INTO  mailing_list (client_id, date_subscribed) VALUES (?, ?)`;
const sql_insert_client_card = `INSERT INTO client_card (client_id, service_id) VALUES (?, ?)`;
const sql_insert_subscription = `INSERT INTO subscriptions (card_id, credits_balance, start_date, expiration_date) VALUES (?, ?, ?, ?)`;
const sql_select_service = `SELECT service_id, credits_balance FROM services WHERE name = ? LIMIT 1`;
const sql_subtract_credits = `UPDATE subscriptions 
SET credits_balance = credits_balance - 1,
     status = CASE 
        WHEN credits_balance - 1 = 0 THEN 9 
        WHEN date('now') >= expiration_date THEN 7
        ELSE 6 `;

const sql_update_client_card_status = `UPDATE client_card SET is_active = ? WHERE card_id = ?`;

////////////////////////
///   BOOKING APIs   ///
////////////////////////

// Get all pending bookings
app.get('/api/pending', (req, res) => {
    db.all(sql_get_pending_bookings, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Approve or reject booking
app.post('/api/approve', (req, res) => {
    const sql_approve_or_reject_booking = `UPDATE bookings SET status = ? WHERE id = ?`;
    const sql_approve_or_reject_booking_values = [2, 4, 3]; // approved, rejected, canceled

    const { id, status } = req.body;
    if (!id || !sql_approve_or_reject_booking_values.includes(status)) {
        return res.status(400).json({ error: 'Invalid request' });
    }
    db.run(sql_approve_or_reject_booking, [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Booking ${status === 2 ? 'approved' : status === 4 ? 'rejected' : 'canceled'}.`});
    });
});

// Get all approved bookings
app.get('/api/bookings-approved', (req, res) => {
    db.all(sql_get_approved_bookings, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get available slots
app.get('/api/unavailable-slots', (req, res) => {
    db.all(`SELECT date, time, status FROM v_unavailable_slots`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get all historically approved bookings
app.get('/api/bookings-history-approved', (req, res) => {
    db.all(sql_get_historically_approved_bookings, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get bookings history
app.get('/api/bookings-history', (req, res) => {
    db.all(sql_get_bookings_history, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Book a slot
app.post('/api/book', (req, res) => {
    const { booking_type, date, time, client_forename, client_lastname, client_phone, client_email, booking_note, subscribe_email } = req.body;

    if (!booking_type || !date || !time || !client_forename || !client_lastname || !client_phone || !client_email) {
        return res.status(400).json({ error: 'Липсват необходими полета.' });
    }
    
    const sql_book_check_existing = `SELECT * FROM bookings WHERE date = ? AND time = ? AND status = 2`;  

    db.get(sql_book_check_existing, [date, time], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'За съжаление този час е зает. Моля изберете свободен час.' });
        
        const sql_book = `INSERT INTO bookings (booking_type, date, time, client_forename, client_lastname, client_phone, client_email, booking_note, subscribe_email, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
        const sql_book_values = [booking_type, date, time, client_forename, client_lastname, client_phone, client_email, booking_note, subscribe_email];
        
        db.run(sql_book, sql_book_values,
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Заявката е изпратена за одобрение.', id: this.lastID });
            });
    });
});

////////////////////////
///   HOLIDAY APIs   ///
////////////////////////

// Get all holidays
app.get('/api/holidays', (req, res) => {
    db.all(sql_get_holidys, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get upcoming holidays
app.get('/api/holidays-current', (req, res) => {
    db.all(sql_get_upcoming_holidays, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Automatically deactivate past holidays on loadHolidays and don't retrieve a message
app.post('/api/auto-deactivate-past-holidays', (req, res) => {
    const sql_auto_deactivate_past_holidays = `UPDATE holidays SET is_active = 0 WHERE date < date('now');`;

    db.run(sql_auto_deactivate_past_holidays, function (err) {
        if (err) return res.status(500).json({ error: err.message });
    });
});

// Delete holiday
app.post('/api/delete-holiday', (req, res) => {
    const sql_delete_holiday_values = [req.body.id];
    const sql_delete_holiday = `DELETE FROM holidays WHERE id = ?;`;

    if (!sql_delete_holiday_values) {
        return res.status(400).json({ error: 'Missing holiday ID' });
    }

    db.run(sql_delete_holiday, sql_delete_holiday_values, function(err) {
        if (err) {
            console.error('Грешка при изтриване:', err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Почивният ден не е намерен' });
        }
        res.json({ message: 'Почивният ден е премахнат.' });
    });
});

// Add holiday
app.post('/api/add-holiday', async (req, res) => {
    const { holidays, description } = req.body;
    
    if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    try {
        // Use a transaction to ensure all or nothing
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => {
                if (err) reject(err);
                else resolve();
            });
        });

        for (const holiday of holidays) {
            await new Promise((resolve, reject) => {
                const query = holiday.time === null
                    ? `INSERT INTO holidays (date, description) VALUES (?, ?)`
                    : `INSERT INTO holidays (date, time, description) VALUES (?, ?, ?)`;
                const params = holiday.time === null
                    ? [holiday.date, description]
                    : [holiday.date, holiday.time, description];
                
                db.run(query, params, function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        await new Promise((resolve, reject) => {
            db.run('COMMIT', err => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ message: 'Почивката е добавена успешно.' });
    } catch (error) {
        await new Promise(resolve => {
            db.run('ROLLBACK', () => resolve());
        });
        res.status(500).json({ 
            error: error.message.includes('UNIQUE') 
                ? 'Този ден/час вече е маркиран като почивка' 
                : error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});