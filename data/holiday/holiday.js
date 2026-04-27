// Holiday domain module
const db = require('../../database');
const queries = require('./queries');

async function getAllHolidays() {
    try {
        const rows = await db.query(queries.getAllHolidays);
        return rows;
    } catch (error) {
        console.error('Get all holidays error:', error);
        throw error;
    }
}

async function getHolidaysByStatus() {
    try {
        const rows = await db.query(queries.getHolidaysByStatus);
        return rows;
    } catch (error) {
        console.error('Get holidays by status error:', error);
        throw error;
    }
}

async function deactivatePastHolidays() {
    try {
        await db.query(queries.deactivatePastHolidays);
        return { success: true };
    } catch (error) {
        console.error('Deactivate past holidays error:', error);
        throw error;
    }
}

async function deactivateHoliday(date) {
    try {
        await db.query(queries.deactivateHoliday, [date]);
        return { success: true };
    } catch (error) {
        console.error('Deactivate holiday error:', error);
        throw error;
    }
}

async function addHoliday(holidays, description) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const date of holidays) {
            // Handle different date formats
            let dateString;
            
            if (date instanceof Date) {
                dateString = date.toISOString().split('T')[0];
            } else if (typeof date === 'object' && date !== null) {
                if (date.date && typeof date.date === 'string') {
                    dateString = date.date;
                } else if (date.year && date.month && date.day) {
                    dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                } else {
                    throw new Error(`Invalid date object: ${JSON.stringify(date)}`);
                }
            } else if (typeof date === 'string') {
                dateString = date;
            } else {
                throw new Error(`Unsupported date type: ${typeof date}`);
            }
            
            const datetime = `${dateString} 00:00:00`;
            await connection.query(queries.insertHoliday, [datetime, description]);
        }

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error('Add holiday error:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

module.exports = {
    getAllHolidays,
    getHolidaysByStatus,
    deactivatePastHolidays,
    deactivateHoliday,
    addHoliday
};
