# Local test accounts (dev only)

| Role | Sign in with | Password |
|---|---|---|
| Customer | `buyer.test@sakr.local` | `Test-ad4f1712` |
| Owner / admin | the `ADMIN_USERNAME` in `.env.local` | the `ADMIN_PASSWORD` in `.env.local` |

The admin account is created with `npm run create-admin` (it reads those two values from `.env.local`).
Sign in at `/ar/login` or `/en/login`; the field accepts an email or the admin's username.
Change the admin password before putting the site online.
