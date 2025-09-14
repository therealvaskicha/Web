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

    // db.run (`DROP TABLE IF EXISTS holidays;`);

    db.run(`CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    time TIME DEFAULT NULL,
    is_active BOOLEAN DEFAULT 1,
    description TEXT DEFAULT NULL
    );`);

    db.run(`CREATE TRIGGER IF NOT EXISTS unique_date_full_day
    BEFORE INSERT ON holidays
    WHEN EXISTS (SELECT 1 FROM holidays WHERE date = NEW.date AND time IS NULL)
    BEGIN
      SELECT RAISE(ABORT, 'unique_date_full_day');
    END;`);

    db.run(`CREATE TRIGGER IF NOT EXISTS unique_date_time
    BEFORE INSERT ON holidays
    WHEN EXISTS (SELECT 1 FROM holidays WHERE date = NEW.date AND time = NEW.time)
    BEGIN
      SELECT RAISE(ABORT, 'unique_date_time');
    END;`);

    // db.run(`INSERT INTO holidays (date, description) VALUES ('2025-12-24','Коледа')`, function(err) {
    //     if (err) {
    //         console.error('Error with the query:', err);
    //         // Handle the error here, e.g. log it or display an error message to the user
    //     } else {
    //         console.log('Successful query.');
    //     }
    //     });
});

module.exports = db;