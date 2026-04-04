// Subscription Controller - thin layer for HTTP concerns
const subscriptionDomain = require('../data/subscription/subscription');

async function approveSubscriptionPayment(req, res) {
    try {
        const { subscription_id, approved } = req.body;
        
        if (subscription_id === undefined || approved === undefined) {
            return res.status(400).json({ error: 'subscription_id и approved са задължителни' });
        }
        
        if (typeof approved !== 'boolean') {
            return res.status(400).json({ error: 'approved трябва да е boolean' });
        }
        
        // Call domain layer
        await subscriptionDomain.approveSubscriptionPayment(req, res);
        
    } catch (error) {
        console.error('Subscription payment approval controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    approveSubscriptionPayment
};
