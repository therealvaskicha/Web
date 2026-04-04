// Client Controller - thin layer for HTTP concerns
const clientDomain = require('../data/client/client');

async function getAllClients(req, res) {
    try {
        await clientDomain.getAllClients(req, res);

    } catch (err) {
        console.error('Get all clients controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getClientById(req, res) {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'ID е задължително' });
        }
        
        const client = await clientDomain.getClientById(id);
        
        if (!client) {
            return res.status(404).json({ error: 'Клиент не е намерен' });
        }
        
        res.json(client);
    } catch (err) {
        console.error('Get client by ID controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getClientMailingList(req, res) {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'ID е задължително' });
        }
        
        const mailingList = await clientDomain.getClientMailingList(id);
        res.json(mailingList || []);
    } catch (err) {
        console.error('Get client mailing list controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getClientCards(req, res) {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'ID е задължително' });
        }
        
        const cards = await clientDomain.getClientCards(id);
        res.json(cards);
    } catch (err) {
        console.error('Get client cards controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getClientByCompositeKey(req, res) {
    try {
        const { firstName, lastName, phone } = req.params;
        
        if (!firstName || !lastName || !phone) {
            return res.status(400).json({ error: 'firstName, lastName, phone են задължителни' });
        }
        
        const client = await clientDomain.getClientByCompositeKey(firstName, lastName, phone);
        
        if (!client) {
            return res.status(404).json({ error: 'Клиент не е намерен' });
        }
        
        res.json(client);
    } catch (err) {
        console.error('Get client by composite key controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getClientMailingListByComposite(req, res) {
    try {
        const { firstName, lastName, phone } = req.params;
        
        if (!firstName || !lastName || !phone) {
            return res.status(400).json({ error: 'firstName, lastName, phone են задължителни' });
        }
        
        const mailingList = await clientDomain.getClientMailingListByComposite(firstName, lastName, phone);
        res.json(mailingList || []);
    } catch (err) {
        console.error('Get client mailing list by composite key controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getClientCardsByComposite(req, res) {
    try {
        const { firstName, lastName, phone } = req.params;
        
        if (!firstName || !lastName || !phone) {
            return res.status(400).json({ error: 'firstName, lastName, phone են задължителни' });
        }
        
        const cards = await clientDomain.getClientCardsByComposite(firstName, lastName, phone);
        res.json(cards);
    } catch (err) {
        console.error('Get client cards by composite key controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getAllClients,
    getClientById,
    getClientMailingList,
    getClientCards,
    getClientByCompositeKey,
    getClientMailingListByComposite,
    getClientCardsByComposite
};
