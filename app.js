const express = require('express');
const path = require('path');
const db = require('./database');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
require('dotenv').config();


// Import controllers
const bookingController = require('./controllers/bookingController');
const requestController = require('./controllers/requestController');
const holidayController = require('./controllers/holidayController');
const clientController = require('./controllers/clientController');
const subscriptionController = require('./controllers/subscriptionController');
const viewController = require('./controllers/viewController');

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
        const rows = await db.query(
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
        await db.query(query, params);
    } catch (err) {
        console.error('Error recording login attempt:', err);
    }
}

// Check failed login attempts
async function checkFailedAttempts(username) {
    const windowMs = parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS) || 15 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - windowMs).toISOString();
    
    try {
        const rows = await db.query(
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

// function formatDate(date) {
//     return date.toISOString().split('T')[0];
// }

// function addMonths(date, months) {
//     const newDate = new Date(date);
//     newDate.setMonth(newDate.getMonth() + months);
//     return newDate;
// }

// Helper function to find request by composite key
// async function findRequestByCompositeKey(connection, firstName, lastName, date, time, booking_type) {
//     const timeValue = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
//     const requestRows = await connection.query(sql_get_pending_request, [firstName, lastName, date, timeValue, booking_type]);
//     return requestRows[0] || null;
// }

////////////////////////
///   REQUEST APIs   ///
////////////////////////

// GET requests
app.get('/api/pending', (req, res) => requestController.getPendingRequests(req, res));

app.get('/api/c-pending', (req, res) => requestController.getPendingRequestsCalendar(req, res));

app.get('/api/c-approved-requests', (req, res) => requestController.getApprovedRequestsCalendar(req, res));

app.get('/api/approved-requests', (req, res) => requestController.getApprovedRequests(req, res));

app.get('/api/c-completed-bookings', (req, res) => bookingController.getCompletedBookingsCalendar(req, res));

app.get('/api/unavailable-slots', (req, res) => viewController.getUnavailableSlots(req, res));

app.get('/api/request-history', (req, res) => requestController.getRequestHistory(req, res));

// POST requests
app.post('/api/approve', (req, res) => requestController.approveRequest(req, res));

app.post('/api/reject', (req, res) => requestController.rejectRequest(req, res));

app.post('/api/cancel', (req, res) => requestController.cancelRequest(req, res));

app.post('/api/book', (req, res) => requestController.createRequest(req, res));

// Approve or decline subscription payment
app.post('/api/approve-subscription-payment', (req, res) => subscriptionController.approveSubscriptionPayment(req, res));

////////////////////////
///   HOLIDAY APIs   ///
////////////////////////

// Get all active holidays
app.get('/api/c-holidays', (req, res) => holidayController.getHolidaysForCalendar(req, res));

app.get('/api/holidays', (req, res) => holidayController.getAllHolidays(req, res));

app.post('/api/auto-deactivate-past-holidays', (req, res) => holidayController.deactivatePastHolidays(req, res));

app.post('/api/disable-holiday', (req, res) => holidayController.deactivateHoliday(req, res));

app.post('/api/add-holiday', (req, res) => holidayController.addHoliday(req, res));

////////////////////////
///   CLIENT APIs   ///
////////////////////////

app.get('/api/clients', (req, res) => clientController.getAllClients(req, res));

// Composite key routes (more specific) - must come first
app.get('/api/client/:firstName/:lastName/:phone', (req, res) => clientController.getClientByCompositeKey(req, res));

app.get('/api/client/:firstName/:lastName/:phone/mailing-list', (req, res) => clientController.getClientMailingListByComposite(req, res));

app.get('/api/client/:firstName/:lastName/:phone/cards', (req, res) => clientController.getClientCardsByComposite(req, res));

// ID-based routes (less specific) - must come after
app.get('/api/client/:id', (req, res) => clientController.getClientById(req, res));

app.get('/api/client/:id/mailing-list', (req, res) => clientController.getClientMailingList(req, res));

app.get('/api/client/:id/cards', (req, res) => clientController.getClientCards(req, res));

////////////////////////
///  START SERVER   ///
////////////////////////

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});