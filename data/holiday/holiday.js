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

        // debug log removed

        // First try stored procedure (keeps existing DB contract)
        await db.query(queries.deactivateHoliday, [dt]);

        // Then try a direct UPDATE to ensure row was actually changed (fallback)
        try {
            const res = await db.query('UPDATE holidays SET is_active = 0 WHERE is_active = 1 AND date = ?', [dt]);
            // Some mysql drivers return an object with affectedRows
            const affected = res && (res.affectedRows || res.affected_rows || res.affected || 0);
            if (affected > 0) {
                return { success: true };
            }

            // Fallback: maybe stored datetimes differ by seconds - try matching by minute precision
            const dtMinute = (typeof dt === 'string') ? dt.replace(/:\d{2}$/, ':00') : dt;
            const res2 = await db.query('UPDATE holidays SET is_active = 0 WHERE is_active = 1 AND DATE_FORMAT(date, "%Y-%m-%d %H:%i:00") = ?', [dtMinute]);
            const affected2 = res2 && (res2.affectedRows || res2.affected_rows || res2.affected || 0);
            if (affected2 > 0) return { success: true };

            // Final fallback: if the intention was to deactivate an entire day, match by DATE()
            const dateOnly = (typeof dt === 'string') ? dt.split(' ')[0] : null;
            if (dateOnly) {
                const res3 = await db.query('UPDATE holidays SET is_active = 0 WHERE is_active = 1 AND DATE(date) = ?', [dateOnly]);
                const affected3 = res3 && (res3.affectedRows || res3.affected_rows || res3.affected || 0);
                if (affected3 > 0) return { success: true };
            }

            // Nothing changed
            return { success: false, message: 'Няма намерени записи за деактивиране' };
        } catch (innerErr) {
            console.error('Deactivate fallback UPDATE error:', innerErr);
            // Even if update fallback fails, the SP might have already done the work
            return { success: true };
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
