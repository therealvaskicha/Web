module.exports = {
    getAllClients: `
      SELECT ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created 
      FROM client c JOIN contact ct ON c.contact_id = ct.id 
      ORDER BY ct.firstName
    `,
    getClientById: `
      SELECT ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created, c.stamp_modified 
      FROM client c JOIN contact ct ON c.contact_id = ct.id 
      WHERE c.client_id = ? LIMIT 1
    `,

    getClientByContactId: `
      SELECT client_id FROM client WHERE contact_id = ? LIMIT 1
    `,

    getClientMailingList: `SELECT m.date_subscribed, m.date_unsubscribed 
      FROM mailing_list m join contact ct on m.contact_id = ct.id
      WHERE ct.firstName = ? and ct.lastName = ? and ct.phone = ?
    `,

    getContactByDetails: `
      SELECT id FROM contact WHERE firstName = ? AND lastName = ? AND phone = ?
    `,

    getClientMailingListByClientId: `
      SELECT m.date_subscribed, m.date_unsubscribed 
      FROM mailing_list m join contact ct on m.contact_id = ct.id
      WHERE m.client_id = ?
    `,

    getClientByCompId: `
        SELECT ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created
        FROM client c JOIN contact ct ON c.contact_id = ct.id 
        WHERE ct.firstName = ? and ct.lastName = ? and ct.phone = ?
    `,
    getClientByCompIdInternal: `
        SELECT c.contact_id, ct.firstName, ct.lastName, ct.phone, ct.email, c.stamp_created
        FROM client c JOIN contact ct ON c.contact_id = ct.id 
        WHERE ct.firstName = ? and ct.lastName = ? and ct.phone = ?
    `,

    getClientCard: `
      SELECT card_id FROM card WHERE client_id = ? LIMIT 1
    `,
};
