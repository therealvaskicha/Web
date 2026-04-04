/**
 * HYBRID 3-LAYER ARCHITECTURE EXAMPLE
 * 
 * Layer 1: Routes (app.js)
 *   - Only HTTP routing
 *   - Delegates to controllers
 * 
 * Layer 2: Controllers 
 *   - Request validation
 *   - Response formatting
 *   - Error handling
 *   - Calls domain modules
 * 
 * Layer 3: Domain Modules (data/)
 *   - Business logic
 *   - Database queries
 *   - Reusable across endpoints
 */

const express = require('express');
const path = require('path');
const db = require('./database');
require('dotenv').config();

// ========================================
// CONTROLLERS LAYER - Import here
// ========================================
const bookingController = require('./controllers/bookingController');
const requestController = require('./controllers/requestController');
const holidayController = require('./controllers/holidayController');
const clientController = require('./controllers/clientController');
const subscriptionController = require('./controllers/subscriptionController');

const app = express();

// Middleware
app.use(express.json());

// ========================================
// ROUTES LAYER - Only HTTP routing
// ========================================

/**
 * BOOKING ROUTES
 */
app.post('/api/book', (req, res) => bookingController.createBooking(req, res));

/**
 * REQUEST APPROVAL ROUTES
 */
app.post('/api/approve', (req, res) => requestController.approveRequest(req, res));
app.post('/api/reject', (req, res) => requestController.rejectRequest(req, res));
app.post('/api/cancel', (req, res) => requestController.cancelRequest(req, res));

/**
 * HOLIDAY ROUTES
 */
app.get('/api/c-holidays', (req, res) => holidayController.getHolidaysForCalendar(req, res));
app.get('/api/holidays', (req, res) => holidayController.getAllHolidays(req, res));
app.post('/api/auto-deactivate-past-holidays', (req, res) => holidayController.deactivatePastHolidays(req, res));
app.post('/api/disable-holiday', (req, res) => holidayController.deactivateHoliday(req, res));
app.post('/api/add-holiday', (req, res) => holidayController.addHoliday(req, res));

/**
 * CLIENT ROUTES
 */
app.get('/api/clients', (req, res) => clientController.getAllClients(req, res));
app.get('/api/client/:id', (req, res) => clientController.getClientById(req, res));
app.get('/api/client/:id/mailing-list', (req, res) => clientController.getClientMailingList(req, res));
app.get('/api/client/:id/cards', (req, res) => clientController.getClientCards(req, res));

/**
 * SUBSCRIPTION ROUTES
 */
app.post('/api/approve-subscription-payment', (req, res) => subscriptionController.approveSubscriptionPayment(req, res));

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
