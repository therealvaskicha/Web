// Holiday domain - SQL queries

module.exports = {
    getAllHolidays: `
    call get_holidays();
    `,
    
    getHolidaysByStatus: `
    call get_all_holidays();
    `,
    
    deactivateHoliday: `
    call deactivate_holiday(?);
    `,
    
    insertHoliday: `
    call insert_holiday(?, ?);
    `,
};
