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
};
