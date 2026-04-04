module.exports = {
    getClientCard: `
      SELECT card_id FROM card WHERE client_id = ? LIMIT 1
    `,
    getNextCardId: `
      SELECT get_next_card_id() as next_id
    `,
    insertCard: `
      INSERT INTO card (card_id, client_id, status) VALUES (?, ?, 19)
    `,
    updateCardStatus: `
      UPDATE card SET status = ? WHERE card_id = ?
    `,
    getClientCardInfo: `
    SELECT ca.card_id, p.name as 'booking_type', NULL as credits_balance, s.start_date, s.expiration_date, s.status as subscription_status, s.stamp_created 
    FROM card ca JOIN subscription s ON ca.card_id = s.card_id 
    JOIN product p ON s.product_id = p.product_id 
    WHERE ca.client_id = ?
    `,
};