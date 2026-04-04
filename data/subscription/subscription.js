// Subscription domain module
const db = require('../../database');
const queries = require('./queries');

async function approveSubscriptionPayment(req, res) {
    const { subscription_id, approved } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [subRows] = await connection.query(queries.getSubscriptionDetails, [subscription_id]);
        const subscription = subRows[0];

        if (!subscription) {
            await connection.rollback();
            return res.status(404).json({ error: 'Абонаментът не е намерен' });
        }

        // Determine new status based on approval
        const newSubStatus = approved ? 15 : 18;  // 15 = Active, 18 = Declined
        const newCardStatus = approved ? 15 : 19; // 15 = Active, 19 = Inactive

        // Update card status
        await connection.execute(queries.updateCardStatus, [newCardStatus, subscription.card_id]);

        // Create new subscription status record
        await connection.execute(
            `INSERT INTO subscription (product_id, card_id, start_date, expiration_date, status)
             SELECT product_id, card_id, start_date, expiration_date, ?
             FROM subscription WHERE id = ?`,
            [newSubStatus, subscription_id]
        );

        // Update related requestlog status
        const startDate = subscription.client_id ? new Date().toISOString().split('T')[0] : null;
        if (startDate) {
            const [reqRows] = await connection.query(queries.getRelatedRequestlog,
                [subscription.card_id, subscription.product_id, startDate]);
            
            if (reqRows.length > 0) {
                const orderEntry = reqRows[0];
                await connection.execute(
                    `INSERT INTO requestlog (order_id, contact_id, product_id, client_id, date, status)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderEntry.order_id, orderEntry.contact_id, orderEntry.product_id, 
                     orderEntry.client_id, orderEntry.date, newSubStatus]
                );
            }
        }

        await connection.commit();

        const message = approved 
            ? 'Абонаментът е активиран успешно.'
            : 'Абонаментът е отхвърлен.';

        res.json({ success: true, message });

    } catch (error) {
        await connection.rollback();
        console.error('Approve subscription payment error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
}

module.exports = {
    approveSubscriptionPayment
};
