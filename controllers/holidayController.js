// Holiday Controller - thin layer for HTTP concerns
const holidayDomain = require('../data/holiday/holiday');

async function getHolidaysForCalendar(req, res) {
    try {
        const holidays = await holidayDomain.getHolidaysByStatus();
        res.json(holidays);
    } catch (err) {
        console.error('Get holidays (calendar) controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getAllHolidays(req, res) {
    try {
        const holidays = await holidayDomain.getAllHolidays();
        res.json(holidays);
    } catch (err) {
        console.error('Get all holidays controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function deactivateHoliday(req, res) {
    try {
        const { date, times } = req.body;

        if (!date) {
            return res.status(400).json({ error: 'Датата е задължителна' });
        }

        // If times array provided, call the domain deactivateHoliday for each datetime
        if (times && Array.isArray(times) && times.length > 0) {
            let anySuccess = false;
            let lastMessage = null;
            for (const t of times) {
                try {
                    // normalize time (HH:MM or HH:MM:SS)
                    let timePart = t || '00:00:00';
                    if (/^\d{2}:\d{2}$/.test(timePart)) timePart = `${timePart}:00`;
                    const dt = `${date} ${timePart}`;
                    const r = await holidayDomain.deactivateHoliday(dt);
                    if (r && r.success) anySuccess = true;
                    else if (r && r.message) lastMessage = r.message;
                } catch (e) {
                    console.error('Deactivate single slot error:', e);
                }
            }

            if (anySuccess) return res.json({ message: 'Празникът е премахнат' });
            return res.status(404).json({ error: lastMessage || 'Празникът не е намерен' });
        }

        // Otherwise treat date as full-day or single datetime
        const result = await holidayDomain.deactivateHoliday(date);
        if (result && result.success) {
            res.json({ message: 'Празникът е премахнат' });
        } else {
            res.status(404).json({ error: result && result.message ? result.message : 'Празникът не е намерен' });
        }
    } catch (err) {
        console.error('Deactivate holiday controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function addHoliday(req, res) {
    try {
        const { holidays, description } = req.body;
        
        if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
            return res.status(400).json({ error: 'Невалидна дата.' });
        }
        
        await holidayDomain.addHoliday(holidays, description);
        res.json({ message: 'Добавена почивка.' });
    } catch (err) {
        console.error('Add holiday controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getHolidaysForCalendar,
    getAllHolidays,
    deactivateHoliday,
    addHoliday
};
