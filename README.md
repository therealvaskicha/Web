# Web Project Overview - CooleRM Pilates CRM

## Project Summary
A full-stack CRM application for managing pilates studio operations including bookings, clients, subscriptions, and mailing lists. The system provides:
- **Client-facing**: Booking interface for pilates classes with email subscription management
- **Admin panel**: Complete management dashboard for bookings, clients, subscriptions, and holidays
- **Authentication**: Secure login system with session management, bcrypt hashing, rate limiting, and account lockout
- **Architecture**: Domain-driven 3-layer design (Routes → Controllers → Domain Modules) for scalability and team collaboration

**Deployment**: Vercel (https://pilates-website-dilona.vercel.app/)
**Repository**: therealvaskicha/Web (main branch)

---

## Tech Stack

### Backend
- **Framework**: Express.js 5.1.0
- **Database**: MySQL/MariaDB with connection pooling (mysql2/promise)
- **Authentication**: bcrypt password hashing, session management (15-minute timeout)
- **Rate Limiting**: express-rate-limit (login & general API endpoints)
- **CSRF Protection**: csurf middleware
- **Architecture**: Domain-driven 3-layer pattern (Routes → Controllers → Domain → Queries)

### Frontend
- **HTML/CSS/JavaScript**: Vanilla (no framework)
- **Styling**: Custom CSS (admin.css, styles.css)
- **Calendar**: FullCalendar 6.1.18
- **Architecture**: Class-based controllers (ModalController, PaginationController, etc.)

### Dependencies
```json
{
  "bcrypt": "^5.1.0",
  "cookie-parser": "^1.4.6",
  "csurf": "^1.11.0",
  "express": "^5.1.0",
  "express-rate-limit": "^6.7.0",
  "express-session": "^1.17.3",
  "mysql2": "^3.6.0",
  "dotenv": "^16.0.3"
}
```

---

## Project Structure

```
Web/
├── app.js                      # Express backend, API routes (clean routes only)
├── database.js                 # MySQL connection pool setup
├── package.json                # Dependencies
├── controllers/                # HTTP layer - validation & response formatting
│   ├── bookingController.js
│   ├── requestController.js
│   ├── clientController.js
│   ├── holidayController.js
│   ├── subscriptionController.js
│   ├── viewController.js
│   └── ...
├── data/                       # Domain modules - business logic & SQL queries
│   ├── auth/
│   │   ├── auth.js
│   │   └── queries.js
│   ├── booking/
│   │   ├── booking.js
│   │   └── queries.js
│   ├── client/
│   │   ├── client.js           # NEWLY REFACTORED: Composite key lookups
│   │   └── queries.js
│   ├── request/
│   │   ├── request.js
│   │   └── queries.js
│   ├── subscription/
│   │   ├── subscription.js
│   │   └── queries.js
│   ├── holiday/
│   │   ├── holiday.js
│   │   └── queries.js
│   ├── view/
│   │   ├── view.js
│   │   └── queries.js
│   └── ...
├── public/                     # Frontend assets
│   ├── index.html              # Public landing page
│   ├── login.html              # Admin login page
│   ├── admin.html              # Admin dashboard (requests/bookings)
│   ├── clients.html            # Clients management view
│   ├── subscriptions.html      # Subscriptions management
│   ├── script.js               # Client-side booking logic
│   ├── login.js                # Login security (bcrypt verification)
│   ├── admin.js                # Admin panel main logic
│   ├── styles.css              # Public styles
│   ├── admin.css               # Admin panel styles
│   ├── constants.js            # Shared constants
│   └── Images/                 # Assets
└── .vercel/                    # Vercel configuration
```

---

## Architecture Pattern: Domain-Driven 3-Layer Design

### Layer 1: Routes (app.js)
- Pure HTTP routing only
- Delegates to controllers
- Example: `app.get('/api/clients', (req, res) => clientController.getAllClients(req, res));`

### Layer 2: Controllers (controllers/*)
- HTTP request validation
- Parameter extraction
- Response formatting
- Delegates to domain layer
- Example: Validates `firstName`, `lastName`, `phone` parameters before calling domain

### Layer 3: Domain Modules (data/[domain]/*)
- Business logic implementation
- Database queries via queries.js
- Transaction handling
- Complex workflows (e.g., approveRequest creates client, card, subscription in one flow)

### Query Organization (data/[domain]/queries.js)
- All SQL prepared statements centralized
- One file per domain
- Security: Parameterized queries prevent SQL injection
- Example: All `client.*` queries in `data/client/queries.js`

---

## Key Features

### 1. Client Booking System
- Browse available time slots (with automatic unavailable slot detection)
- Make pilates class bookings with automatic duplicate prevention
- View booking history
- Subscribe to mailing list with smart subscription logic
- Email subscription management (subscribe/resubscribe/unsubscribe)

### 2. Admin Dashboard (Protected)

#### 2.1 Request Management (Bookings)
- **Pending Requests**: Review and approve/reject booking requests (status 1 & 10)
- **Approved Requests**: View confirmed upcoming sessions (status 2)
- **Completed Bookings**: View past sessions (status 5)
- **Request History**: Full history with status audit trail
- Auto-generate client_id when approving first-time clients
- Handle subscription requests (service_type 10, 11) with automatic card creation

#### 2.2 Calendar Management
- Weekly calendar view (Mon-Sun, 8:00-20:00)
- View pending and approved requests on calendar
- Mark available/unavailable slots
- Add holidays and blocked periods
- Drag-to-select time slots for bulk operations
- Auto-deactivate past holidays

#### 2.3 Clients Management (NEW)
- **Full client database** with composite key lookups (firstName/lastName/phone)
- **View client details** (contact info, subscription status)
- **View mailing list** (email subscription history per client)
- **View client cards** (active/inactive subscription cards)
- **Client filtering and search** without exposing primary keys to frontend
- Auto-fetch client_id on booking creation

#### 2.4 Subscriptions Management
- Manage client subscription cards (status: Active/Inactive/Declined/Used)
- Track subscription periods with expiration dates
- Approve/decline subscription payments
- Automatic subscription status synchronization
- Prevent subscription overlaps via database triggers

#### 2.5 Logout & Security
- 15-minute session timeout
- Manual logout button on all admin pages
- Account lockout after 5 failed login attempts (30-minute duration)
- Login attempt tracking (IP, timestamp, success/failure)

---

## API Endpoints

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/csrf-token` | Get CSRF token for login |
| POST | `/api/login` | User login (bcrypt verified, rate-limited) |
| POST | `/api/logout` | User logout (destroys session) |
| GET | `/admin.html` | Admin dashboard (protected) |
| GET | `/clients.html` | Clients page (protected) |
| GET | `/subscriptions.html` | Subscriptions page (protected) |

### Request/Booking Management
| Method | Endpoint | Purpose | Layer |
|--------|----------|---------|-------|
| GET | `/api/pending` | Get pending requests (status 1,10) | Controller → Domain |
| GET | `/api/c-pending` | Get pending for calendar view | Controller → Domain |
| GET | `/api/approved-requests` | Get approved requests (status 2) | Controller → Domain |
| GET | `/api/c-approved-requests` | Get approved for calendar | Controller → Domain |
| GET | `/api/completed-bookings` | Get completed bookings (status 5) | Controller → Domain |
| GET | `/api/c-completed-bookings` | Get completed for calendar | Controller → Domain |
| GET | `/api/request-history` | Get full request history | Controller → Domain |
| POST | `/api/book` | Create new booking request | Controller → Domain |
| POST | `/api/approve` | Approve request (auto-create client if needed) | Controller → Domain |
| POST | `/api/reject` | Reject request | Controller → Domain |
| POST | `/api/cancel` | Cancel request | Controller → Domain |

### Client Management (NEW - Composite Key Endpoints)
| Method | Endpoint | Purpose | Layer |
|--------|----------|---------|-------|
| GET | `/api/clients` | Get all clients (no primary keys exposed) | Controller → Domain |
| GET | `/api/client/:id` | Get client by ID (legacy) | Controller → Domain |
| GET | `/api/client/:firstName/:lastName/:phone` | Get client by composite key | Controller → Domain |
| GET | `/api/client/:id/mailing-list` | Get client mailing list by ID | Controller → Domain |
| GET | `/api/client/:firstName/:lastName/:phone/mailing-list` | Get client mailing list by composite key (NEW) | Controller → Domain |
| GET | `/api/client/:id/cards` | Get client subscription cards by ID | Controller → Domain |
| GET | `/api/client/:firstName/:lastName/:phone/cards` | Get client subscription cards by composite key (NEW) | Controller → Domain |

### Holiday Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/c-holidays` | Get active holidays for calendar |
| GET | `/api/holidays` | Get all holidays |
| POST | `/api/add-holiday` | Add holiday period |
| POST | `/api/disable-holiday` | Deactivate holiday |
| POST | `/api/auto-deactivate-past-holidays` | Auto-deactivate past holidays |

### Subscriptions
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/approve-subscription-payment` | Approve/decline subscription payment |
| POST | `/api/update-subscriptions` | Sync subscription statuses |

### Utilities
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/unavailable-slots` | Get booked/unavailable time slots |

---

## Database Schema (Key Tables)

### requestlog (Append-Only Audit Trail)
- `id` (PK)
- `order_id` (composite key identifier)
- `contact_id` (FK → contact)
- `client_id` (FK → client, nullable until approval)
- `product_id` (FK → product, the service type)
- `date` (appointment datetime)
- `status` (1=Pending, 2=Approved, 3=Scheduled, 5=Completed, 7=Rejected, 9=Cancelled, 10=Pending Payment, 15=Active, 18=Declined, 20=Used)
- `note` (optional)
- `stamp_created` (audit)

### client
- `client_id` (PK, auto-gen 1000+)
- `contact_id` (FK → contact)
- Internal table, never exposed to frontend

### contact
- `id` (PK)
- `firstName`, `lastName`, `phone`, `email`
- Used as public composite key for lookups

### card
- `card_id` (PK, auto-gen 200+)
- `client_id` (FK → client)
- `status` (15=Active, 19=Inactive, 20=Used)
- Tracks subscription cards per client

### subscription
- `id` (PK)
- `card_id` (FK → card)
- `product_id` (FK → product)
- `start_date`, `expiration_date`
- `status` (10=Pending Payment, 15=Active, 18=Declined, 20=Used)
- Tracks service subscriptions per card with expiration

### mailing_list
- `contact_id` (FK → contact)
- `client_id` (FK → client, populated on approval)
- `email`
- `date_subscribed`, `date_unsubscribed`
- Smart logic: resubscribe updates dates, preserves original subscription date

---

## Security Features

✅ **Fully Implemented**
- Bcrypt password hashing (not plain text)
- Environment variables for all secrets (.env file)
- Session-based authentication with 15-minute idle timeout
- Protected admin pages (requireAuth middleware)
- HTTP-only, SameSite=strict secure cookies
- CSRF protection with csurf tokens
- Rate limiting: Max 5 login attempts per 15 minutes per IP
- Account lockout: 30-minute lockout after exceeding max attempts
- Login attempt tracking (success/failure, IP, timestamp)
- Prepared statements on all SQL queries (prevents injection)
- No primary keys exposed to frontend (composite key lookups only)
- Development mode skips auth for testing

---

## Recent Changes & Improvements (Today's Session)

### Architecture & Code Quality
✅ Refactored to **3-layer domain-driven design**
✅ Created **domain modules** for auth, booking, request, holiday, client, subscription, contact, view
✅ Implemented **controller layer** for HTTP validation
✅ Organized **SQL queries** into queries.js files per domain
✅ Removed **all inline database logic** from app.js routes

### Client Management (Major Update)
✅ Fixed `/api/clients` endpoint (was calling non-existent method)
✅ Added **composite key lookups** for clients (firstName/lastName/phone)
✅ Created public queries (no ID exposure) vs internal queries (with contact_id)
✅ Added mailing list lookup by composite key
✅ Added card lookup by composite key
✅ Route ordering: composite key routes checked first (Express specificity)

### Bug Fixes
✅ Fixed getAllClients - updated query object reference from `queries.getAllClients` to `queries.client.getAllClients`
✅ Fixed getClientMailingList - returns array instead of single object
✅ Fixed getClientById - properly validates client_id parameter

### Code Cleanup
✅ Removed orphaned async code blocks from partial refactoring
✅ Removed undefined SQL variable references causing server crashes
✅ Removed duplicate route handlers with old inline code

---

## Current Functionality Checklist

### Admin Panel - Request Management
- [x] Pending request approval/rejection with auto-client creation
- [x] Approved requests view
- [x] Completed bookings history
- [x] Full request history with audit trail
- [x] Calendar views for requests and bookings
- [x] Subscription request handling (auto card creation)

### Admin Panel - Holiday Management
- [x] View active/inactive holidays
- [x] Add holidays and blocked periods
- [x] Deactivate holidays manually
- [x] Auto-deactivate past holidays
- [x] Calendar integration

### Admin Panel - Client Management (NEWLY COMPLETED)
- [x] View all clients database
- [x] Search clients by composite key (firstName/lastName/phone)
- [x] View client details (no primary key exposure)
- [x] View client mailing list subscription history
- [x] View client subscription cards
- [x] Auto-create clients on first request approval

### Admin Panel - Subscriptions Management
- [x] Approve/decline subscription payments
- [x] Track subscription status and expiration
- [x] Prevent subscription overlaps
- [x] Auto-sync subscription statuses

### Admin Panel - Authentication & Security
- [x] Secure login with bcrypt verification
- [x] Rate limiting on login attempts
- [x] Account lockout after failed attempts
- [x] Login attempt tracking
- [x] CSRF protection on forms
- [x] 15-minute session timeout
- [x] Logout functionality
- [x] Development mode auth bypass
- [x] Protected admin pages

### Admin Panel - UI/UX
- [x] Pagination on tables
- [x] Modal dialogs for actions
- [x] Forms with validation
- [x] Responsive calendar
- [x] Clear error messages

### Client Pages
- [x] Home/landing page
- [x] Booking form with validation
- [x] Available slots detection
- [x] Booking history view
- [x] Email subscription management
- [x] Smart duplicate prevention
- [x] Phone conflict detection

---

## Known Issues & TODOs

### High Priority - Feature Completeness
- [ ] **Transaction table & balance tracking** (Part of Option 3 - Next Checkpoint)
- [ ] **Automatic product forcing for active subscribers** (Part of Option 3 - Next Checkpoint)
- [ ] Email notifications for booking confirmation
- [ ] Email reminders before appointments
- [ ] Monitoring endpoints for status auto-updates

### Medium Priority - Code Quality & Polish
- [ ] Refactor admin.js (1382 lines - extract into modules)
- [ ] Extract frontend modules (admin-bookings, clients-info, etc.) into separate files
- [ ] Add comprehensive input validation and sanitization
- [ ] Add unit tests for domain modules
- [ ] Add integration tests for API endpoints
- [ ] API documentation (Swagger/OpenAPI)

### Low Priority - Enhancement
- [ ] Multi-language support (currently Bulgarian/English)
- [ ] Data export functionality (CSV/PDF)
- [ ] SMS notifications option
- [ ] Analytics dashboard
- [ ] Mobile app or responsive improvements
- [ ] Client self-service cancellation
- [ ] Subscription renewal reminders

---

## Next Checkpoint Recommendations

### **RECOMMENDED: Option 3 - Complete Transaction Implementation** ⭐

This gives you enterprise-grade subscription management with full balance tracking and product enforcement. Implement in phases:

#### Phase 1: Transaction Table & Balance Tracking (Week 1)
**Priority: HIGH - Foundation for Option 2**

**What it does:**
- Create `transactions` table to log every subscription usage
- Track client balance per subscription card
- When approved booking matches subscription product → decrease balance by 1
- When balance reaches 0 → mark subscription as status=20 (Used)
- Full audit trail of all subscription usage

**Files to create/modify:**
- `data/transaction/transaction.js` (new domain module)
- `data/transaction/queries.js` (new queries module)
- `controllers/transactionController.js` (new controller)
- `data/subscription/subscription.js` (update approveSubscriptionPayment logic)
- `data/request/request.js` (update approveRequest to deduct balance)
- Database migration: Create transactions table

**Schema changes:**
```sql
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT,
  order_id INT,
  transaction_type ENUM('BOOKING_USED', 'REFUND', 'ADJUSTMENT'),
  amount INT DEFAULT -1,
  balance_after INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscription(id)
);

-- Track current balance per subscription
ALTER TABLE subscription ADD COLUMN current_balance INT DEFAULT 0;
```

**Benefits:**
- Prevent double-booking subscription products
- Accurate balance tracking
- Audit trail for all subscription usage
- Foundation for refunds and adjustments

#### Phase 2: Automatic Product Forcing (Week 2)
**Priority: HIGH - Improves UX & prevents fraud**

**What it does:**
- When client with active subscription submits booking → auto-override product_id
- Force them to use their subscription product
- Only show other products if subscription balance exhausted
- Prevent selection of non-subscription products while balance exists

**Files to modify:**
- `data/booking/booking.js` (add subscription check before requestlog INSERT)
- `public/script.js` (frontend: disable non-subscription products if active subscription)
- `controllers/bookingController.js` (validate no override of active subscription)

**Logic flow in approveRequest:**
```javascript
1. Get request details
2. Check client's active subscriptions
3. If active subscription exists AND balance > 0:
   - If request product != subscription product → REJECT
   - If request product == subscription product → Deduct balance in transactions table
4. If active subscription exists AND balance == 0:
   - Mark subscription as status=20 (Used)
   - Allow other products
```

**Benefits:**
- Prevents bookings outside subscription product
- Better user experience (auto-guide to correct product)
- Revenue protection (can't bypass subscription)
- Clear audit trail

#### Phase 3: Monitoring & Reporting (Week 3)
**Priority: MEDIUM - For business insights**

**Add endpoints:**
- `GET /api/subscription-stats` - Show active subscriptions, balances, etc.
- `GET /api/transactions/:clientId` - View transaction history
- `GET /api/low-balance-clients` - Clients with <5 sessions remaining
- Automated "renewal reminder" emails for expiring subscriptions

---

### Why Option 3 over Options 1 & 2:

| Aspect | Option 1 Only | Option 2 Only | Option 3 (Both) |
|--------|---|---|---|
| **Balance Tracking** | ✅ | ❌ | ✅ |
| **Product Enforcement** | ❌ | ✅ | ✅ |
| **Revenue Protection** | ⚠️ | ✅ | ✅ |
| **Fraud Prevention** | ⚠️ | ✅ | ✅ |
| **User Experience** | ❌ | ✅ | ✅ |
| **Audit Trail** | ✅ | ❌ | ✅ |
| **Implementation Time** | 3-4 days | 2-3 days | 5-7 days |
| **Business Value** | Medium | High | **Very High** |

---

## Implementation Timeline Suggestion

```
Week 1-2 (THIS WEEK): Option 3 Phase 1 (Transaction Table)
  ├─ Create transaction.js domain module
  ├─ Add transactions table to database
  ├─ Update approveSubscriptionPayment to log transactions
  ├─ Update booking approval to deduct balance
  └─ Add subscription balance tracking to card info

Week 2-3 (NEXT WEEK): Option 3 Phase 2 (Product Forcing)  
  ├─ Add subscription validation in bookingController
  ├─ Update frontend to show/hide products based on subscription
  └─ Add tests for balance logic

Week 4: Polish & Deployment
  ├─ Email notifications for low balance
  ├─ Documentation updates
  └─ Production testing
```

---

## Deployment & Testing

### Development
```bash
npm install
npm start
# Runs on localhost:3000
# Login bypassed in development
```

### Environment Setup (.env file)
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=vaskicha
DB_PASSWORD=parolata123
DB_NAME=CooleRM
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt-hash>
SESSION_SECRET=<strong-secret>
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW_MS=900000
ACCOUNT_LOCKOUT_DURATION_MS=1800000
```

### Production (Vercel)
- NODE_ENV=production
- Full authentication required
- HTTPS enabled
- Session timeout: 15 minutes
- Rate limiting active

**Live URL**: https://pilates-website-dilona.vercel.app/

---

## File Architecture Summary

### Clean Layers
- **Routes** (app.js): 20+ endpoints, all delegate to controllers
- **Controllers** (controllers/*): Validation + delegation
- **Domain** (data/[domain]/*): Business logic + queries
- **Queries** (data/[domain]/queries.js): SQL prepared statements

### Module Distribution
- 9 domain modules (auth, booking, client, contact, holiday, mailing, product, request, subscription, view)
- 10 controllers (one per domain, plus viewController)
- Clean separation of concerns
- Easy to add new domains without touching existing code

---

*Last Updated: April 4, 2026*
*Next Checkpoint: Option 3 - Transaction Management + Product Forcing*

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
