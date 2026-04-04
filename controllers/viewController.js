// View Controller
const viewDomain = require('../data/view/view');

async function getUnavailableSlots(req, res) {
    try {
        await viewDomain.getUnavailableSlots(req, res);
        
    } catch (error) {
        console.error('Get unavailable slots - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getUnavailableSlots
}