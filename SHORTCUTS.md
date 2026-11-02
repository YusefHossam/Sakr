# SAKR shortcuts

Run these from the project folder (`C:\Users\hp\Desktop\sakr-store`).

| What | Command |
|---|---|
| Run the site locally (dev, hot reload) | `npm run dev` then open http://localhost:3100 (`npm run dev -- --port 3100`) |
| Run the real production build locally | `npm run prod` then open http://localhost:3200 |
| Typecheck + lint + build (no tests) | `npm run check` |
| All tests, desktop + phone (needs `npm run prod` running) | `npm test` |
| Phone tests only | `npm run test:phone` |
| One test file | `npx playwright test e2e/buy.spec.ts` |
| Tests against the live site | `npm run test:live` |
| Deploy to Vercel | `npm run deploy` |
| Check, test, deploy, test the live site | `npm run ship` |
| Open the site to everyone (turn off Vercel login) | `npm run unlock` |
| Live server logs | `npm run logs` |
| Create / reset the admin | `npm run create-admin` (reads `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env.local`) |
| Reseed the catalog | `npm run seed:catalog && npm run seed:extras && npm run generate:descriptions` |
| Scrape more products | `node scripts/scrape-catalog.mjs --merge --only=<source names>` |
| Compress new product photos | `node scripts/compress-images.mjs` |

## Links

| | |
|---|---|
| Local site | http://localhost:3200 (production build) / http://localhost:3100 (dev) |
| Live site | https://sakr-store.vercel.app |
| Vercel project | https://vercel.com/yusef-s-web-dev/sakr-store |
| Deployment protection | https://vercel.com/yusef-s-web-dev/sakr-store/settings/deployment-protection |
| Admin | `/ar/admin` (username in `.env.local`) |
| Status page | `/ar/status` |
| Test customer | `buyer.test@sakr.local` / `Test-ad4f1712` |
