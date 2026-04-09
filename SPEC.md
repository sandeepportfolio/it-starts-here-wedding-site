# Wedding Admin Portal Specification

## Architecture
- Backend: Node.js / Express
- Database: SQLite (via better-sqlite3)
- Frontend Admin: HTML/CSS/JS (served from `/public`)
- Guest Frontend: Modifications to root `/index.html` + `/public/upload.html`

## Database Schema (`admin-portal.db`)
* `admin_users`: id, email, password_hash, name, created_at
* `rsvps`: id, name, email, phone, attendance, dietary_restrictions, plus_ones, message, created_at, status
* `photos`: id, uploader_name, uploader_email, caption, url, approved (0/1), created_at
* `guest_messages`: id, name, email, message, created_at

## API Endpoints (Port 3001)
### Auth
* POST `/api/auth/register` (whitelist: lakshminamburi@yahoo.com, vnamboori@yahoo.com, sparx.sandeep@gmail.com, chamanthiaki5@gmail.com)
* POST `/api/auth/login`
* GET `/api/auth/me`

### RSVPs
* POST `/api/rsvps` (public)
* GET `/api/rsvps` (auth, supports query filters)
* PATCH `/api/rsvps/:id` (auth)
* DELETE `/api/rsvps/:id` (auth)

### Photos
* POST `/api/photos` (public, multipart/form-data via multer, saves to `/uploads`)
* GET `/api/photos` (auth, all photos)
* GET `/api/photos/approved` (public, approved only)
* PATCH `/api/photos/:id` (auth, approve/reject)
* DELETE `/api/photos/:id` (auth)

### Messages
* POST `/api/messages` (public)
* GET `/api/messages` (auth)
* DELETE `/api/messages/:id` (auth)

### Dashboard
* GET `/api/dashboard/stats` (auth)
