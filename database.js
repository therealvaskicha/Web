const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

// SQL variables
const sql_create_bookings_table = `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_type TEXT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        client_email TEXT NOT NULL,
        booking_note TEXT DEFAULT NULL,
        subscribe_email BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
    )`;
const sql_create_holidays_table = `CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    time TIME DEFAULT NULL,
    is_active BOOLEAN DEFAULT 1,
    description TEXT DEFAULT NULL
    );`;

const sql_trigger_unique_date_full_day = `CREATE TRIGGER IF NOT EXISTS unique_date_full_day
    BEFORE INSERT ON holidays
    WHEN EXISTS (SELECT 1 FROM holidays WHERE date = NEW.date AND time IS NULL)
    BEGIN
      SELECT RAISE(ABORT, 'unique_date_full_day');
    END;`;
const sql_trigger_unique_date_time = `CREATE TRIGGER IF NOT EXISTS unique_date_time
    BEFORE INSERT ON holidays
    WHEN EXISTS (SELECT 1 FROM holidays WHERE date = NEW.date AND time = NEW.time)
    BEGIN
      SELECT RAISE(ABORT, 'unique_date_time');
    END;`;


// Execute the table creation statements
db.serialize(() => {

    // Bookings table
    db.run(sql_create_bookings_table, (err) => {
        if (err) {
            console.error("Error creating bookings table:", err.message);
        } else {
            console.log("Bookings table created or already exists.");
        }
    });

    // Holidays table
    db.run(sql_create_holidays_table, (err) => {
        (err) => {
        if (err) {
            console.error("Error creating bookings table:", err.message);
        } else {
            console.log("Bookings table created or already exists.");
        }
        }
    });


// Triggers to enforce
db.run (sql_trigger_unique_date_full_day);
db.run (sql_trigger_unique_date_time);


// One-off queries for testing or resetting the database

// db.run (`DROP TABLE IF EXISTS holidays;`);
// db.run (`DROP TABLE IF EXISTS bookings;`);

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