// Auth domain - SQL queries

module.exports = {
    checkAccountLock: `
        SELECT locked_until FROM login_attempts 
        WHERE username = ? AND locked_until IS NOT NULL 
        ORDER BY locked_until DESC LIMIT 1
    `,
    
    insertLoginAttempt: `
        INSERT INTO login_attempts (username, ip_address, success, locked_until)
        VALUES (?, ?, ?, ?)
    `,
    
    getFailedAttempts: `
        SELECT COUNT(*) as count FROM login_attempts 
        WHERE username = ? AND success = 0 AND attempt_timestamp > ?
    `
};
