const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

// TABLES
const sql_create_bookings_table = `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_type TEXT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        client_forename TEXT NOT NULL,
        client_lastname TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        client_email TEXT NOT NULL,
        booking_note TEXT DEFAULT NULL,
        subscribe_email BOOLEAN NOT NULL,
        stamp_created DATETIME DEFAULT CURRENT_TIMESTAMP,
        stamp_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        status INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(status) REFERENCES enum(id)
    )`;
const sql_create_holidays_table = `CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    time TIME DEFAULT NULL,
    is_active BOOLEAN DEFAULT 1,
    description TEXT DEFAULT NULL
    );`;
const sql_create_client_table = `CREATE TABLE IF NOT EXISTS client (
    client_id INTEGER PRIMARY KEY AUTOINCREMENT,
    foreName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    client_phone TEXT NOT NULL UNIQUE,
    client_email TEXT NOT NULL UNIQUE,
    stamp_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    stamp_modified DATETIME DEFAULT CURRENT_TIMESTAMP
);`;
const sql_create_mailing_list_table = `CREATE TABLE IF NOT EXISTS mailing_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    date_subscribed DATE NOT NULL,
    date_unsubscribed DEFAULT NULL,
    is_subscribed INTEGER DEFAULT 1,
    FOREIGN KEY(client_id) REFERENCES client(client_id)
);`

const sql_create_client_card_table = `CREATE TABLE IF NOT EXISTS client_card (
    card_id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 0,
    stamp_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    stamp_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES client(client_id),
    FOREIGN KEY(service_id) REFERENCES services(service_id)
);`

const sql_create_services_table = `CREATE TABLE IF NOT EXISTS services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    nr_credits INTEGER NOT NULL,
    is_subscription INTEGER NOT NULL,
    is_group INTEGER NOT NULL
);`

const sql_create_subscriptions_table = `CREATE TABLE IF NOT EXISTS subscriptions (
    sub_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    credits_balance INTEGER NOT NULL,
    start_date DATETIME NOT NULL,
    expiration_date DATETIME NOT NULL,
    status INTEGER NOT NULL DEFAULT 5,
    FOREIGN KEY(card_id) REFERENCES client_card(card_id),
    FOREIGN KEY(service_id) REFERENCES services(service_id),
    FOREIGN KEY(status) REFERENCES enum(id)
);`

const sql_create_enum_table = `CREATE TABLE IF NOT EXISTS enum (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enum_name TEXT NOT NULL,
    enum_value TEXT NOT NULL
);`

// Triggers to enforce unique constraints on holidays table
// 1. Only one full-day holiday per date (time IS NULL)
// 2. Only one time-specific holiday per date and time

db.run (`DROP TRIGGER IF EXISTS unique_date_full_day;`);
db.run (`DROP TRIGGER IF EXISTS unique_date_time;`);
db.run (`DROP TRIGGER IF EXISTS unique_client_booking;`);
db.run (`DROP TRIGGER IF EXISTS bookings_modified;`);
db.run (`DROP TRIGGER IF EXISTS client_modified;`);
db.run (`DROP TRIGGER IF EXISTS client_card_modified;`);

const sql_trigger_unique_date_full_day = `CREATE TRIGGER IF NOT EXISTS unique_date_full_day
    BEFORE INSERT ON holidays
    WHEN EXISTS (SELECT 1 FROM holidays WHERE date = NEW.date AND time IS NULL)
    BEGIN
      SELECT RAISE(ABORT, "Вече има зададена почивка за този ден.");
    END;`;
const sql_trigger_unique_date_time = `CREATE TRIGGER IF NOT EXISTS unique_date_time
    BEFORE INSERT ON holidays
    WHEN EXISTS (SELECT 1 FROM holidays WHERE date = NEW.date AND time = NEW.time)
    BEGIN
      SELECT RAISE(ABORT, "Вече има зададена почивка за този часови интервал.");
    END;`;

const sql_trigger_unique_client_booking = `CREATE TRIGGER IF NOT EXISTS unique_client_booking
    BEFORE INSERT ON bookings
    WHEN EXISTS (SELECT 1 FROM bookings WHERE client_email = NEW.client_email AND client_phone = NEW.client_phone AND date = NEW.date AND status in (1,2))
    BEGIN
      SELECT RAISE(ABORT, "Вече има заявна тренировка от този клиент за този ден.");
    END;`;

const sql_trigger_bookings_modified = `CREATE TRIGGER IF NOT EXISTS bookings_modified
    AFTER UPDATE OF status ON bookings
    BEGIN
        UPDATE bookings 
        SET stamp_modified = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
    END;`;

const sql_trigger_client_modified = `CREATE TRIGGER IF NOT EXISTS client_modified
    AFTER UPDATE OF client_phone, client_email ON client
    BEGIN
        UPDATE client 
        SET stamp_modified = CURRENT_TIMESTAMP 
        WHERE client_id = NEW.client_id;
    END;`;

const sql_trigger_client_card_modified = `CREATE TRIGGER IF NOT EXISTS client_card_modified
    AFTER UPDATE OF is_active ON client_card
    BEGIN
        UPDATE client_card 
        SET stamp_modified = CURRENT_TIMESTAMP 
        WHERE card_id = NEW.card_id;
    END;`;

// EXECUTE TABLE CREATION STATEMENTS
db.serialize(() => {

    // Bookings table
    db.run(sql_create_bookings_table, (err) => {
        if (err) {
            console.error("Error creating bookings table:", err.message);
        }
    });

    // Holidays table
    db.run(sql_create_holidays_table, (err) => {
        if (err) {
            console.error("Error creating bookings table:", err.message);
        }
    });

    // Client table
    db.run(sql_create_client_table, (err) => {
        if (err) {
            console.error("Error creating client table:", err.message);
        }
    });

    // Mailing list table
    db.run(sql_create_mailing_list_table, (err) => {
        if (err) {
            console.error("Error creating mailing_list table:", err.message);
        }
    });

    // Client card table
        db.run(sql_create_client_card_table, (err) => {
        (err) => {
            console.error("Error creating client_card table:", err.message);
        }
    });

    // Services table
        db.run(sql_create_services_table, (err) => {
        (err) => {
            console.error("Error creating services table:", err.message);
        }
    });

    // Subscriptions table
        db.run(sql_create_subscriptions_table, (err) => {
        (err) => {
            console.error("Error creating subscriptions table:", err.message);
        }
    });

    // Enum table
    db.run(sql_create_enum_table, (err) => {
        if (err) {
            console.error("Error creating enum table:", err.message);
        }
    });

// Triggers to enforce
db.run (sql_trigger_unique_date_full_day);
db.run (sql_trigger_unique_date_time);
db.run (sql_trigger_unique_client_booking);
db.run (sql_trigger_bookings_modified);
db.run (sql_trigger_client_modified);
db.run (sql_trigger_client_card_modified);

// Views
// db.run ('DROP VIEW IF EXISTS v_unavailable_slots;');

// view for unavailable slots (booked or holiday)
const v_sql_create_unavailable_slots = `
CREATE VIEW IF NOT EXISTS v_unavailable_slots AS
SELECT date, time, status 
    FROM bookings
    WHERE
    status = 2
    AND date >= date('now') 
    AND (date > date('now') 
        OR (date = date('now') AND time > strftime('%H:%M', 'now', '-1 hour')))
UNION ALL
SELECT date, time, 'holiday' as status
    FROM holidays
WHERE is_active = 1`;

// view for checking credits balance and expiration date
const v_sql_create_check_credits = `
CREATE VIEW IF NOT EXISTS v_check_credits AS
SELECT card_id, credits_balance, expiration_date
    FROM subscriptions
    LIMIT 1
    `;

// create the views
db.run(v_sql_create_unavailable_slots, (err) => {
    if (err) {
        console.error("Error creating v_available_slots view:", err.message); 
    }
});

db.run(v_sql_create_check_credits, (err) => {
    if (err) {
        console.error("Error creating v_check_credits view:", err.message);
    }
});

// One-off queries for testing or resetting the database
    // db.run(`DELETE FROM bookings where id in (14,15);`);


    // drop all tables
    // db.run (`DROP TABLE IF EXISTS bookings;`);
    // db.run (`DROP TABLE IF EXISTS holidays;`);
    // db.run (`DROP TABLE IF EXISTS client;`);
    // db.run (`DROP TABLE IF EXISTS mailing_list;`);
    // db.run (`DROP TABLE IF EXISTS client_card;`);
    // db.run (`DROP TABLE IF EXISTS subscriptions;`);
});

module.exports = db;