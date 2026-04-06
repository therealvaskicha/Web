module.exports = {
    checkSlotAvailability: `
        SELECT * FROM requestlog WHERE DATE(date) = ? AND TIME(date) = ? AND status IN (2, 3, 11)
    `,

    selectServiceByName: `
        SELECT product_id, name FROM product WHERE name = ? LIMIT 1
    `,

    getContactPhone: `
        SELECT id, firstName, lastName FROM contact WHERE phone = ?
    `,

    getContactByDetails: `
        SELECT id FROM contact WHERE firstName = ? AND lastName = ? AND phone = ?
    `,

    getEmail: `
        SELECT email FROM contact WHERE id = ?
    `,

    updateContactEmail: `
        UPDATE contact SET email = ? WHERE id = ?
    `,

    insertContact: `
        INSERT INTO contact (firstName, lastName, phone, email) VALUES (?, ?, ?, ?)
    `,

    getRequestByContactAndDate: `
        SELECT id FROM requestlog WHERE contact_id = ? AND DATE(date) = ?
    `,

    getClientIdByContact: `
        SELECT client_id FROM client WHERE contact_id = ? LIMIT 1
    `,

    insertRequest: `
        INSERT INTO requestlog (product_id, contact_id, date, note, status, client_id) VALUES (?, ?, ?, ?, ?, ?)
    `,

    getExistingMailingEntry: `
        SELECT id, date_subscribed, date_unsubscribed FROM mailing_list 
        WHERE contact_id = ? AND email = ?
    `,

    updateMailingListSubscription: `
        UPDATE mailing_list SET date_subscribed = ?, date_unsubscribed = NULL, client_id = ? 
        WHERE contact_id = ? AND email = ?
    `,

    updateMailingClientId: `
        UPDATE mailing_list SET client_id = ? WHERE contact_id = ? AND email = ?
    `,

    insertMailingListEntry: `
        INSERT INTO mailing_list (contact_id, email, date_subscribed, client_id) VALUES (?, ?, ?, ?)
    `,
};
