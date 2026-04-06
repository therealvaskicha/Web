// Request Controller - thin layer for HTTP concerns
const requestDomain = require('../data/request/request');

async function createRequest(req, res) {
    try {
        // Validate request
        const { firstName, lastName, date, time, booking_type } = req.body;
        
        if (!firstName || !lastName || !date || !time || !booking_type) {
            return res.status(400).json({ error: 'Липсват необходими полета.' });
        }
        
        // Call domain layer
        await requestDomain.insertRequest(req, res);
        
    } catch (error) {
        console.error('Request creation - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function approveRequest(req, res) {
    try {
        // Validate request
        const { firstName, lastName, date, time, booking_type } = req.body;
        
        if (!firstName || !lastName || !date || !time || !booking_type) {
            return res.status(400).json({ error: 'Липсват необходими полета.' });
        }
        
        // Call domain layer
        await requestDomain.approveRequest(req, res);
        
    } catch (error) {
        console.error('Request approval - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function rejectRequest(req, res) {
    try {
        // Validate request
        const { firstName, lastName, date, time, booking_type } = req.body;
        
        if (!firstName || !lastName || !date || !time || !booking_type) {
            return res.status(400).json({ error: 'Липсват необходими полета.' });
        }
        
        // Call domain layer
        await requestDomain.rejectRequest(req, res);
        
    } catch (error) {
        console.error('Request rejection - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function cancelRequest(req, res) {
    try {
        // Validate request
        const { firstName, lastName, date, time, booking_type } = req.body;
        
        if (!firstName || !lastName || !date || !time || !booking_type) {
            return res.status(400).json({ error: 'Липсват необходими полета.' });
        }
        
        // Call domain layer
        await requestDomain.cancelRequest(req, res);
        
    } catch (error) {
        console.error('Request cancellation -controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getPendingRequests(req, res) {
    try {
        await requestDomain.getPendingRequests(req, res);
        
    } catch (error) {
        console.error('Get pending requests - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getApprovedRequestsCalendar(req, res) {
    try {
        await requestDomain.getApprovedRequestsCalendar(req, res);
        
    } catch (error) {
        console.error('Get approved requests calendar - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getPendingRequestsCalendar(req, res) {
    try {
        await requestDomain.getPendingRequestsCalendar(req, res);
        
    } catch (error) {
        console.error('Get pending requests calendar - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getApprovedRequests(req, res) {
    try {
        await requestDomain.getApprovedRequests(req, res);
        
    } catch (error) {
        console.error('Get approved requests - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getRequestHistory(req, res) {
    try {
        await requestDomain.getRequestHistory(req, res);
        
    } catch (error) {
        console.error('Get request history - controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    getApprovedRequestsCalendar,
    getPendingRequests,
    getPendingRequestsCalendar,
    getApprovedRequests,
    getRequestHistory
};