# BantayBarangay

A local civic reporting prototype for barangay infrastructure and public-safety concerns. It includes a resident portal, an administrative dashboard, and a zero-dependency Node.js + SQLite API.

## Run locally

Use Node.js 22.5 or later (the project uses the built-in `node:sqlite` module).

```powershell
npm start
```

Then open `http://localhost:3000/resident` or `http://localhost:3000/admin`.

To recreate only the local development database and seed records:

```powershell
npm run db:reset
```

## Quality checks

```powershell
npm test
```

The test suite uses disposable SQLite files, so it does not modify the development database.

## Demo accounts

- Resident: `09171234567` / `resident123`
- Admin: `09989876543` / `admin123`

## Deployment notes

This is a prototype, not a production deployment. Configure `NODE_ENV=production` to prevent OTP codes being returned by the API. Before public deployment, integrate a real SMS provider, add server-side authenticated sessions and role authorization for administrative actions, and serve it behind HTTPS.
