# Restaurant backend API

Express and MongoDB API for the L’Étoile restaurant applications. It provides menu, team, promotion, review, guest feedback and reservation data consumed by both the React and Angular frontends.

## Requirements

- Node.js 14 or newer
- MongoDB running locally or a MongoDB connection string

## Install and run

```bash
npm install
```

Copy `env.example` to `.env`, then set the database URL and secrets for your environment. For a local MongoDB instance, the default database is `mongodb://127.0.0.1:27017/conFusion`.

```bash
npm run dev
```

The API defaults to port 8000. In the parent workspace, `scripts/start-backend.ps1` creates `.env` from `env.example` if needed and starts the API on port 8002, matching both frontend configurations. Set `PORT` and `ALLOWED_ORIGINS` as needed for another deployment.

## Data initialization

The starter data is in `db.json`. To populate a local database:

```bash
npm run populate
```

**Warning:** `populateDb.js` deletes and replaces the dishes, leaders, promotions, feedback and comments collections. Run it only when replacing those collections is intended. The parent workspace's start script runs it automatically only when the dishes collection is empty.

## API resources

- `/users` — signup, login and user operations.
- `/dishes` — menu items and dish details.
- `/leaders` — team profiles.
- `/promotions` — offers and promotions.
- `/comments` — dish reviews and comments.
- `/feedback` — guest feedback submission.
- `/favorites` — authenticated user favorites.
- `/imageUpload` — image upload.
- `/reservations` — availability and reservation requests.
- `/restaurant/overview` — live service status and capacity overview.

Common public reads include `GET /dishes`, `GET /leaders`, `GET /promotions`, `GET /comments`, and `GET /restaurant/overview`. Some create, update, moderation and reservation-management operations require authentication or staff authorization.

### Reservations

- `GET /reservations/availability?date=YYYY-MM-DD&partySize=2` returns available half-hour dinner seatings.
- `POST /reservations` creates a pending request with `guestName`, `email`, `phone`, `date`, `time`, `partySize`, optional `occasion` (`dinner`, `birthday`, `anniversary`, `business`, `other`) and optional `note`.
- `GET /reservations?date=YYYY-MM-DD&status=requested` lists requests for staff.
- `PUT /reservations/:reservationId/status` lets staff confirm, cancel or complete a request.

Dinner service runs from 17:00 to 21:00 in 30-minute intervals. Each seating has 40 guest seats and parties can contain up to 12 guests. Past seatings are unavailable. Capacity is reserved atomically; cancelling a request releases its seats. A submitted request is not a confirmed booking. The timezone is controlled by `RESTAURANT_TIMEZONE` and defaults to `Asia/Kolkata`.

## Environment variables

See `env.example` for the available settings, including `PORT`, `MONGO_URL`, authentication/session secrets, upload limits, CORS origins and Facebook OAuth settings. Never commit a populated `.env` file or production secrets.

## Scripts

- `npm start` — run the API with Node.
- `npm run dev` — run with Nodemon.
- `npm run populate` — replace seeded collections with `db.json` data.

The `npm test` script is currently a placeholder and exits with an error; no test suite is configured in this package.
