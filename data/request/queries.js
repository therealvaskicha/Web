// Request domain - SQL queries

module.exports = {
    getPendingRequest: `
        SELECT r.id, r.product_id, r.contact_id, r.date, r.note, r.status, r.order_id,
               co.firstName, co.lastName, co.phone, co.email, p.name as booking_type, p.service_type
        FROM requestlog r
        JOIN contact co ON r.contact_id = co.id
        JOIN product p ON r.product_id = p.product_id
        WHERE co.firstName = ? AND co.lastName = ? AND DATE(r.date) = ? AND TIME(r.date) = ? AND p.name = ? 
        AND r.status IN (1, 10)
    `,
    
    getExistingClient: `
        SELECT c.client_id, ct.firstName, ct.lastName, ct.phone, ct.email
        FROM client c 
        JOIN contact ct ON c.contact_id = ct.id 
        WHERE ct.firstName = ? AND ct.lastName = ? AND ct.phone = ?
        LIMIT 1
    `,
    
    insertClient: `
        INSERT INTO client (contact_id, client_id) VALUES (?, ?)
    `,
    
    getNextClientId: `
        SELECT get_next_client_id() as next_id
    `,
    
    getExistingCard: `
        SELECT card_id FROM card WHERE client_id = ?
    `,
    
    getNextCardId: `
        SELECT get_next_card_id() as next_id
    `,
    
    insertCard: `
        INSERT INTO card (client_id, status) VALUES (?, 19)
    `,
    
    insertSubscription: `
        INSERT INTO subscription (product_id, card_id, start_date, expiration_date, status) 
        VALUES (?, ?, ?, ?, 10)
    `,
    
    getDuplicateSubscription: `
        SELECT id FROM subscription 
        WHERE card_id = ? AND product_id = ? AND start_date = ? 
        AND status IN (10, 15)
    `,
    
    checkExistingCard: `
        SELECT card_id FROM card WHERE client_id = ?
    `,
    
    getServiceByProductId: `
        SELECT product_id, name FROM product WHERE product_id = ? LIMIT 1
    `,
    updateRequestClientId: `
      UPDATE requestlog SET client_id = ? WHERE contact_id = ? AND client_id IS NULL
    `,
    updateRequestStatus: `
      
    `,
    insertRequest: `
      INSERT INTO requestlog (order_id, contact_id, product_id, client_id, date, status, note) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
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
      SELECT p.name as 'booking_type', DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, r.note, c.firstName, c.lastName
      FROM contact c 
          left join requestlog r on c.id = r.contact_id 
          right join product p on p.product_id = r.product_id
      WHERE r.status in (1,10) and r.date >= curdate() ORDER BY r.date ASC
    `,
    getPendingRequestsCalendar: `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
      FROM requestlog
      WHERE status in (1,10) and date >= curdate()
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
      WHERE status = 2 AND date >= curdate()
    `,
    getApprovedRequests: `
      SELECT DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, p.name as booking_type, co.firstName, co.lastName, r.note
      from product p 
      right join requestlog r on p.product_id = r.product_id 
      left join contact co on r.contact_id = co.id
      WHERE r.status = 2 AND r.date >= curdate()
    `,
    getCompletedBookingsCalendar: `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time
      from booking
      WHERE date <= curdate()
    `,
    getRequestHistory: `
      SELECT DATE_FORMAT(r.date, '%Y-%m-%d') as date, DATE_FORMAT(r.date, '%H:%i') as time, co.firstName, co.lastName, p.name as booking_type, DATE_FORMAT(r.stamp_created, '%Y-%m-%d %H:%i') as stamp_created, r.status
      FROM requestlog r 
          join contact co on r.contact_id=co.id 
          join product p on r.product_id=p.product_id
      ORDER BY r.id DESC
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
};
