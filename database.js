const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_type TEXT,
        date TEXT,
        time TEXT,
        client_name TEXT,
        client_phone TEXT,
        client_email TEXT,
        subscribe_email BOOLEAN,
        timestamp TEXT,
        status TEXT
    )`, (err) => {
        if (err) {
            console.error("Error creating bookings table:", err.message);
        } else {
            console.log("Bookings table created or already exists.");
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        time TEXT DEFAULT NULL
    )`, (err) => {
        if (err) {
            console.error("Error creating holidays table:", err.message);
        } else {
            console.log("Holidays table created or already exists.");
        }
    });
    // Example holiday insertion
    //  db.run(`INSERT INTO holidays (date) VALUES ('2025-09-14')`)
});

module.exports = db;