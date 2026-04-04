// Request domain module
const db = require('../../database');
const queries = require('./queries');

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function addMonths(date, months) {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
}

async function insertRequestStatus(connection, orderId, contactId, productId, clientId, appointmentDate, newStatus) {
    await connection.execute(
        `INSERT INTO requestlog (order_id, contact_id, product_id, client_id, date, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, contactId, productId, clientId, appointmentDate, newStatus]
    );
}

async function approveRequest(req, res) {
    const { firstName, lastName, date, time, booking_type } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const timeValue = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
        const [requestRows] = await connection.query(queries.getPendingRequest, 
            [firstName, lastName, date, timeValue, booking_type]);
        const request = requestRows[0];
        
        if (!request) {
            await connection.rollback();
            return res.status(404).json({ error: 'Заявката не е намерена' });
        }

        if (![1, 10].includes(request.status)) {
            await connection.rollback();
            return res.status(400).json({ error: 'Заявката вече е обработена.' });
        }

        // Update request status
        await insertRequestStatus(
            connection, 
            request.order_id, 
            request.contact_id, 
            request.product_id, 
            request.client_id, 
            request.date, 
            2  // Approved status
        );

        // Create or get client
        if (!request.client_id) {
            const [existingRows] = await connection.query(queries.getExistingClient, 
                [request.firstName, request.lastName, request.phone]);
            
            if (!existingRows[0]) {
                const [nextClientIdResult] = await connection.query(queries.getNextClientId);
                const nextClientId = nextClientIdResult[0].next_id;
                
                await connection.execute(
                    queries.insertClient,
                    [request.contact_id, nextClientId]
                );
            }
        }

        // Handle subscription requests
        if (request.service_type && [10, 11].includes(request.service_type)) {
            // This is a subscription request
            const clientId = request.client_id || existingRows[0]?.client_id;

            // Check for existing card
            const [cardRows] = await connection.query(queries.checkExistingCard, [clientId]);
            let cardId;

            if (cardRows.length === 0) {
                // Create new card
                const [nextCardIdResult] = await connection.query(queries.getNextCardId);
                const nextCardId = nextCardIdResult[0].next_id;
                
                const [cardResult] = await connection.execute(
                    `INSERT INTO card (client_id, card_id, status) VALUES (?, ?, 19)`,
                    [clientId, nextCardId]
                );
                cardId = nextCardId;
            } else {
                cardId = cardRows[0].card_id;
            }

            // Check for duplicate subscription
            const startDate = formatDate(new Date(request.date));
            const [duplicateRows] = await connection.query(queries.getDuplicateSubscription, 
                [cardId, request.product_id, startDate]);

            if (duplicateRows.length === 0) {
                const expirationDate = formatDate(addMonths(new Date(request.date), 1));
                
                await connection.execute(
                    queries.insertSubscription,
                    [request.product_id, cardId, startDate, expirationDate]
                );
            }

            await connection.commit();
            return res.json({ message: 'Абонаментната заявка е създадена. Очаква се потвърждение на плащането.' });
        }

        await connection.commit();
        res.json({ message: 'Заявката е одобрена.' });

    } catch (error) {
        await connection.rollback();
        console.error('Approve error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
}

async function rejectRequest(req, res) {
    const { firstName, lastName, date, time, booking_type } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const timeValue = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
        const [requestRows] = await connection.query(queries.getPendingRequest, 
            [firstName, lastName, date, timeValue, booking_type]);
        const request = requestRows[0];
        
        if (!request) {
            await connection.rollback();
            return res.status(404).json({ error: 'Заявката не е намерена' });
        }

        if (![1, 10].includes(request.status)) {
            await connection.rollback();
            return res.status(400).json({ error: 'Заявката вече е обработена.' });
        }

        // Update request status to rejected (7)
        await insertRequestStatus(
            connection, 
            request.order_id, 
            request.contact_id, 
            request.product_id, 
            request.client_id, 
            request.date, 
            7  // Rejected status
        );

        await connection.commit();
        res.json({ message: 'Заявката е отхвърлена.' });

    } catch (error) {
        await connection.rollback();
        console.error('Reject error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
}

async function cancelRequest(req, res) {
    const { firstName, lastName, date, time, booking_type } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const timeValue = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
        const [requestRows] = await connection.query(queries.getPendingRequest, 
            [firstName, lastName, date, timeValue, booking_type]);
        const request = requestRows[0];
        
        if (!request) {
            await connection.rollback();
            return res.status(404).json({ error: 'Заявката не е намерена' });
        }

        // Update request status to cancelled (9)
        await insertRequestStatus(
            connection, 
            request.order_id, 
            request.contact_id, 
            request.product_id, 
            request.client_id, 
            request.date, 
            9  // Cancelled status
        );

        await connection.commit();
        res.json({ message: 'Заявката е отменена.' });

    } catch (error) {
        await connection.rollback();
        console.error('Cancel error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
}

async function getPendingRequests(req, res) {
    try {
        const [rows] = await db.query(queries.getPendingRequests);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getApprovedRequestsCalendar(req, res) {
    try {
        const [rows] = await db.query(queries.getApprovedRequestsCalendar);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getPendingRequestsCalendar(req, res) {
    try {
        const [rows] = await db.query(queries.getPendingRequestsCalendar);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getApprovedRequests(req, res) {
    try {
        const [rows] = await db.query(queries.getApprovedRequests);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getCompletedBookingsCalendar(req, res) {
    try {
        const [rows] = await db.query(queries.getCompletedBookingsCalendar);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getRequestHistory(req, res) {
    try {
        const [rows] = await db.query(queries.getRequestHistory);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    approveRequest,
    rejectRequest,
    cancelRequest,
    insertRequestStatus,
    getPendingRequests,
    getApprovedRequestsCalendar,
    getPendingRequestsCalendar,
    getApprovedRequests,
    getCompletedBookingsCalendar,
    getRequestHistory
};
