# 📈 Stock Trading System (MERN)

A virtual stock-trading web app. Every user gets **₹1,00,000 of virtual money** to buy and sell sample stocks, track a portfolio with profit/loss, and review transaction history. Admins can manage stocks and see all users and transactions. **No real money or payments are involved. All prices are sample data.**

**Stack:** React (Vite) · Bootstrap · Chart.js · Axios · Node.js · Express · MongoDB · Mongoose · JWT · bcryptjs

---

## 1. Prerequisites
- **Node.js 18+** (https://nodejs.org) – check with `node -v`
- **MongoDB Community Server** running locally (https://www.mongodb.com/try/download/community) **or** a free **MongoDB Atlas** cluster (then use its connection string)
- **Git** (for GitHub upload)

## 2. Folder structure
```
StockTradingSystem/
├── backend/
│   ├── config/db.js               # MongoDB connection
│   ├── controllers/               # auth, stock, trade, portfolio, transaction, admin logic
│   ├── middleware/                # auth (JWT + roles), validate, error handling
│   ├── models/                    # User, Stock, Transaction, Portfolio
│   ├── routes/                    # REST routes
│   ├── scripts/seed.js            # sample stocks + admin setup
│   ├── tests/api.test.js          # automated API tests
│   ├── app.js  server.js  package.json  .env.example
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, Footer, StockCard, StockChart, ProtectedRoute, AdminRoute, ...
│   │   ├── pages/                 # Home, Login, Register, Market, StockDetails, Portfolio, Transactions, AdminDashboard
│   │   ├── context/AuthContext.jsx
│   │   ├── utils/format.jsx  api.js  App.jsx  main.jsx  index.css
│   ├── index.html  vite.config.js  package.json  .env.example
├── README.md
└── .gitignore
```

## 3. Setup and run (step by step)

### Step 1 – Backend
```bash
cd backend
npm install
```
Create your environment file:
```bash
# macOS / Linux
cp .env.example .env
# Windows (Command Prompt)
copy .env.example .env
```
Open `backend/.env` and set:
- `MONGO_URI` – keep the default for local MongoDB, or paste your Atlas string.
- `JWT_SECRET` – a long random string. Generate one:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` – **your own** admin login (choose a strong password).

Load sample data and create the admin account:
```bash
npm run seed
```
Start the API:
```bash
npm run dev        # auto-restarts on changes  (or: npm start)
```
Check http://localhost:5000/api/health → `{"status":"ok"}`

### Step 2 – Frontend (open a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. In development Vite forwards `/api` requests to port 5000, so no extra config is needed.

### Step 3 – Try it
| Account | Login |
|---|---|
| Admin | the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you put in `.env` |
| Demo user (dev only) | `demo@example.com` / `Demo@123` |
| New user | use the Sign up page (starts with ₹1,00,000) |

## 4. Safe admin setup
- Public registration **always** creates role `user`. A request containing `"role":"admin"` is ignored.
- The only way to create an admin is `npm run seed`, which reads credentials from your private `.env` (never committed). If that email already exists, the script leaves it unchanged.
- Delete the demo user (`demo@example.com`) before deploying anywhere public.
- To promote an existing user manually: in `mongosh`, `db.users.updateOne({email:"x@y.com"},{$set:{role:"admin"}})`.

## 5. How trading works
- **Buy:** balance is debited only if it is sufficient (an atomic conditional update), then the holding is created/updated with a new **weighted average price**, then a transaction is stored.
- **Sell:** shares are decremented only if you own enough (atomic), balance is credited, empty holdings are removed, transaction stored.
- **Database transactions:** MongoDB multi-document transactions need a replica set (e.g. Atlas). Set `USE_DB_TRANSACTIONS=true` in `.env` when you have one. On standalone MongoDB (default), the code uses the atomic guards above plus compensating undo steps if a later step fails.
- Amounts are rounded to 2 decimals. Prices are sample data; admins can change them from the dashboard (this updates daily change % and adds a chart point).

## 6. API documentation
Base URL: `http://localhost:5000/api`. Protected routes need header `Authorization: Bearer <token>`. Errors return `{ "message": "..." }`.

| Method | Endpoint | Access | Body / Query | Description |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `name, email, password` | Create user (role=user, ₹1,00,000), returns `token, user` |
| POST | `/auth/login` | Public | `email, password` | Returns `token, user` |
| GET | `/auth/me` | User | – | Current user |
| GET | `/stocks` | Public | `search, sector, sort` (`name, price_asc, price_desc, gainers, losers, volume`) | List stocks |
| GET | `/stocks/sectors` | Public | – | Sector names |
| GET | `/stocks/:id` | Public | – | Stock with `historicalPrices` |
| POST | `/stocks` | Admin | `symbol, companyName, currentPrice, sector?, volume?` | Add stock |
| PUT | `/stocks/:id` | Admin | any of the above, `dailyChange?` | Update stock |
| DELETE | `/stocks/:id` | Admin | – | Delete (blocked if users hold shares) |
| POST | `/trade/buy` | User | `stockId, quantity` | Buy at current price |
| POST | `/trade/sell` | User | `stockId, quantity` | Sell at current price |
| GET | `/portfolio` | User | – | `holdings[]` and `summary` (invested, value, P&L, balance, net worth) |
| GET | `/transactions` | User | `type=BUY\|SELL, symbol, from, to` | Own history |
| GET | `/admin/stats` | Admin | – | Users, stocks, transactions, traded value, recent |
| GET | `/admin/users` | Admin | – | All users (no passwords) |
| GET | `/admin/transactions` | Admin | same filters | All transactions |

Status codes: 200/201 success · 400 validation · 401 not logged in · 403 forbidden · 404 not found · 409 duplicate.

## 7. Database design
- **users:** name, email (unique), password (bcrypt hash, never returned), role (`user|admin`), virtualBalance
- **stocks:** symbol (unique), companyName, sector, currentPrice, dailyChange (%), volume, historicalPrices[{date, price}]
- **transactions:** userId→users, stockId→stocks, transactionType (`BUY|SELL`), quantity, price, totalAmount, timestamp (+ symbol/companyName snapshot so history survives stock deletion)
- **portfolios:** userId→users, stockId→stocks, quantity, averagePrice, with a unique index on (userId, stockId)

`sector` and the transaction symbol/company snapshot are small additions to the fields you listed.

## 8. Testing
```bash
cd backend
npm test
```
`tests/api.test.js` covers: registration/login, password hashing, role protection, stock search/filter, buy/sell, balance maths, average price, overselling and insufficient-balance rejection, portfolio P&L, transaction filtering, and admin permissions + stock CRUD. It uses an in-memory MongoDB, so no database setup is needed (the first run downloads a MongoDB binary, so you need internet once).

**Manual UI checklist:** register → balance shows ₹1,00,000 → Market search "tcs" → open stock → buy 5 → Portfolio shows holding, P&L and charts → sell 2 → Transactions shows both rows and filters work → log in as admin → add/edit/delete a stock, view users and transactions → confirm a normal user visiting `/admin` is redirected.

## 9. Upload to GitHub
```bash
cd StockTradingSystem
git init
git add .
git status            # make sure .env is NOT listed (only .env.example)
git commit -m "Initial commit: Stock Trading System"
git branch -M main
# create an empty repository on github.com first, then:
git remote add origin https://github.com/<your-username>/StockTradingSystem.git
git push -u origin main
```
If `.env` ever appears in `git status`, **do not commit**; check that `.gitignore` exists.

## 10. Production notes (optional)
Build the frontend with `npm run build` (set `VITE_API_URL` first), set `NODE_ENV=production`, `CLIENT_URL` to your site's URL, use a strong `JWT_SECRET`, and use MongoDB Atlas.

## 11. Troubleshooting
- **`MongooseServerSelectionError`** – MongoDB isn't running / wrong `MONGO_URI`.
- **Login page says network error** – the backend isn't running on port 5000.
- **CORS error** – `CLIENT_URL` in `backend/.env` must match the frontend address.
- **Transaction error with `USE_DB_TRANSACTIONS=true`** – your MongoDB isn't a replica set; set it to `false`.
