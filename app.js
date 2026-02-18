const express = require('express');
const path = require('path');
const db = require('./database');
const session = require('express-session');

const app = express();

// Middleware setup
// Protect admin HTML files from direct static serving - they must go through auth routes
// But allow CSS, JS, and other assets to be served normally
app.use((req, res, next) => {
    const protectedHtmlFiles = ['/admin.html', '/clients.html', '/subscriptions.html'];
    if (protectedHtmlFiles.includes(req.path)) {
        return next(); // Skip static middleware only for protected HTML files
    }
    express.static('public')(req, res, next);
});

app.use(express.json());
app.use(session({
    secret: 'durjavna_taina11',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 15 * 60 * 1000 // 15 minutes
    }
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
    if (username === 'admin' && password === 'vaskicha420') {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Logout failed' });
        } else {
            res.json({ success: true });
        }
    });
});

// Protect admin routes
app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/clients.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'clients.html'));
});

app.get('/subscriptions.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subscriptions.html'));
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

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function addMonths(date, months) {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
}

const stamp_created = formatDate(new Date());
const nextMonth = formatDate(addMonths(new Date(), 1));

/////////////////////////////
///    QUERIES            ///
/////////////////////////////

// Booking related queries
const sql_get_pending_bookings = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) as stamp_created, status FROM bookings WHERE status = 1 order by date, time asc;`
const sql_get_pending_booking = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, 
            client_phone, client_email, subscribe_email, 
            strftime('%Y-%m-%d %H:%M:%S', stamp_created) as stamp_created, 
            status 
            FROM bookings WHERE id = ?`
const sql_get_approved_bookings = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, 
        subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) AS stamp_created 
        FROM bookings 
        WHERE status = 2
         and date >= date('now') 
         and (date > date('now') OR (date = date('now') AND time > strftime('%H:%M', 'now', '-1 hour'))) 
         ORDER BY date, time asc;`;
const sql_get_historically_approved_bookings = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) AS stamp_created FROM bookings WHERE status = 2 and date <= date('now')`;
const sql_get_bookings_history = `SELECT id, booking_type, date, time, booking_note, client_forename, client_lastname, client_phone, client_email, subscribe_email, strftime('%Y-%m-%d %H:%M:%S', stamp_created) AS stamp_created, status FROM bookings ORDER BY id desc`;
const sql_approve_or_reject_booking = `UPDATE bookings SET status = ? WHERE id = ?`;

// Holiday related queries
const sql_get_holidys = `SELECT date, time, description FROM holidays;`;
const sql_get_upcoming_holidays = `SELECT * FROM holidays WHERE is_active = 1 ORDER BY date, time;`;

// Client related queries
const sql_get_clients = `SELECT client_id, foreName, lastName, client_phone, client_email, stamp_created FROM client order by foreName;`;
const sql_get_client_by_id = `SELECT foreName, lastName, client_phone, client_email, stamp_created, stamp_modified FROM client WHERE client_id = ? LIMIT 1`;
const sql_get_client_mailing_list = `SELECT is_subscribed, date_subscribed, date_unsubscribed FROM mailing_list WHERE client_id = ? LIMIT 1`;
const sql_get_client_card_info = `SELECT 
            cc.card_id,
            s.name as service_name,
            sub.credits_balance,
            sub.start_date,
            sub.expiration_date,
            sub.status as subscription_status,
            sub.stamp_created
        FROM client_card cc
        JOIN services s ON cc.service_id = s.service_id
        LEFT JOIN subscriptions sub ON cc.card_id = sub.card_id
        WHERE cc.client_id = ?`;
const sql_check_existing_client = `SELECT client_id FROM client WHERE client_phone = ? OR client_email = ? LIMIT 1`;
const sql_insert_client = `INSERT INTO client (foreName, lastName, client_phone, client_email) VALUES (?, ?, ?, ?)`;
const sql_insert_mailing_list = `INSERT INTO  mailing_list (client_id, date_subscribed) VALUES (?, date(?))`;
const sql_insert_client_card = `INSERT INTO client_card (client_id, service_id) VALUES (?, ?)`;
const sql_insert_subscription = `INSERT INTO subscriptions (service_id, card_id, client_id, credits_balance, start_date, expiration_date, status) VALUES (?, ?, ?, ?, date(?), date(?), ?)`;
const sql_select_service = `SELECT service_id, nr_credits FROM services WHERE name = ? LIMIT 1`;
const sql_subtract_credits = `UPDATE subscriptions 
SET credits_balance = credits_balance - 1, stamp_modified = CURRENT_TIMESTAMP,
     status = CASE 
        WHEN credits_balance - 1 = 0 THEN 9 
        WHEN expiration_date < date('now') THEN 7
        ELSE 6
        END
        WHERE sub_id = ?;`;
const sql_sync_sub_status = `UPDATE subscriptions 
    SET status = CASE 
        WHEN credits_balance > 0 AND date('now') =< expiration_date THEN 6
        WHEN date('now') > expiration_date THEN 7
        WHEN status = 8 THEN 8
        WHEN credits_balance = 0 THEN 9 
    END, stamp_modified = CURRENT_TIMESTAMP;`;

const sql_sync_client_card_status = `UPDATE client_card 
    SET is_active = CASE 
        WHEN card_id IN (
            SELECT card_id FROM subscriptions 
            WHERE status = 6
        ) THEN 1
        ELSE 0
    END`
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
app.post('/api/approve', async (req, res) => {
    const { id, status } = req.body;

    try {
        //Begin transaction
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => {
                if (err) reject(err);
                else resolve();
            });
        });

    // Get booking details
    const booking = await new Promise((resolve, reject) => {
        db.get(sql_get_pending_booking, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Update booking status
    await new Promise ((resolve, reject) => {
        db.run(sql_approve_or_reject_booking, [status, id], function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    // Check if client exists
    if (status === 2) {
        const existingClient = await new Promise ((resolve, reject) => {
            db.get(sql_check_existing_client, [booking.client_phone, booking.client_email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        let clientId;
        if (existingClient) {
            clientId = existingClient.client_id;
        } else {
            // Create new client
            const newClient = await new Promise ((resolve, reject) => {
            db.run(sql_insert_client, 
                [booking.client_forename, booking.client_lastname, booking.client_phone, booking.client_email],
                function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        clientId = newClient.lastID;

        // Handle email subscription
        if (booking.subscribe_email) {
            await new Promise ((resolve, reject) => {
                db.run(sql_insert_mailing_list, 
                    [clientId, booking.date], // Use booking date instead of current date
                    function(err) {
                        if (err) reject(err);
                        else resolve(this);
                    });
            });
        }

        // Handle subscribed clients
        if (!['Solo','Private'].includes(booking.booking_type)) {
            // Get service
            const serviceType = await new Promise ((resolve, reject) => {
                db.get(sql_select_service, [booking.booking_type], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (serviceType) {
                // Create subscription FIRST with status 5 (pending)
                const startDate = booking.date;
                const expirationDate = formatDate(addMonths(new Date(booking.date), 1));

                const subResult = await new Promise ((resolve, reject) => {
                    db.run(sql_insert_subscription, 
                        [serviceType.service_id, null, clientId, serviceType.nr_credits, startDate, expirationDate, 5],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this);
                        });
                });

                const subscriptionId = subResult.lastID;

                // Check if subscription should be active (status 6)
                // A subscription is active if start_date <= today AND expiration_date >= today AND credits_balance > 0
                const today = formatDate(new Date());
                let subscriptionStatus = 5; // Default to pending
                let cardId = null;

                if (startDate <= today && expirationDate >= today) {
                    // Update subscription status to 6 (active)
                    subscriptionStatus = 6;

                    // Only create client card if subscription is active (status 6)
                    const cardResult = await new Promise ((resolve, reject) => {
                        db.run(sql_insert_client_card, 
                            [clientId, serviceType.service_id],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this);
                            });
                    });

                    cardId = cardResult.lastID;

                    // Update subscription with card_id and status 6
                    await new Promise ((resolve, reject) => {
                        db.run(`UPDATE subscriptions SET card_id = ?, status = 6, is_active = 1 WHERE sub_id = ?`,
                            [cardId, subscriptionId],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this);
                            });
                    });

                    // Set client_card to active
                    await new Promise ((resolve, reject) => {
                        db.run(`UPDATE client_card SET is_active = 1 WHERE card_id = ?`,
                            [cardId],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this);
                            });
                    });
                } else {
                    // Keep status as 5 (pending) - do NOT create client_card yet
                    await new Promise ((resolve, reject) => {
                        db.run(`UPDATE subscriptions SET status = 5 WHERE sub_id = ?`,
                            [subscriptionId],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this);
                            });
                    });
                }
            }
        }
    }
    }

    // Commit transaction
    await new Promise((resolve,reject) => {
        db.run('COMMIT', err => {
            if (err) reject(err);
            else resolve();
        });
    });

    res.json({ message: `Тренировката беше ${status === 2 ? 'добавена' : status === 4 ? 'отказана' : 'отменена'}.` });

    } catch (error) {
        // Rollback transaction 
        await new Promise(resolve => {
            db.run('ROLLBACK', () => resolve());
        })
        res.status(500).json({ error: error.message });
    }
});

// Add new endpoint to handle subscription status updates
app.post('/api/update-subscriptions', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            db.run(sql_sync_sub_status, [], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Update client_card active status based on subscription status
        await new Promise((resolve, reject) => {
            db.run(sql_sync_client_card_status, [], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ message: 'Subscriptions updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

////////////////////////
///   CLIENT APIs   ///
////////////////////////

app.get('/api/clients', (req, res) => {
    db.all(sql_get_clients, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/client/:id', (req, res) => {
    const clientId = req.params.id;
    db.get(sql_get_client_by_id, [clientId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Client not found' });
        res.json(row);
    });
});

app.get('/api/client/:id/mailing-list', (req, res) => {
    const clientId = req.params.id;
    
    db.get(sql_get_client_mailing_list, [clientId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

app.get('/api/client/:id/cards', (req, res) => {
    const clientId = req.params.id;
    
    db.all(sql_get_client_card_info, [clientId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

////////////////////////
///  START SERVER   ///
////////////////////////

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});