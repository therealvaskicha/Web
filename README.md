# Web Project Overview - Pilates Booking System

## Project Summary
A full-stack web application for managing pilates studio bookings, clients, and subscriptions. The system provides:
- **Client-facing**: Booking interface for pilates classes
- **Admin panel**: Complete management dashboard for bookings, clients, and subscriptions
- **Authentication**: Secure login system with session management (15-minute timeout in production)

**Deployment**: Vercel (https://pilates-website-dilona.vercel.app/)
**Repository**: therealvaskicha/Web (main branch)

---

## Tech Stack

### Backend
- **Framework**: Express.js 5.1.0
- **Database**: SQLite3
- **Session Management**: express-session (15-minute idle timeout in production)
- **Authentication**: Simple username/password with session cookies

### Frontend
- **HTML/CSS/JavaScript**: Vanilla (no framework)
- **Styling**: Custom CSS (admin.css, styles.css)
- **Calendar**: FullCalendar 6.1.18
- **Architecture**: Class-based controllers (ModalController, PaginationController, etc.)

### Dependencies
```json
{
  "@fullcalendar/core": "^6.1.18",
  "@fullcalendar/daygrid": "^6.1.18",
  "@fullcalendar/timegrid": "^6.1.18",
  "express": "^5.1.0",
  "express-session": "^1.18.2",
  "sqlite3": "^5.1.7"
}
```

---

## Project Structure

```
Web/
├── app.js                    # Express backend, API endpoints
├── database.js              # SQLite database setup
├── package.json             # Dependencies
├── public/                  # Frontend assets
│   ├── index.html          # Public landing page
│   ├── login.html          # Admin login page
│   ├── admin.html          # Admin dashboard (bookings)
│   ├── clients.html        # Clients management
│   ├── subscriptions.html  # Subscriptions management
│   ├── script.js           # Client-side booking logic
│   ├── login.js            # Login form with CAPTCHA
│   ├── admin.js            # Admin panel main logic (1382 lines)
│   ├── styles.css          # Public page styles
│   ├── admin.css           # Admin panel styles
│   ├── constants.js        # Shared constants
│   ├── modules/            # Modular components
│   │   ├── admin-bookings.js
│   │   ├── admin-calendar.js
│   │   ├── clients-history.js
│   │   └── clients-info.js
│   └── Images/             # Logo, icons, photos
│       ├── interior1.jfif
│       ├── interior2.jfif
│       ├── interior3.jfif
│       ├── interior4.jfif
│       ├── loni.jfif
│       └── text.jfif
└── .vercel/               # Vercel configuration
```

---

## Key Features

### 1. Client Booking System
- Browse available time slots
- Make pilates class bookings
- View booking history
- Subscribe to services
- Email notifications

### 2. Admin Dashboard (Protected)

#### 2.1 Bookings Management
- **Pending Bookings**: Review and approve/reject new booking requests
- **Approved Bookings**: View upcoming confirmed sessions
- **Booking History**: Full history of all bookings (past and present)
- **Table Columns**: Client | Date & Time | Type & Notes | Action
  - Combined "Type" + "Notes" column for space efficiency
  - Shows booking type (e.g., "Solo") and optional note on separate lines
  - E.g., "Solo\nFirst training"

#### 2.2 Calendar Management
- Weekly calendar view (Mon-Sun, 8:00-20:00)
- Mark available/unavailable slots
- Add holidays and blocked periods
- Drag-to-select time slots for bulk actions

#### 2.3 Clients Management
- Full client database
- View client details (phone, email, subscription info)
- View client booking history
- Top 3 clients visualization
- Client filtering and search

#### 2.4 Subscriptions Management
- Manage client subscriptions
- Track subscription types and validity
- Subscription status overview
- Renewal and expiry management

#### 2.5 Logout Function
- 15-minute session timeout
- Manual logout button on all admin pages
- Redirects to login after logout

---

## API Endpoints

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/login` | User login (returns session) |
| POST | `/api/logout` | User logout (destroys session) |
| GET | `/admin.html` | Admin dashboard (protected) |
| GET | `/clients.html` | Clients page (protected) |
| GET | `/subscriptions.html` | Subscriptions page (protected) |

### Bookings
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/pending` | Get pending booking requests |
| POST | `/api/approve` | Approve/reject booking (id, status) |
| POST | `/api/book` | Create new booking |
| GET | `/api/bookings-approved` | Get confirmed bookings |
| GET | `/api/bookings-history` | Get all bookings history |
| GET | `/api/bookings-history-approved` | Get approved bookings history |
| GET | `/api/unavailable-slots` | Get unavailable time slots |

### Holidays
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/holidays` | Get all holidays |
| GET | `/api/holidays-current` | Get active holidays |
| POST | `/api/add-holiday` | Add holiday period |
| POST | `/api/delete-holiday` | Delete holiday |
| POST | `/api/auto-deactivate-past-holidays` | Auto-deactivate old holidays |

### Clients & Subscriptions
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/clients` | Get all clients |
| GET | `/api/client/:id` | Get client details |
| POST | `/api/update-subscriptions` | Update subscription info |

---

## Security Features

✅ **Implemented**
- Session-based authentication with 15-minute idle timeout
- Protected admin pages (requireAuth middleware)
- CAPTCHA on login form
- HTTP-only cookies in production
- Secure cookies (HTTPS on Vercel)
- Development mode skips auth for testing

⚠️ **Considerations**
- Password stored as plain text (consider hashing with bcrypt)
- Secret stored in code (move to env variables)
- No CSRF protection (add csrf tokens)
- No rate limiting on login attempts
- No account lockout after failed attempts

---

## Recent Changes (Session)

### Fixed
✅ Admin page login restriction - Now requires authentication to access
✅ Logout functionality - Added logout button to all admin pages
✅ Session persistence - Sessions last 15 minutes (was expiring too quickly)
✅ Logout error - Fixed `weekStart is not defined` ReferenceError
✅ Table layout - Combined "Тип" and "Бележка" columns for space efficiency
✅ Development mode - localhost testing bypasses login

### Improved
- Session configuration for production HTTPS
- Calendar refresh after booking approval/cancellation

---

## Classes & Controllers (admin.js)

### APIService
✅ Centralized API call handler with error handling

### ModalController
Manages modal dialogs:
- Constructor: `(modalId, triggerId, closeId)`
- Methods: `open()`, `close()`, `isOpen()`, `onSubmit(callback)`

### PaginationController
Table pagination management:
- Constructor: `(tableId, paginationContainerId, recordsPerPage)`
- Handles page rendering and navigation

### TableFilterController
Placeholder for filter logic (expandable)

### CalendarController
Placeholder for calendar rendering (expandable)

---

## Security Implementation Details

### Environment Variables (.env file)
Create a `.env` file in the project root (use `.env.example` as template):
```
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt-hashed-password>
SESSION_SECRET=<your-strong-secret>
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW_MS=900000
ACCOUNT_LOCKOUT_DURATION_MS=1800000
```

### Generating Admin Password Hash
```bash
# Install bcrypt-cli or use bcrypt-generator online
# https://bcrypt-generator.com/
# Generate hash for your password and add to .env
```

### Login Security Features
- **Rate Limiting**: Max 5 failed attempts per 15 minutes per IP
- **Account Lockout**: 30-minute lockout after exceeding max attempts
- **Login Tracking**: DB table logs all login attempts (success/failure, IP, timestamp)
- **CSRF Protection**: Tokens validated on login and form submissions
- **Session Security**: HttpOnly, SameSite=strict cookies

## Known Issues & TODOs

### Medium Priority
- [ ] Add email notifications for bookings
- [ ] Multi-language support (currently Bulgarian/English)
- [ ] Data export functionality (CSV/PDF)
- [ ] Email reminders before bookings
- [ ] SMS notifications option
- [ ] Mobile app or responsive improvements
- [ ] Analytics dashboard
- [ ] Add dbstate table to track major table versions

### Low Priority
- [ ] Performance optimization (lazy loading, caching)
- [ ] Add booking cancellation by clients
- [ ] Subscription renewal reminders
- [ ] Client waitlist for fully booked slots
- [ ] Dynamic pricing by slot

### Technical Debt
- [ ] Refactor admin.js (1382 lines - too large)
- [ ] Extract modules from main admin.js into separate files
- [ ] Add unit tests
- [ ] Add API documentation
- [ ] Improve CSS organization (consolidate admin.css & styles.css)
- [ ] Add input validation and sanitization
- [ ] Replace custom class system with modern patterns

---

## Current Functionality Checklist

### Admin Panel
- [x] Login page with CAPTCHA
- [x] Pending bookings approval/rejection
- [x] Approved bookings management
- [x] Booking history view
- [x] Weekly calendar with drag-select
- [x] Holiday/unavailable period management
- [x] Client database view
- [x] Client details and history
- [x] Subscription management
- [x] Logout functionality
- [x] Session timeout (15 minutes)
- [x] Development mode bypass

### Client Pages
- [x] Home/landing page
- [x] Booking interface
- [x] Booking history
- [x] Email subscription management

### Security
- [x] Admin page protection
- [x] Session management
- [x] Login CAPTCHA
- [x] Secure cookies (production)
- [x] Password hashing (bcrypt)
- [x] Environment variables for secrets
- [x] CSRF protection
- [x] Rate limiting on login
- [x] Account lockout after failed attempts
- [x] Login attempt tracking

---

## Deployment & Testing

### Development
```bash
npm install
npm start
# Runs on localhost:3000
# Login bypassed in development
```

### Production (Vercel)
```
NODE_ENV=production
Auth enabled: Full login required
HTTPS: Enabled
Session timeout: 15 minutes
```

**Live URL**: https://pilates-website-dilona.vercel.app/
**Admin URL**: https://pilates-website-dilona.vercel.app/admin.html

---

## Next Steps / Recommendations

1. **Security First**
   - Move credentials to `.env` file
   - Implement password hashing
   - Add rate limiting

2. **Code Quality**
   - Extract admin.js into modules
   - Add validation on all inputs
   - Add error boundaries

3. **Features**
   - Email confirmation for bookings
   - Client self-cancellation
   - Automated reminders

4. **Scaling**
   - Database migration from SQLite to PostgreSQL
   - Add caching layer
   - Performance monitoring

---

## File Sizes & Line Counts
- **admin.js**: ~1382 lines (main admin panel logic)
- **app.js**: ~590 lines (backend API & routes)
- **admin.css**: Custom styling for admin panel
- **styles.css**: Public page styling

---

## Contact & Links
- **Repository**: https://github.com/therealvaskicha/Web
- **Live Site**: https://pilates-website-dilona.vercel.app/
- **Portfolio**: https://www.vasilapostolov.tech/

---

*Last Updated: February 25, 2026*
