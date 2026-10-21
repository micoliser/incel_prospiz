# Detty December Lagos Luxe API

Django REST Framework backend connected to PostgreSQL (`detty_luxe_db`).

## Setup Instructions

1. **Virtual Environment**:
   ```bash
   cd api
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   PostgreSQL database: `detty_luxe_db`
   Connects via local PostgreSQL Unix socket using peer authentication.

3. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Populate Packages & Promo Codes**:
   ```bash
   python populate_packages.py
   ```

5. **Start Dev Server**:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```

---

## API Endpoints

- `GET /api/packages/` — List all active packages with pricing, inclusions, and remaining seats.
- `GET /api/packages/<id>/` — Single package detail.
- `POST /api/promo/validate/` — Validates promo code (e.g. `EARLYBIRD5`, `DETTY5`, `VIPLAGOS`).
- `POST /api/bookings/` — Creates a booking reservation in PostgreSQL and returns `bookingRef`.
- `GET /api/bookings/<booking_ref>/` — Fetches reservation summary by reference code.
