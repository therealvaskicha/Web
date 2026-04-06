// Booking Controller - thin layer for HTTP concerns
const bookingDomain = require('../data/booking/booking');

async function createRequest(req, res) {
    try {
        // Validate request
        const { booking_type, date, time, firstName, lastName, phone, email, note, subscribe_email } = req.body;
        
        if (!booking_type || !date || !time || !firstName || !lastName || !phone || !email || !note || !subscribe_email
        ) {
            return res.status(400).json({ error: 'Липсват необходими полета.' });
        }
        
        // Call domain layer
        const result = await bookingDomain.createRequest(req, res);
        
        // Response is handled by domain, but we can add logging/analytics here
        console.log(`Request created for ${firstName} ${lastName}`);
        
    } catch (error) {
        console.error('Request creation - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    createRequest
};
