// Auth domain module
const db = require('../../database');
const queries = require('./queries');

async function checkAccountLock(username) {
    try {
        const [rows] = await db.query(queries.checkAccountLock, [username]);
        
        if (rows.length > 0 && new Date(rows[0].locked_until) > new Date()) {
            const remainingTime = Math.ceil((new Date(rows[0].locked_until) - new Date()) / 1000 / 60);
            return {
                locked: true,
                remainingTime,
                message: `Акаунтът е заключен. Опитайте отново за ${remainingTime} минути.`
            };
        }
        
        return { locked: false };
    } catch (err) {
        console.error('Error checking account lock:', err);
        throw err;
    }
}

async function recordLoginAttempt(username, ip, success) {
    const lockoutDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MS) || 30 * 60 * 1000;
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + lockoutDuration);

    try {
        await db.execute(
            queries.insertLoginAttempt, 
            [username, ip, success ? 1 : 0, success ? null : lockedUntil.toISOString()]
        );
    } catch (err) {
        console.error('Error recording login attempt:', err);
    }
}

async function getFailedAttempts(username) {
    const windowMs = parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS) || 15 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - windowMs).toISOString();
    
    try {
        const [rows] = await db.query(queries.getFailedAttempts, [username, cutoffTime]);
        return rows[0]?.count || 0;
    } catch (err) {
        console.error('Error checking failed attempts:', err);
        return 0;
    }
}

module.exports = {
    checkAccountLock,
    recordLoginAttempt,
    getFailedAttempts
};