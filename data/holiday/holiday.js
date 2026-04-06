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
            const datetime = `${date} 00:00:00`;
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
