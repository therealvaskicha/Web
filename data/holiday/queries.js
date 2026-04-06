// Holiday domain - SQL queries

module.exports = {
    getAllHolidays: `
        SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time, description 
        FROM holidays WHERE is_active = 1 and date >= curdate() ORDER BY date, time DESC
    `,
    
    getHolidaysByStatus: `
        SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time 
        FROM holidays WHERE is_active = 1
    `,
    
    deactivatePastHolidays: `
        UPDATE holidays SET is_active = 0 WHERE date < NOW() AND is_active = 1
    `,
    
    deactivateHoliday: `
        UPDATE holidays SET is_active = 0 WHERE DATE(date) = ?
    `,
    
    insertHoliday: `
        INSERT INTO holidays (date, description, is_active) VALUES (?, ?, 1)
    `,
    getHolidays: `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time, description FROM holidays WHERE is_active = 1 AND date >= curdate() ORDER BY date,time DESC
    `,
    getHolidaysCalendar: `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(date, '%H:%i') as time FROM holidays WHERE is_active = 1
    `,
    deactivateHoliday: `
      UPDATE holidays SET is_active = 0 WHERE date = ?
    `,
    insertHoliday: `
      INSERT INTO holidays (date, description) VALUES (?, ?)
    `,
};
