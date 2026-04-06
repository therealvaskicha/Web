// Subscription domain - SQL queries

module.exports = {
    getSubscriptionDetails: `
        SELECT s.id, s.card_id, s.product_id, s.status, c.client_id
        FROM subscription s
        JOIN card c ON s.card_id = c.card_id
        WHERE s.id = ?
    `,
    
    getRelatedRequestlog: `
        SELECT r.order_id, r.contact_id, r.product_id, r.client_id, r.date 
        FROM requestlog r
        WHERE r.contact_id = ? AND r.product_id = ? AND DATE(r.date) = ?
        ORDER BY r.stamp_created DESC LIMIT 1
    `,
    
    updateCardStatus: `
        UPDATE card SET status = ? WHERE card_id = ?
    `,
    
    updateSubscriptionStatus: `
        INSERT INTO subscription (product_id, card_id, start_date, expiration_date, status)
        SELECT product_id, card_id, start_date, expiration_date, ? 
        FROM subscription WHERE id = ?
    `,
    
    updateRequestStatus: `
        INSERT INTO requestlog (order_id, contact_id, product_id, client_id, date, status)
        SELECT order_id, contact_id, product_id, client_id, date, ?
        FROM requestlog WHERE order_id = ?
    `,
    getProductServiceType: `
      SELECT p.service_type FROM product p WHERE p.product_id = ?
    `,
    checkDuplicateSubscription: `
      SELECT id FROM subscription WHERE card_id = ? AND product_id = ? AND start_date = ? LIMIT 1
    `,
    insertSubscription: `
      INSERT INTO subscription (product_id, card_id, start_date, expiration_date, status) VALUES (?, ?, ?, ?, 10)
    `,
    updateSubscriptionStatus: `
      UPDATE subscription SET status = ? WHERE id = ?
    `,
    syncSubscriptionStatus: `
      UPDATE subscription SET status = CASE WHEN CURDATE() <= expiration_date THEN 15 WHEN CURDATE() > expiration_date THEN 17 ELSE 9 END
    `,
    
};
