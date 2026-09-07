// Holiday domain module
const db = require('../../database');
const queries = require('./queries');

function normalizeRows(result) {
    if (Array.isArray(result) && result.length > 0) {
        if (Array.isArray(result[0])) {
            return result[0];
        }
    }
    return result;
}

async function getAllHolidays() {
    try {
        const rows = await db.query(queries.getAllHolidays);
        return normalizeRows(rows);
    } catch (error) {
        console.error('Get all holidays error:', error);
        throw error;
    }
}

async function getHolidaysByStatus() {
    try {
        const rows = await db.query(queries.getHolidaysByStatus);
        return normalizeRows(rows);
    } catch (error) {
        console.error('Get holidays by status error:', error);
        throw error;
    }
}

async function deactivateHoliday(date) {
    try {
        // Normalize input to DATETIME-ish string
        let dt = date;
        if (typeof dt === 'string') {
            dt = dt.trim().replace('T', ' ');
            if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) dt = `${dt} 00:00:00`;
            else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dt)) dt = `${dt}:00`;
        }
        // Use stored procedure only. Run it on a dedicated connection so
        // we can immediately check ROW_COUNT() on the same session.
        const connection = await db.getConnection();
        try {
            await connection.query(queries.deactivateHoliday, [dt]);

            const rcRows = await connection.query('SELECT ROW_COUNT() AS rc;');
            const rcNorm = normalizeRows(rcRows);
            let rc = 0;
            if (Array.isArray(rcNorm)) {
                if (rcNorm.length > 0 && rcNorm[0] && typeof rcNorm[0].rc !== 'undefined') rc = rcNorm[0].rc;
            } else if (rcNorm && typeof rcNorm.rc !== 'undefined') {
                rc = rcNorm.rc;
            }

            if (rc > 0) return { success: true };
            return { success: false, message: 'Няма намерени записи за деактивиране' };
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error('Deactivate holiday error:', error);
        throw error;
    }
}

async function addHoliday(holidays, description) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const item of holidays) {
            // item can be: { date: 'YYYY-MM-DD', time: 'HH:MM' }, a date string, or a Date instance
            let datetime;

            if (item instanceof Date) {
                const d = item;
                const pad = (n) => String(n).padStart(2, '0');
                datetime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            } else if (typeof item === 'object' && item !== null) {
                if (item.date && typeof item.date === 'string') {
                    const datePart = item.date;
                    const timePart = (item.time && typeof item.time === 'string') ? item.time : null;
                    if (timePart) {
                        // ensure seconds present
                        const timeWithSeconds = /^\d{2}:\d{2}$/.test(timePart) ? `${timePart}:00` : timePart;
                        datetime = `${datePart} ${timeWithSeconds}`;
                    } else if (item.year && item.month && item.day) {
                        const y = item.year;
                        const m = String(item.month).padStart(2, '0');
                        const da = String(item.day).padStart(2, '0');
                        datetime = `${y}-${m}-${da} 00:00:00`;
                    } else {
                        datetime = `${datePart} 00:00:00`;
                    }
                } else if (item.year && item.month && item.day) {
                    const y = item.year;
                    const m = String(item.month).padStart(2, '0');
                    const da = String(item.day).padStart(2, '0');
                    datetime = `${y}-${m}-${da} 00:00:00`;
                } else {
                    throw new Error(`Invalid date object: ${JSON.stringify(item)}`);
                }
            } else if (typeof item === 'string') {
                let s = item.trim();
                // convert ISO T separator to space
                if (s.includes('T')) s = s.replace('T', ' ');
                // if only date provided, add midnight
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    s = `${s} 00:00:00`;
                } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) {
                    s = `${s}:00`;
                }
                datetime = s;
            } else {
                throw new Error(`Unsupported date type: ${typeof item}`);
            }

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
    deactivateHoliday,
    addHoliday
};
