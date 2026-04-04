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

async function deactivatePastHolidays(req, res) {
    try {
        await holidayDomain.deactivatePastHolidays();
        res.json({ message: 'Миналите празници са деактивирани' });
    } catch (err) {
        console.error('Deactivate past holidays controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function deactivateHoliday(req, res) {
    try {
        const { date } = req.body;
        
        if (!date) {
            return res.status(400).json({ error: 'Дата е задължителна' });
        }
        
        await holidayDomain.deactivateHoliday(date);
        res.json({ message: 'Празник е деактивиран' });
    } catch (err) {
        console.error('Deactivate holiday controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function addHoliday(req, res) {
    try {
        const { holidays, description } = req.body;
        
        if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
            return res.status(400).json({ error: 'Валидна дата е задължителна' });
        }
        
        await holidayDomain.addHoliday(holidays, description);
        res.json({ message: 'Празници са добавени' });
    } catch (err) {
        console.error('Add holiday controller error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getHolidaysForCalendar,
    getAllHolidays,
    deactivatePastHolidays,
    deactivateHoliday,
    addHoliday
};
