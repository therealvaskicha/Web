module.exports = {
    insertMailingList: `
        INSERT INTO mailing_list (contact_id, date_subscribed) VALUES (?, ?)
    `,
    getMailingListEntry: `
      SELECT id, date_subscribed, date_unsubscribed FROM mailing_list WHERE contact_id = ? AND email = ?
    `,
    getClientMailingList: `SELECT m.date_subscribed, m.date_unsubscribed 
      FROM mailing_list m join contact ct on m.contact_id = ct.id
      WHERE ct.firstName = ? and ct.lastName = ? and ct.phone = ?
    `,
    insertMailingList: `
      INSERT INTO mailing_list (contact_id, date_subscribed) VALUES (?, ?)
    `,
    insertMailingListWithEmail: `
      INSERT IGNORE INTO mailing_list (contact_id, email, date_subscribed, client_id) VALUES (?, ?, ?, ?)
    `,
    updateMailingListSubscription: `
      UPDATE mailing_list SET date_subscribed = CURDATE(), date_unsubscribed = NULL, client_id = ? WHERE id = ?
    `,
    updateMailingListClientId: `
      UPDATE mailing_list SET client_id = ? WHERE id = ? AND client_id IS NULL
    `,
    updateMailingListClientId: `
      UPDATE mailing_list SET client_id = ? WHERE contact_id = ? AND client_id IS NULL
    `,
}