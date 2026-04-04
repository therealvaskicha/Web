// Booking domain - SQL queries

module.exports = {
    selectServiceByName: `
        SELECT product_id, name FROM product WHERE name = ? LIMIT 1
    `,
    
    getContactByDetails: `
        SELECT id FROM contact WHERE firstName = ? AND lastName = ? AND phone = ?
    `,
    
    getContactPhone: `
        SELECT id, firstName, lastName FROM contact WHERE phone = ?
    `,
    
    insertContact: `
        INSERT INTO contact (firstName, lastName, phone, email) VALUES (?, ?, ?, ?)
    `,
    
    updateContactEmail: `
        UPDATE contact SET email = ? WHERE id = ?
    `,
    
    getRequestByContactAndDate: `
        SELECT id FROM requestlog WHERE contact_id = ? AND DATE(date) = ? AND status IN (1, 2, 3, 11)
    `,
    
    insertRequest: `
        INSERT INTO requestlog (product_id, contact_id, date, note, status, client_id) VALUES (?, ?, ?, ?, ?, ?)
    `,
    
    checkSlotAvailability: `
        SELECT * FROM requestlog WHERE DATE(date) = ? AND TIME(date) = ? AND status IN (2, 3, 11)
    `,
    
    getClientIdByContact: `
        SELECT client_id FROM client WHERE contact_id = ? LIMIT 1
    `,
    
    getExistingMailingEntry: `
        SELECT id, date_subscribed, date_unsubscribed FROM mailing_list 
        WHERE contact_id = ? AND email = ?
    `,
    
    insertMailingListEntry: `
        INSERT INTO mailing_list (contact_id, email, date_subscribed, client_id) VALUES (?, ?, ?, ?)
    `,
    
    updateMailingListSubscription: `
        UPDATE mailing_list SET date_subscribed = ?, date_unsubscribed = NULL, client_id = ? 
        WHERE contact_id = ? AND email = ?
    `,
    insertBooking: `
      INSERT INTO booking (order_id, product_id, client_id, date, status) VALUES (?, ?, ?, ?, 5)
    `,
    getCompletedBookingsCalendar: `
    SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
        from booking
        WHERE date <= curdate()
    `,
};
