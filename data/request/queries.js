// Request domain - SQL queries

module.exports = {
    getPendingRequest: `
        SELECT r.id, r.product_id, r.contact_id, r.date, r.note, r.status, r.order_id, r.client_id,
               co.firstName, co.lastName, co.phone, co.email, p.name as booking_type, p.service_type
        FROM requestlog r
        JOIN contact co ON r.contact_id = co.id
        JOIN product p ON r.product_id = p.product_id
        WHERE co.firstName = ? AND co.lastName = ? AND DATE(r.date) = ? AND TIME(r.date) = ? AND p.name = ? 
        AND r.status IN (1, 10)
    `,
  
    updateRequestClientId: `
      UPDATE requestlog SET client_id = ? WHERE contact_id = ? AND client_id IS NULL
    `,
    insertRequestStatus: `
      INSERT INTO requestlog (order_id, contact_id, product_id, client_id, date, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    
    getRequestForCancellation: `
      SELECT r.id, r.order_id, r.product_id, r.contact_id, r.client_id, r.date, r.note, r.status, co.firstName, co.lastName, co.phone, co.email, p.name as booking_type
      FROM requestlog r
      JOIN contact co ON r.contact_id = co.id
      JOIN product p ON r.product_id = p.product_id
      WHERE co.firstName = ? AND co.lastName = ? AND DATE(r.date) = ? AND TIME(r.date) = ? AND p.name = ?
      ORDER BY r.stamp_created DESC LIMIT 1
    `,
    getPendingRequests: `
      SELECT co.firstName, co.lastName, DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, p.name as booking_type, r.note
        FROM requestlog r 
        JOIN product p ON r.product_id = p.product_id
        JOIN contact co ON r.contact_id = co.id
      WHERE r.date >= CURDATE()
      GROUP BY r.order_id
        HAVING 
          MAX(r.status NOT IN (1, 10)) = 0
          AND MIN(r.status IN (1, 10)) = 1;
    `,
    getPendingRequestsCalendar: `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
      FROM requestlog
      WHERE date >= curdate()
      GROUP BY order_id
        HAVING 
          MAX(status NOT IN (1, 10)) = 0
          AND MIN(status IN (1, 10)) = 1;
    `,
    getRequestByCompositeKey: `
      SELECT r.id, r.order_id, r.product_id, r.contact_id, r.client_id, r.date, r.note, r.status, co.firstName, co.lastName, co.phone, co.email, p.name as booking_type
        FROM requestlog r
          JOIN contact co ON r.contact_id = co.id
          JOIN product p ON r.product_id = p.product_id
        WHERE co.firstName = ? AND co.lastName = ? AND DATE(r.date) = ? AND TIME(r.date) = ? AND p.name = ? AND r.status IN (1, 10)
      LIMIT 1
    `,
    getApprovedRequestsCalendar: `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
      from requestlog
      WHERE date >= curdate()
      GROUP BY order_id
        HAVING 
          MAX(status NOT IN (2, 3)) = 0
          AND MIN(status IN (1, 10)) = 1;
    `,
    getApprovedRequests: `
      SELECT DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, p.name as booking_type, co.firstName, co.lastName, r.note
      from product p 
        right join requestlog r on p.product_id = r.product_id 
        left join contact co on r.contact_id = co.id
      WHERE r.date >= curdate()
      GROUP BY r.order_id
        HAVING 
          MAX(r.status NOT IN (2 ,3)) = 0
          AND MIN(r.status NOT IN (2, 3)) = 1;
    `,

    getRequestHistory: `
      WITH latest_requests AS (
          SELECT 
              r.*,
              ROW_NUMBER() OVER (PARTITION BY r.order_id 
                                 ORDER BY r.stamp_created DESC, r.id DESC) AS rn
          FROM requestlog r
      )
      SELECT 
          DATE_FORMAT(l.date, '%Y-%m-%d') AS date,
          DATE_FORMAT(l.date, '%H:%i') AS time,
          co.firstName,
          co.lastName,
          p.name AS booking_type,
          DATE_FORMAT(l.stamp_created, '%Y-%m-%d %H:%i') AS stamp_created,
          l.status
      FROM latest_requests l
      JOIN contact co ON l.contact_id = co.id
      JOIN product p ON l.product_id = p.product_id
      WHERE l.rn = 1
      ORDER BY l.id DESC;
    `,
    checkSlotAvailable: `
      SELECT * FROM requestlog WHERE DATE(date) = ? AND TIME(date) = ? AND status IN (2, 3)
    `,
    checkDuplicateBooking: `
      SELECT id FROM requestlog WHERE contact_id = ? AND DATE(date) = ? AND status IN (1, 2, 3)
    `,
    getScheduledRequests: `
      SELECT order_id, contact_id, product_id, client_id, date 
      FROM requestlog
      WHERE date <= ? AND date > ? AND status = 2
      LIMIT 100
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
    getClientCards: `
      SELECT card_id, status, stamp_created FROM card
      WHERE client_id = ?
    `,

    checkExistingCard: `
      SELECT card_id FROM card WHERE client_id = ? LIMIT 1
    `,

    getNextCardId: `
      SELECT get_next_card_id() as next_id
    `,
    insertCard: `
      INSERT INTO card (card_id, client_id, status) VALUES (?, ?, 19)
    `,

    getDuplicateSubscription: `
      SELECT id FROM subscription WHERE card_id = ? AND product_id = ? AND start_date = ? LIMIT 1
    `,

    insertSubscription: `
      INSERT INTO subscription (product_id, card_id, start_date, expiration_date, status) VALUES (?, ?, ?, ?, 10)
    `,
};
