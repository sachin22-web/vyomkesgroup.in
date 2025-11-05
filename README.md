Vyomkesh Industries — Investment Platform

Live: https://vyomkeshgroup.com/
<img width="1919" height="981" alt="image" src="https://github.com/user-attachments/assets/aa0bb6ac-0e88-4e3a-a17f-2195970d1220" />

Purpose: A consumer-facing investment platform with public marketing pages (plans, FAQs, disclosures) and an authenticated area (signup/login, wallet, dashboard).

Key public sections visible on the live site:

Home / Plans / Calculator: investment offerings and plan details. 
vyomkeshgroup.com
+1

Sign up / Login: account creation & secure access to the app. 
vyomkeshgroup.com
+1

Risk disclosure & Privacy: compliance/legal pages. 
vyomkeshgroup.com
+1

FAQ: fees, withdrawals, timelines. 
vyomkeshgroup.com

Contact: support channel and email. 
vyomkeshgroup.com

Disclaimer: This repo is for an investment-style web app. Ensure all features comply with applicable laws (SEBI/RBI/IT Act, state rules, etc.). Don’t launch “fixed/assured” return products without proper licenses/registrations. 
vyomkeshgroup.com

🧭 Features

Public

Marketing homepage with plan grid & CTAs (Explore Plans, Sign Up). 
vyomkeshgroup.com
+1

Legal pages: Terms, Privacy, Risk Disclosure. 
vyomkeshgroup.com
+1

FAQs covering charges (admin fee, optional booster, TDS), withdrawals (T+1 indicative). 
vyomkeshgroup.com
<img width="1898" height="987" alt="image" src="https://github.com/user-attachments/assets/e0dd3829-644c-453d-bd02-7c95174ffd88" />

Contact page with support email. 
vyomkeshgroup.com

Authenticated

User onboarding (Signup/Login), password reset. 
vyomkeshgroup.com
+1

Wallet/Dashboard entry point (/app/wallet). 
vyomkeshgroup.com

Investment plan selection & calculator (per live site content). 
vyomkeshgroup.com

Admin (typical)

Plans, users, KYC docs, withdrawals, ledger exports, support inbox.

🧱 Tech Stack (recommended typical setup)

The live site doesn’t expose source; the stack below is a standard, stable choice for this kind of app.

Frontend
<img width="1903" height="984" alt="image" src="https://github.com/user-attachments/assets/b74816df-8d76-476e-826d-c0a5429b39c6" />

React + TypeScript + React Router (or Next.js if SSR/SEO needed)

Tailwind CSS + UI component library

Form validation (Zod), state via Context/Zustand

Backend

Node.js + Express (TypeScript)

MongoDB (Atlas) with Mongoose

JWT auth + role guards (user/admin)

Email via SMTP provider

Storage (S3/Cloud) for KYC docs (if applicable)

DevOps

Client: Netlify/Vercel

API: Railway/Render/VPS (PM2 + Nginx)

Secrets via provider env

📁 Suggested Monorepo Structure
vyomkesh/
├─ client/                     # React app
│  ├─ src/
│  │  ├─ pages/                # Home, Plans, FAQs, Risk, Privacy, Auth, Dashboard
│  │  ├─ components/           # Navbar, Footer, PlanCard, Calculator, Forms
│  │  ├─ features/             # auth, wallet, profile
│  │  ├─ api/                  # api.ts (centralized fetch with base URL, retries)
│  │  ├─ hooks/ lib/ store/    # zustand/context, utils, validation schemas
│  │  └─ main.tsx App.tsx index.css
│  └─ vite.config.ts
│
├─ server/                     # Express API (TypeScript)
│  ├─ src/
│  │  ├─ index.ts              # createServer(), routes, middlewares, cors
│  │  ├─ config/env.ts         # env loader & schema
│  │  ├─ db/mongoose.ts
│  │  ├─ middleware/           # auth.ts, rateLimit.ts, error.ts
│  │  ├─ models/               # User, Wallet, Transaction, Plan, KycDoc
│  │  ├─ routes/
│  │  │  ├─ auth.ts            # signup/login/forgot/reset
│  │  │  ├─ wallet.ts          # add funds (manual/pg), withdraw, ledger
│  │  │  ├─ plans.ts           # list, calculator, subscribe
│  │  │  ├─ support.ts         # contact form / ticket
│  │  │  └─ admin.ts           # users, plans, payouts, approvals
│  │  ├─ services/             # email, calculator, kyc, payouts
│  │  └─ utils/                # date/IST, idempotency, csv export
│  ├─ tsconfig.json
│  └─ ecosystem.config.cjs
│
└─ package.json                # root scripts

🔐 Environment Variables

Server (.env)

NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=<strong-secret>
CLIENT_ORIGIN=https://vyomkeshgroup.com

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SUPPORT_EMAIL=support@vyomkeshindustries.com


Client (client/.env)

VITE_API_BASE_URL=https://api.vyomkeshgroup.com
VITE_APP_NAME=Vyomkesh Industries


Use provider secrets in production. Don’t commit real keys.

🧑‍💻 Local Development
# from repo root
npm install

# dev servers (two terminals)
npm run dev:server   # tsx server/src/index.ts (API on http://localhost:5000)
npm run dev:client   # vite client (http://localhost:5173)
<img width="1898" height="975" alt="image" src="https://github.com/user-attachments/assets/f146328e-c2f3-45ee-9fb8-be9cbf459dc1" />


Suggested root scripts

{
  "dev:client": "vite --host",
  "dev:server": "tsx server/src/index.ts",
  "build": "npm run build:client && npm run build:server",
  "build:client": "vite build --config client/vite.config.ts",
  "build:server": "tsc -p server/tsconfig.json",
  "start": "node server/dist/index.js",
  "lint": "eslint .",
  "typecheck": "tsc -b"
}

🔌 API (typical endpoints)

Replace with your exact paths once wired.

Auth

POST /api/auth/signup — email + password

POST /api/auth/login

POST /api/auth/forgot → email reset link

POST /api/auth/reset → set new password

Public

GET /api/plans — list plans (tenure, target APR, limits)

POST /api/support/contact — contact form → email

User

GET /api/wallet — balance, ledger, TDS summary

POST /api/wallet/add-request — proof upload (manual) or PG init

POST /api/wallet/withdraw — request withdraw

GET /api/portfolio — user’s active plans

Admin

GET /api/admin/users — filters, KYC, export CSV

POST /api/admin/plan — create/update plan

POST /api/admin/withdraw/:id/process — approve/reject

GET /api/admin/ledger/export — CSV

🔒 Compliance & Risk

Show Risk Disclosure prominently; avoid claiming fixed/assured returns without licenses. 
vyomkeshgroup.com

Keep Privacy and Terms public and updated. 
vyomkeshgroup.com

TDS/fee disclosure consistent with FAQs (admin fee, optional booster, TDS). 
vyomkeshgroup.com

Implement:

KYC + AML checks (if handling funds)

Rate limits, IP throttling, request validation

Proper accounting/ledger with immutable entries

🏗 Build & Deploy

Frontend

cd client
npm run build                 # outputs to client/dist
# Netlify/Vercel: set VITE_* env and build command


Backend

cd server
npm run build
node dist/index.js


PM2 on VPS

pm2 start server/dist/index.js --name vyomkesh-api
pm2 save && pm2 startup


Nginx SPA (client)

server {
  server_name vyomkeshgroup.com www.vyomkeshgroup.com;
  root /var/www/vyomkesh/client/dist;
  location / {
    try_files $uri /index.html;
  }
}

🧯 Troubleshooting

Auth not persisting: check cookie/domain settings or JWT storage.

CORS failing: ensure CLIENT_ORIGIN allowed with credentials.

Emails not sent: verify SMTP creds + less-secure app rules/provider.

Build path mismatch: client VITE_API_BASE_URL must match API origin.

Time zones: normalize to IST for ledgers and T+1 calculations.

📈 Roadmap

Plan calculator with tax/TDS preview

KYC workflow (PAN/Aadhaar verification)

Bank payouts via Payout API

Notifications (email/SMS/WhatsApp)

Admin audit log + dashboards

Multi-role staff panel (reviewers, finance)

📞 Contact

Support: support@vyomkeshindustries.com
 
vyomkeshgroup.com

📄 License

Proprietary — © Vyomkesh Industries. All rights reserved.
