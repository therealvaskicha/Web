const express = require('express');
const path = require('path');
const db = require('./database');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
require('dotenv').config();

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
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'durjavna_taina11',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: parseInt(process.env.SESSION_TIMEOUT_MS) || 15 * 60 * 1000 // 15 minutes
    }
}));

// CSRF protection middleware
const csrfProtection = csrf({ cookie: false });

// Rate limiting configs
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5, // 5 attempts
    message: 'Твърде много опити за вход. Моля, опитайте отново и по-късно.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production', // Skip rate limiting in dev
    keyGenerator: (req) => req.ip, // Use IP address as key
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => process.env.NODE_ENV !== 'production',
});

// Middleware to check authentication
function requireAuth(req, res, next) {
    // Skip auth in development/test mode (localhost)
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }
    
    // Production: require authentication
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Check if account is locked
async function isAccountLocked(req, res, next) {
    const username = req.body?.username;
    if (!username) return next();
    
    try {
        const [rows] = await db.query(
            'SELECT locked_until FROM login_attempts WHERE username = ? AND locked_until IS NOT NULL ORDER BY locked_until DESC LIMIT 1',
            [username]
        );
        
        if (rows.length > 0 && new Date(rows[0].locked_until) > new Date()) {
            const remainingTime = Math.ceil((new Date(rows[0].locked_until) - new Date()) / 1000 / 60);
            return res.status(429).json({ 
                error: `Акаунтът е заключен. Опитайте отново за ${remainingTime} минути.` 
            });
        }
        next();
    } catch (err) {
        console.error('Error checking account lock:', err);
        return res.status(500).json({ error: 'Сървърна грешка' });
    }
}

// Record login attempt
async function recordLoginAttempt(username, ip, success) {
    const lockoutDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MS) || 30 * 60 * 1000; // 30 minutes
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + lockoutDuration);
    
    const query = `
        INSERT INTO login_attempts (username, ip_address, success, locked_until)
        VALUES (?, ?, ?, ?)
    `;
    
    const params = [username, ip, success ? 1 : 0, success ? null : lockedUntil.toISOString()];
    
    try {
        await db.execute(query, params);
    } catch (err) {
        console.error('Error recording login attempt:', err);
    }
}

// Check failed login attempts
async function checkFailedAttempts(username) {
    const windowMs = parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS) || 15 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - windowMs).toISOString();
    
    try {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM login_attempts 
             WHERE username = ? AND success = 0 AND attempt_timestamp > ?`,
            [username, cutoffTime]
        );
        return rows[0]?.count || 0;
    } catch (err) {
        console.error('Error checking failed attempts:', err);
        return 0;
    }
}

// Get CSRF token for login form
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ token: req.csrfToken() });
});

// Login endpoint
app.post('/api/login', loginLimiter, isAccountLocked, csrfProtection, async (req, res) => {
    try {
        const { username, password } = req.body;
        const clientIp = req.ip || req.connection.remoteAddress;
        
        if (!username || !password) {
            await recordLoginAttempt(username || 'unknown', clientIp, false);
            return res.status(400).json({ error: 'Потребителско име и парола са задължителни' });
        }
        
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        
        // Validate credentials
        if (username !== adminUsername) {
            await recordLoginAttempt(username, clientIp, false);
            return res.status(401).json({ error: 'Неправилно потребителско име или парола' });
        }
        
        // Verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, adminPasswordHash);
        if (!passwordMatch) {
            await recordLoginAttempt(username, clientIp, false);
            const failedAttempts = await checkFailedAttempts(username);
            
            if (failedAttempts >= (parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5)) {
                return res.status(429).json({ 
                    error: 'Твърде много неудачни опити. Акаунтът е заключен временно.' 
                });
            }
            
            return res.status(401).json({ error: 'Неправилно потребителско име или парола' });
        }
        
        // Successful login
        await recordLoginAttempt(username, clientIp, true);
        req.session.authenticated = true;
        req.session.username = username;
        
        res.json({ success: true, message: 'Успешно влизане' });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Сървърна грешка при вход' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            res.status(500).json({ error: 'Грешка при излизане' });
        } else {
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Успешно излизане' });
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
app.use('/api/', apiLimiter);

//////////////////////
// EVERYTHING ELSE ///
//////////////////////

// Error handling helper
function handleError(res, error, defaultMessage = 'Грешка при обработка на заявката') {
    console.error('API Error:', error);
    
    if (error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Дублиран запис - този елемент вече съществува' });
    }
    
    res.status(500).json({ error: defaultMessage });
}

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
const sql_get_pending_bookings = 
`SELECT r.id, p.name as 'booking_type', DATE_FORMAT(r.date, '%Y-%m-%d %H:%i') as 'date', r.note, c.firstName, c.lastname
FROM contact c 
    left join requestlog r on c.id = r.contact_id 
    right join product p on p.product_id = r.product_id
WHERE status in (1,10) and date >= curdate() ORDER BY date ASC`
const sql_get_pending_booking = 
`SELECT id FROM booking WHERE id = ?`
const sql_get_approved_bookings = 
`SELECT id, date 
FROM booking 
WHERE status in (2,3,11) AND date >= curdate()`;
const sql_get_historically_approved_bookings = 
`SELECT id, date 
FROM booking 
WHERE status in (2,3,5,11) AND date <= curdate()`;
const sql_get_bookings_history = 
`SELECT b.id, b.date, co.firstName, co.lastname 
FROM booking b 
    join client c on b.client_id=c.client_id 
    join contact co on co.id=c.contact_id
ORDER BY b.id DESC`;
const sql_approve_or_reject_booking = 
`UPDATE booking SET status = ? WHERE id = ?`;

// Holiday related queries
const sql_get_holidays = 
`SELECT * FROM holidays WHERE is_active = 1 ORDER BY date DESC;`;

// Client related queries
const sql_get_clients = 
`SELECT c.client_id, ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created 
FROM client c JOIN contact ct ON c.contact_id = ct.id 
ORDER BY ct.firstName;`;
const sql_get_client_by_id = 
`SELECT ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created, c.stamp_modified 
FROM client c JOIN contact ct ON c.contact_id = ct.id 
WHERE c.client_id = ? LIMIT 1`;
const sql_get_client_mailing_list = 
`SELECT date_subscribed, date_unsubscribed 
FROM mailing_list 
WHERE client_id = ? order by id desc limit 1`;
const sql_get_client_card_info = 
`SELECT ca.card_id, p.name as 'booking_type', NULL as credits_balance, s.start_date, s.expiration_date, s.status as subscription_status, s.stamp_created 
FROM card ca JOIN subscription s ON ca.card_id = s.card_id 
JOIN product p ON s.product_id = p.product_id 
WHERE ca.client_id = ?`;
const sql_check_existing_client = 
`SELECT c.client_id, ct.phone, ct.email
FROM client c JOIN contact ct ON c.contact_id = ct.id 
WHERE ct.phone = ? OR ct.email = ? 
LIMIT 1`;
const sql_insert_client = 
`CALL insert_client(?, ?, ?, ?)`;
const sql_insert_mailing_list = 
`INSERT INTO mailing_list (contact_id, date_subscribed) VALUES (?, ?)`;
const sql_insert_client_card = 
`INSERT INTO card (client_id) VALUES (?)`;
const sql_insert_subscription = 
`INSERT INTO subscription (client_id, product_id, card_id, start_date, expiration_date, status) VALUES (?, ?, ?, ?, ?, ?)`;
const sql_select_service = 
`SELECT product_id, name FROM product WHERE name = ? LIMIT 1`;
const sql_sync_sub_status = 
`UPDATE subscription SET status = CASE WHEN CURDATE() <= expiration_date THEN 15 WHEN CURDATE() > expiration_date THEN 17 ELSE 9 END;`;

////////////////////////
///   BOOKING APIs   ///
////////////////////////

// Get all pending bookings
app.get('/api/pending', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_pending_bookings);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve or reject booking
app.post('/api/approve', async (req, res) => {
    const { id, status } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get booking details
        const [bookingRows] = await connection.query(sql_get_pending_booking, [id]);
        const booking = bookingRows[0];
        
        if (!booking) {
            await connection.rollback();
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Update booking status
        await connection.execute(sql_approve_or_reject_booking, [status, id]);

        // Check if client exists
        if (status === 2) {
            const [existingRows] = await connection.query(sql_check_existing_client, [booking.phone, booking.email]);
            const existingClient = existingRows[0];

            let contactId;
            if (existingClient) {
                contactId = existingClient.client_id;
            } else {
                // Create new client using stored procedure
                const [clientResult] = await connection.execute(sql_insert_client, 
                    [booking.firstName, booking.lastname, booking.phone, booking.email]
                );
                // The stored procedure returns the client_id
                contactId = clientResult[0][0]?.contactId;

                // Handle email subscription
                if (booking.subscribe_email) {
                    await connection.execute(sql_insert_mailing_list, [contactId, booking.date]);
                }

                // Handle subscribed clients (group classes)
                if (!['Solo', 'Private'].includes(booking.booking_type)) {
                    // Get service/product info
                    const [serviceRows] = await connection.query(sql_select_service, [booking.booking_type]);
                    const serviceType = serviceRows[0];

                    if (serviceType) {
                        const startDate = booking.date;
                        const expirationDate = formatDate(addMonths(new Date(booking.date), 1));

                        // Create card first
                        const [cardResult] = await connection.execute(sql_insert_client_card, [clientId]);
                        const cardId = cardResult.insertId;

                        // Create subscription with card_id
                        const [subResult] = await connection.execute(sql_insert_subscription, 
                            [clientId, serviceType.product_id, cardId, startDate, expirationDate, 1]
                        );
                    }
                }
            }
        }

        await connection.commit();
        res.json({ message: `Тренировката беше ${status === 2 ? 'добавена' : status === 4 ? 'отказана' : 'отменена'}.` });

    } catch (error) {
        await connection.rollback();
        console.error('Approve booking error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Add new endpoint to handle subscription status updates
app.post('/api/update-subscriptions', async (req, res) => {
    try {
        await db.execute(sql_sync_sub_status);
        res.json({ message: 'Subscriptions updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all approved bookings
app.get('/api/bookings-approved', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_approved_bookings);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get available slots
app.get('/api/unavailable-slots', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT date, time, status FROM v_unavailable_slots');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all historically approved bookings
app.get('/api/bookings-history-approved', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_historically_approved_bookings);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get bookings history
app.get('/api/bookings-history', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_bookings_history);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Book a slot
app.post('/api/book', async (req, res) => {
    const { booking_type, date, time, firstName, lastName, phone, email, note, subscribe_email } = req.body;

    if (!booking_type || !date || !time || !firstName || !lastName || !phone || !email) {
        return res.status(400).json({ error: 'Липсват необходими полета.' });
    }
    
    try {
        // Check if slot is already booked
        const [existingRows] = await db.query(
            'SELECT * FROM booking WHERE date = ? AND time = ? AND status = 2',
            [date, time]
        );
        
        if (existingRows.length > 0) {
            return res.status(400).json({ error: 'За съжаление този час е зает. Моля изберете свободен час.' });
        }
        
        // Insert new booking
        const [result] = await db.execute(
            `INSERT INTO booking (booking_type, date, time, firstName, lastname, phone, email, note, subscribe_email, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [booking_type, date, time, firstName, lastName, phone, email, note, subscribe_email]
        );
        
        res.json({ message: 'Заявката е изпратена за одобрение.', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

////////////////////////
///   HOLIDAY APIs   ///
////////////////////////

// Get all active holidays
app.get('/api/holidays', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_holidays);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Automatically deactivate past holidays
app.post('/api/auto-deactivate-past-holidays', async (req, res) => {
    try {
        await db.execute('UPDATE holidays SET is_active = 0 WHERE date < CURDATE()');
        res.json({ message: 'Past holidays deactivated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete holiday
app.post('/api/delete-holiday', async (req, res) => {
    const holidayId = req.body.id;

    if (!holidayId) {
        return res.status(400).json({ error: 'Missing holiday ID' });
    }

    try {
        const [result] = await db.execute('DELETE FROM holidays WHERE id = ?', [holidayId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Почивният ден не е намерен' });
        }
        res.json({ message: 'Почивният ден е премахнат.' });
    } catch (err) {
        console.error('Грешка при изтриване:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add holiday
app.post('/api/add-holiday', async (req, res) => {
    const { holidays, description } = req.body;
    
    if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const holiday of holidays) {
            const query = holiday.time === null
                ? 'INSERT INTO holidays (date, description) VALUES (?, ?)'
                : 'INSERT INTO holidays (date, time, description) VALUES (?, ?, ?)';
            const params = holiday.time === null
                ? [holiday.date, description]
                : [holiday.date, holiday.time, description];
            
            await connection.execute(query, params);
        }

        await connection.commit();
        res.json({ message: 'Почивката е добавена успешно.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ 
            error: error.message.includes('UNIQUE') 
                ? 'Този ден/час вече е маркиран като почивка' 
                : error.message 
        });
    } finally {
        connection.release();
    }
});

////////////////////////
///   CLIENT APIs   ///
////////////////////////

app.get('/api/clients', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_clients);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/client/:id', async (req, res) => {
    const clientId = req.params.id;
    try {
        const [rows] = await db.query(sql_get_client_by_id, [clientId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/client/:id/mailing-list', async (req, res) => {
    const clientId = req.params.id;
    try {
        const [rows] = await db.query(sql_get_client_mailing_list, [clientId]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/client/:id/cards', async (req, res) => {
    const clientId = req.params.id;
    try {
        const [rows] = await db.query(sql_get_client_card_info, [clientId]);
        res.json(rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

////////////////////////
///  START SERVER   ///
////////////////////////

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});