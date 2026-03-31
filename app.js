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
const sql_get_pending_requests = 
`SELECT p.name as 'booking_type', DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, r.note, c.firstName, c.lastName
FROM contact c 
    left join requestlog r on c.id = r.contact_id 
    right join product p on p.product_id = r.product_id
WHERE r.status in (1,10) and r.date >= curdate() ORDER BY r.date ASC`

const sql_get_pending_requests_c = 
`SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
FROM requestlog
WHERE status in (1,10) and date >= curdate()`

const sql_get_pending_request = 
`SELECT r.id, r.product_id, r.contact_id, r.date, r.note, co.firstName, co.lastName, co.phone, co.email, p.name as booking_type
FROM requestlog r
JOIN contact co ON r.contact_id = co.id
JOIN product p ON r.product_id = p.product_id
WHERE co.firstName = ? AND co.lastName = ? AND DATE(r.date) = ? AND TIME(r.date) = ? AND p.name = ?`

const sql_get_approved_requests_c = 
`SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
from requestlog
WHERE status = 2 AND date >= curdate()`;


const sql_get_approved_requests = 
`SELECT DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, p.name as booking_type, co.firstName, co.lastName, r.note
from product p 
right join requestlog r on p.product_id = r.product_id 
left join contact co on r.contact_id = co.id
WHERE r.status = 2 AND r.date >= curdate()`;

const sql_get_completed_bookings_c = 
`SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
from booking
WHERE date <= curdate()`;
const sql_get_request_history = 
`SELECT DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, co.firstName, co.lastName, p.name as booking_type, DATE_FORMAT(r.stamp_created, '%Y-%m-%d %H:%i') as stamp_created, r.status
FROM requestlog r 
    join contact co on r.contact_id=co.id 
    join product p on r.product_id=p.product_id
ORDER BY r.stamp_modified DESC`;
// Update requestlog status
const sql_approve_or_reject_request = 
`UPDATE requestlog SET status = ? WHERE id = ?`;

// Insert contact for new booking requests
const sql_insert_contact = 
`INSERT INTO contact (firstName, lastName, phone, email) VALUES (?, ?, ?, ?)`;

// Check if contact already exists
const sql_get_contact_by_details = 
`SELECT id FROM contact WHERE firstName = ? AND lastName = ? AND phone = ?`;

// Insert request into requestlog
const sql_insert_request = 
`INSERT INTO requestlog (product_id, contact_id, date, note, status, client_id) VALUES (?, ?, ?, ?, ?, ?)`;

// Holiday related queries
const sql_get_holidays = 
`SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time, description FROM holidays WHERE is_active = 1 ORDER BY date,time DESC;`;

const sql_get_holidays_c = 
`SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time FROM holidays WHERE is_active = 1;`;

// Client related queries
const sql_get_clients = 
`SELECT ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created 
FROM client c JOIN contact ct ON c.contact_id = ct.id
ORDER BY ct.firstName, ct.lastName ASC`;
const sql_get_client_by_compid = 
`SELECT ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created
FROM client c JOIN contact ct ON c.contact_id = ct.id 
WHERE ct.firstName = ? and ct.lastName = ? and ct.phone = ?`;
const sql_get_client_mailing_list = 
`SELECT m.date_subscribed, m.date_unsubscribed 
FROM mailing_list m join contact ct on m.contact_id = ct.id
WHERE ct.firstName = ? and ct.lastName = ? and ct.phone = ?`;
const sql_get_client_card_info = 
`SELECT ca.card_id, p.name as 'booking_type', NULL as credits_balance, s.start_date, s.expiration_date, s.status as subscription_status, s.stamp_created 
FROM card ca JOIN subscription s ON ca.card_id = s.card_id 
JOIN product p ON s.product_id = p.product_id 
WHERE ca.client_id = ?`;
const sql_check_existing_client = 
`SELECT c.client_id, ct.firstName, ct.lastName, ct.phone, ct.email
FROM client c JOIN contact ct ON c.contact_id = ct.id 
WHERE ct.firstName = ? AND ct.lastName = ? AND ct.phone = ?
LIMIT 1`;
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
        const [rows] = await db.query(sql_get_pending_requests);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all pending bookings (for calendar)
app.get('/api/c-pending', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_pending_requests_c);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve or reject request
app.post('/api/approve', async (req, res) => {
    const { firstName, lastName, date, time, booking_type, status } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get request details by composite key
        // time comes as "15:00", need to convert to "15:00:00" for TIME() comparison
        const timeValue = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
        const [requestRows] = await connection.query(sql_get_pending_request, [firstName, lastName, date, timeValue, booking_type]);
        const request = requestRows[0];
        
        if (!request) {
            await connection.rollback();
            return res.status(404).json({ error: 'Request not found' });
        }

        // Update request status
        await connection.execute(sql_approve_or_reject_request, [status, request.id]);

        // Check if client exists
        if (status === 2) {
            const [existingRows] = await connection.query(sql_check_existing_client, [request.firstName, request.lastName, request.phone]);
            const existingClient = existingRows[0];

            let clientId;
            if (existingClient) {
                clientId = existingClient.client_id;
            } else {
                // Get next client_id starting from 1000
                const [nextClientIdResult] = await connection.query('SELECT get_next_client_id() as next_id');
                const nextClientId = nextClientIdResult[0].next_id;
                
                // Create new client record with generated client_id
                const [clientResult] = await connection.execute(
                    `INSERT INTO client (contact_id, client_id) VALUES (?, ?)`,
                    [request.contact_id, nextClientId]
                );
                clientId = nextClientId;
                
                // Update requestlog with client_id for this contact's pending requests
                await connection.execute(
                    `UPDATE requestlog SET client_id = ? WHERE contact_id = ? AND client_id IS NULL`,
                    [clientId, request.contact_id]
                );
                
                // Update mailing_list with client_id for this contact
                await connection.execute(
                    `UPDATE mailing_list SET client_id = ? WHERE contact_id = ? AND client_id IS NULL`,
                    [clientId, request.contact_id]
                );
                
                // Handle email subscription
                if (request.subscribe_email) {
                    await connection.execute(sql_insert_mailing_list, [request.contact_id, request.date]);
                }

                // Handle subscribed clients (group classes)
                if (!['Solo', 'Private'].includes(request.booking_type)) {
                    // Get service/product info
                    const [serviceRows] = await connection.query(sql_select_service, [request.booking_type]);
                    const serviceType = serviceRows[0];

                    if (serviceType) {
                        const startDate = request.date;
                        const expirationDate = formatDate(addMonths(new Date(request.date), 1));

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

app.get('/api/c-approved-requests', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_approved_requests_c);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/approved-requests', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_approved_requests);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get available slots
app.get('/api/unavailable-slots', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM v_unavailable_slots;");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all historically approved bookings
app.get('/api/c-completed-bookings', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_completed_bookings_c);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get request history
app.get('/api/request-history', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_request_history);
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
    
    // Combine date and time into datetime for MariaDB
    const datetime = `${date} ${time}:00`;
    
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check if slot is already booked in requestlog (approved bookings)
        const [existingRows] = await connection.query(
            `SELECT * FROM requestlog WHERE DATE(date) = ? AND TIME(date) = ? AND status IN (2, 3)`,
            [date, `${time}:00`]
        );
        
        if (existingRows.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'За съжаление този час е зает. Моля изберете свободен час.' });
        }
        
        // Get product_id for the booking type
        const [productRows] = await connection.query(sql_select_service, [booking_type]);
        const product = productRows[0];
        
        if (!product) {
            await connection.rollback();
            return res.status(400).json({ error: 'Невалиден тип тренировка.' });
        }
        
        // Check if phone already exists with different name
        const [phoneCheckRows] = await connection.query(
            `SELECT id, firstName, lastName FROM contact WHERE phone = ?`,
            [phone]
        );
        
        if (phoneCheckRows.length > 0) {
            const existingContact = phoneCheckRows[0];
            // Check if name matches
            if (existingContact.firstName !== firstName || existingContact.lastName !== lastName) {
                await connection.rollback();
                return res.status(400).json({ 
                    error: 'Контакт с този номер на телефон вече е известен.' 
                });
            }
        }
        
        // Check if contact already exists (by firstName, lastName, phone)
        const [contactRows] = await connection.query(sql_get_contact_by_details, [firstName, lastName, phone]);
        let contactId;
        
        if (contactRows.length > 0) {
            // Use existing contact
            contactId = contactRows[0].id;
            
            // Update email if it's different
            const [currentContactData] = await connection.query(
                `SELECT email FROM contact WHERE id = ?`,
                [contactId]
            );
            
            if (currentContactData.length > 0 && currentContactData[0].email !== email) {
                // Update email
                await connection.execute(
                    `UPDATE contact SET email = ? WHERE id = ?`,
                    [email, contactId]
                );
            }
        } else {
            // Create new contact
            const [contactResult] = await connection.execute(
                sql_insert_contact,
                [firstName, lastName, phone, email]
            );
            contactId = contactResult.insertId;
        }
        
        // Check if contact already has a request for the same day (prevent multiple bookings per day)
        const [existingDayRequest] = await connection.query(
            `SELECT id FROM requestlog WHERE contact_id = ? AND DATE(date) = ? AND status IN (1, 2, 3)`,
            [contactId, date]
        );
        
        if (existingDayRequest.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Вече имате заявка за този ден. Един контакт може да направи само една заявка на ден.' });
        }
        
        // Fetch client_id if contact is already a client
        const [clientRows] = await connection.query(
            `SELECT client_id FROM client WHERE contact_id = ? LIMIT 1`,
            [contactId]
        );
        const clientId = clientRows.length > 0 ? clientRows[0].client_id : null;
        
        // Insert request into requestlog with status 1 (pending)
        const [result] = await connection.execute(
            sql_insert_request,
            [product.product_id, contactId, datetime, note, 1, clientId]
        );
        
        // Handle mailing list subscription
        try {
            const [existingMailingEntry] = await connection.query(
                `SELECT id, date_subscribed, date_unsubscribed FROM mailing_list WHERE contact_id = ? AND email = ?`,
                [contactId, email]
            );

            if (existingMailingEntry.length > 0) {
                // Email already exists for this contact
                const entry = existingMailingEntry[0];
                
                if (subscribe_email) {
                    // User wants to subscribe
                    if (entry.date_unsubscribed !== null) {
                        // Was unsubscribed, now resubscribing - reset subscription
                        await connection.execute(
                            `UPDATE mailing_list SET date_subscribed = CURDATE(), date_unsubscribed = NULL, client_id = ? WHERE id = ?`,
                            [clientId, entry.id]
                        );
                    } else {
                        // Already subscribed - just update client_id if null
                        await connection.execute(
                            `UPDATE mailing_list SET client_id = ? WHERE id = ? AND client_id IS NULL`,
                            [clientId, entry.id]
                        );
                    }
                } else {
                    // Update client_id even if not subscribing
                    await connection.execute(
                        `UPDATE mailing_list SET client_id = ? WHERE id = ? AND client_id IS NULL`,
                        [clientId, entry.id]
                    );
                }
                // If subscribe_email is false, don't create new entry
            } else {
                // New email for this contact - create entry
                const dateSubscribed = subscribe_email === true || subscribe_email === 1 ? new Date().toISOString().split('T')[0] : null;
                await connection.execute(
                    `INSERT INTO mailing_list (contact_id, email, date_subscribed, client_id) VALUES (?, ?, ?, ?)`,
                    [contactId, email, dateSubscribed, clientId]
                );
            }
        } catch (mailingErr) {
            // Log mailing list error but don't fail the booking
            console.warn('Mailing list error (non-critical):', mailingErr);
        }
        
        await connection.commit();
        res.json({ message: 'Заявката е изпратена за одобрение.', id: result.insertId });
        
    } catch (err) {
        await connection.rollback();
        console.error('Book error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

////////////////////////
///   HOLIDAY APIs   ///
////////////////////////

// Get all active holidays
app.get('/api/c-holidays', async (req, res) => {
    try {
        const [rows] = await db.query(sql_get_holidays_c);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
app.post('/api/disable-holiday', async (req, res) => {
    const holidayId = req.body.date;

    if (!holidayId) {
        return res.status(400).json({ error: 'Missing holiday' });
    }

    try {
        const [result] = await db.execute("UPDATE holidays SET is_active = 0 WHERE date = ?", [holidayId]);
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
            // Combine date and time into datetime for MariaDB
            // If time is null, it's a full day holiday (use 00:00:00)
            const datetime = holiday.time === null 
                ? `${holiday.date} 00:00:00`
                : `${holiday.date} ${holiday.time}:00`;
            
            await connection.execute(
                'INSERT INTO holidays (date, description) VALUES (?, ?)',
                [datetime, description]
            );
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

app.get('/api/client/:firstName/:lastName/:phone', async (req, res) => {
    const { firstName, lastName, phone } = req.params;
    try {
        const [rows] = await db.query(sql_get_client_by_compid, [firstName, lastName, phone]);
        if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/client/:firstName/:lastName/:phone/mailing-list', async (req, res) => {
    const { firstName, lastName, phone } = req.params;
    try {
        const [rows] = await db.query(sql_get_client_mailing_list, [firstName, lastName, phone]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/client/:firstName/:lastName/:phone/cards', async (req, res) => {
    const { firstName, lastName, phone } = req.params;
    try {
        const [rows] = await db.query(sql_get_client_card_info, [firstName, lastName, phone]);
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