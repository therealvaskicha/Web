SELECT locked_until FROM login_attempts 
WHERE username = ? AND locked_until IS NOT NULL 
ORDER BY locked_until DESC LIMIT 1