module.exports = {
client: {
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
    checkExistingClient: `
      SELECT c.client_id, ct.firstName, ct.lastName, ct.phone, ct.email
      FROM client c JOIN contact ct ON c.contact_id = ct.id 
      WHERE ct.firstName = ? AND ct.lastName = ? AND ct.phone = ?
      LIMIT 1
    `,
    getClientByContactId: `
      SELECT client_id FROM client WHERE contact_id = ? LIMIT 1
    `,
    insertClient: `
      INSERT INTO client (contact_id, client_id) VALUES (?, ?)
    `,
    getNextClientId: `
      SELECT get_next_client_id() as next_id
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
    getClientMailingList: `
      SELECT email, date_subscribed, date_unsubscribed
      FROM mailing_list
      WHERE client_id = ?
    `,
    getClientCards: `
      SELECT card_id, status, stamp_created FROM card
      WHERE client_id = ?
    `,
  }
};
