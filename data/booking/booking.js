// Booking domain module
const db = require('../../database');
const queries = require('./queries');

async function createBooking(req, res) {
    const { booking_type, date, time, firstName, lastName, phone, email, note, subscribe_email } = req.body;

    if (!booking_type || !date || !time || !firstName || !lastName || !phone || !email) {
        return res.status(400).json({ error: 'Липсват необходими полета.' });
    }
    
    const datetime = `${date} ${time}:00`;
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check slot availability
        const existingRows = await connection.query(
            queries.checkSlotAvailability,
            [date, `${time}:00`]
        );
        
        if (existingRows.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'За съжаление този час е зает. Моля изберете свободен час.' });
        }
        
        // Get product
        const productRows = await connection.query(queries.selectServiceByName, [booking_type]);
        const product = productRows[0];
        
        if (!product) {
            await connection.rollback();
            return res.status(400).json({ error: 'Невалиден тип тренировка.' });
        }
        
        // Check phone conflict
        const phoneCheckRows = await connection.query(queries.getContactPhone, [phone]);
        if (phoneCheckRows.length > 0) {
            const existingContact = phoneCheckRows[0];
            if (existingContact.firstName !== firstName || existingContact.lastName !== lastName) {
                await connection.rollback();
                return res.status(400).json({ error: 'Контакт с този номер на телефон вече е известен.' });
            }
        }
        
        // Get or create contact
        const contactRows = await connection.query(queries.getContactByDetails, [firstName, lastName, phone]);
        let contactId;
        
        if (contactRows.length > 0) {
            contactId = contactRows[0].id;
            
            // Update email if different
            const currentContactData = await connection.query(
                `SELECT email FROM contact WHERE id = ?`,
                [contactId]
            );
            
            if (currentContactData.length > 0 && currentContactData[0].email !== email) {
                await connection.query(queries.updateContactEmail, [email, contactId]);
            }
        } else {
            const contactResult = await connection.query(
                queries.insertContact,
                [firstName, lastName, phone, email]
            );
            contactId = contactResult.insertId;
        }
        
        // Check for duplicate booking same day
        const existingDayRequest = await connection.query(
            queries.getRequestByContactAndDate,
            [contactId, date]
        );
        
        if (existingDayRequest.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Вече имате заявка за този ден. Един контакт може да направи само една заявка на ден.' });
        }
        
        // Get client_id if contact is already a client
        const clientRows = await connection.query(queries.getClientIdByContact, [contactId]);
        const clientId = clientRows.length > 0 ? clientRows[0].client_id : null;
        
        // Insert request
        const result = await connection.query(
            queries.insertRequest,
            [product.product_id, contactId, datetime, note, 1, clientId]
        );
        
        // Handle mailing list
        const dateSubscribed = subscribe_email === true || subscribe_email === 1 ? new Date().toISOString().split('T')[0] : null;
        
        try {
            const existingMailingEntry = await connection.query(
                queries.getExistingMailingEntry,
                [contactId, email]
            );
            
            if (existingMailingEntry.length > 0) {
                const entry = existingMailingEntry[0];
                
                if (subscribe_email && !entry.date_subscribed && !entry.date_unsubscribed) {
                    // First subscription
                    await connection.query(
                        queries.updateMailingListSubscription,
                        [dateSubscribed, clientId, contactId, email]
                    );
                } else if (subscribe_email && entry.date_unsubscribed) {
                    // Re-subscribe after unsubscribe
                    await connection.query(
                        queries.updateMailingListSubscription,
                        [dateSubscribed, clientId, contactId, email]
                    );
                } else if (!subscribe_email && !entry.date_subscribed) {
                    // Update client_id if it was missing
                    if (!entry.date_subscribed) {
                        await connection.query(
                            `UPDATE mailing_list SET client_id = ? WHERE contact_id = ? AND email = ?`,
                            [clientId, contactId, email]
                        );
                    }
                }
            } else {
                // New email - create new mailing entry
                await connection.query(
                    queries.insertMailingListEntry,
                    [contactId, email, dateSubscribed, clientId]
                );
            }
        } catch (mailingErr) {
            console.warn('Mailing list error (non-critical):', mailingErr);
        }
        
        await connection.commit();
        res.json({ message: 'Заявката е изпратена за одобрение.', id: result.insertId });
        
    } catch (err) {
        await connection.rollback();
        console.error('Book error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await connection.end();
    }
}

module.exports = {
    createBooking
};
