module.exports = {
contact: {
    insertContact: `
      INSERT INTO contact (firstName, lastName, phone, email) VALUES (?, ?, ?, ?)
    `,
    getContactByDetails: `
      SELECT id FROM contact WHERE firstName = ? AND lastName = ? AND phone = ?
    `,
    getContactByPhone: `
      SELECT id, firstName, lastName FROM contact WHERE phone = ?
    `,
    getContactEmail: `
      SELECT email FROM contact WHERE id = ?
    `,
    updateContactEmail: `
      UPDATE contact SET email = ? WHERE id = ?
    `,
    getContactEmail: `
      SELECT email FROM contact WHERE id = ?
    `,
  }
};