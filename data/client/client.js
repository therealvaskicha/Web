// Client domain module
const db = require('../../database');
const queries = require('./queries');

async function getAllClients(req, res) {
    try {
        const [rows] = await db.query(queries.client.getAllClients);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getClientById(clientId) {
    try {
        const [rows] = await db.query(queries.client.getClientById, [clientId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Get client by ID error:', error);
        throw error;
    }
}

async function getClientMailingList(clientId) {
    try {
        const [rows] = await db.query(queries.client.getClientMailingList, [clientId]);
        return rows;
    } catch (error) {
        console.error('Get client mailing list error:', error);
        throw error;
    }
}

async function getClientCards(clientId) {
    try {
        const [rows] = await db.query(queries.client.getClientCards, [clientId]);
        return rows;
    } catch (error) {
        console.error('Get client cards error:', error);
        throw error;
    }
}

async function getClientByCompositeKey(firstName, lastName, phone) {
    try {
        const [rows] = await db.query(queries.client.getClientByCompId, [firstName, lastName, phone]);
        return rows[0] || null;
    } catch (error) {
        console.error('Get client by composite key error:', error);
        throw error;
    }
}

// Internal method - includes contact_id for private use
async function getClientByCompositeKeyInternal(firstName, lastName, phone) {
    try {
        const [rows] = await db.query(queries.client.getClientByCompIdInternal, [firstName, lastName, phone]);
        return rows[0] || null;
    } catch (error) {
        console.error('Get client by composite key internal error:', error);
        throw error;
    }
}

async function getClientMailingListByComposite(firstName, lastName, phone) {
    try {
        // First get client by composite key (internal version with contact_id)
        const client = await getClientByCompositeKeyInternal(firstName, lastName, phone);
        if (!client) return null;
        
        // Get client_id from contact_id for internal query
        const [clientIdResult] = await db.query(queries.client.getClientByContactId, [client.contact_id]);
        if (!clientIdResult[0]) return [];
        const clientId = clientIdResult[0].client_id;
        
        // Then get mailing list using client_id
        const [rows] = await db.query(queries.client.getClientMailingList, [clientId]);
        return rows;
    } catch (error) {
        console.error('Get client mailing list by composite key error:', error);
        throw error;
    }
}

async function getClientCardsByComposite(firstName, lastName, phone) {
    try {
        // First get client by composite key (internal version with contact_id)
        const client = await getClientByCompositeKeyInternal(firstName, lastName, phone);
        if (!client) return [];
        
        // Get client_id from contact_id for internal query
        const [clientIdResult] = await db.query(queries.client.getClientByContactId, [client.contact_id]);
        if (!clientIdResult[0]) return [];
        const clientId = clientIdResult[0].client_id;
        
        // Then get cards using client_id
        const [rows] = await db.query(queries.client.getClientCards, [clientId]);
        return rows;
    } catch (error) {
        console.error('Get client cards by composite key error:', error);
        throw error;
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
