# Legacy FX - Professional Cryptocurrency Trading & Brokerage Platform

A complete, production-ready cryptocurrency brokerage platform with institutional-grade trading tools, real-time market data, staking, mining, investment products, copy trading, trading signals, referral programs, and comprehensive user management.

## ✨ Key Features

### 🎯 Trading
- Real-time cryptocurrency trading (buy/sell)
- Multiple order types (market, limit, stop)
- TradingView Advanced Charts integration
- Portfolio tracking with P&L calculations
- Copy trading - automatically mirror top traders
- Trading signals with entry/exit points
- Price alerts and notifications

### 💰 Wallets & Assets
- Multi-currency wallet support (crypto + fiat)
- Crypto deposits with address generation
- Secure withdrawals with 2FA confirmation
- Cold storage for long-term security
- WalletConnect integration
- Complete transaction history

### 📈 Passive Income
- Staking products with variable APY
- Cloud mining with multiple hashrate plans
- Fixed-income investment products
- DeFi investment opportunities
- Rental yield from tokenized real estate

### 🔐 Security & Compliance
- Email/password authentication with 2FA
- JWT-based session management
- KYC/AML verification workflow
- Bank-grade encryption
- Rate limiting and DDoS protection
- Comprehensive audit logging

### 💬 User Features
- Complete user profile management
- Support ticket system with live chat
- Referral program with commission tracking
- Multi-language support
- Mobile-responsive design
- Real-time notifications via Ably

### 🛠️ Admin Tools
- User management dashboard
- Transaction monitoring
- Deposit/withdrawal approval queue
- KYC verification management
- Trading signal management
- Platform analytics and reporting

## 🏗️ Project Structure

```
legacy-fx/
├── frontend/                    # Next.js 16 + React 18
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Registration
│   │   ├── dashboard/         # Main dashboard
│   │   ├── trades/            # Trading interface
│   │   ├── wallets/           # Wallet management
│   │   ├── staking/           # Staking products
│   │   ├── investments/       # Investment products
│   │   ├── mining/            # Mining plans
│   │   ├── signals/           # Trading signals
│   │   ├── referrals/         # Referral program
│   │   ├── support/           # Support center
│   │   ├── profile/           # User settings
│   │   ├── layout.tsx         # Root layout
│   │   └── dashboard-layout.tsx # Authenticated layout
│   ├── components/
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   └── Header.tsx         # Top navigation
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth hook
│   │   ├── useAbly.ts         # Real-time hook
│   │   └── useMarketData.ts   # Market data hook
│   ├── lib/
│   │   └── api.ts             # API client
│   ├── constants.ts           # API endpoints
│   ├── global.d.ts            # TypeScript types
│   ├── globals.css            # Tailwind + custom styles
│   └── tailwind.config.ts     # Tailwind config
│
├── backend/                     # FastAPI + Python
│   ├── app/
│   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── account.py
│   │   │   ├── trade.py
│   │   │   ├── wallet.py
│   │   │   ├── staking.py
│   │   │   ├── mining.py
│   │   │   ├── investment.py
│   │   │   ├── signal.py
│   │   │   └── ... (more models)
│   │   ├── schemas/           # Pydantic request/response
│   │   │   ├── auth.py
│   │   │   ├── account.py
│   │   │   ├── trade.py
│   │   │   └── ... (more schemas)
│   │   ├── routers/           # API route handlers
│   │   ├── services/          # Business logic
│   │   │   ├── account.py
│   │   │   ├── email.py
│   │   │   └── biller_service.py
│   │   └── utils/             # Utility functions
│   │       ├── auth.py
│   │       ├── ably.py
│   │       ├── cloudinary.py
│   │       ├── crypto.py
│   │       ├── totp.py
│   │       └── ... (more utils)
│   ├── config.py              # Configuration
│   ├── database.py            # Database setup
│   ├── main.py                # FastAPI app + migrations
│   ├── requirements.txt       # Dependencies
│   └── .env.example           # Environment template
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with pnpm
- Python 3.10+ with pip/uv
- PostgreSQL 13+
- Redis 6+ (optional)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings:
# - DATABASE_URL=postgresql+asyncpg://user:pass@localhost/legacy_fx
# - BETTER_AUTH_SECRET=your_secret
# - ABLY_KEY=your_ably_key

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Database Migrations

This project uses Alembic to manage database schema changes.

**To create a new migration:**

After changing a model in `backend/app/models/`, run the following command in the `backend` directory to automatically generate a migration script:

```bash
alembic revision --autogenerate -m "A descriptive message about the change"
```

**To apply migrations:**

```bash
alembic upgrade head
```

**Troubleshooting: `Target database is not up to date`**

If you get this error when running `revision`, it means your database is not empty. This happens if you ran the app before Alembic was set up. To fix it, run:

```bash
# Mark the database as up-to-date
alembic stamp head

# Then, generate your migration again
alembic revision --autogenerate -m "Your message"
```

API available at: `http://localhost:8000/api/v1`
Docs at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings:
# - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# - NEXT_PUBLIC_ABLY_KEY=your_ably_key

# Start development server
pnpm dev
```

App available at: `http://localhost:3000`

## 🎨 Design System

### Color Palette (Binance-Inspired Dark Theme)
```
Primary Background:     #1E2329 (Shark - main pages)
Secondary Background:   #181A20 (Binance Dark - sidebars)
Tertiary Background:    #2B2F36 (Hover states)
Elevated Background:    #0B0E11 (Modals, dropdowns)

Primary Accent:         #FCD535 (Bright Sun - buttons, CTA)
Secondary Accent:       #F3BA2F (Golden Yellow - highlights)
Hover Accent:           #F0B90B (darker yellow)

Success:                #0ECB81 (Green - buy, gains)
Danger:                 #F6465D (Red - sell, losses)
Warning:                #F37B24 (Orange - pending)
Info:                   #1890FF (Blue - info badges)

Text Primary:           #FFFFFF (main text)
Text Secondary:         #848E9C (secondary labels)
Text Tertiary:          #474D57 (disabled, muted)

Border:                 #2B2F36 (standard dividers)
Border Light:           #363C45 (inner element borders)
```

### Typography
- **Display/Headings**: Cormorant Garamond (weights: 400, 500, 600, 700)
- **Body/UI**: Outfit (weights: 300, 400, 500, 600)
- **Numbers/Data**: JetBrains Mono (weights: 400, 500)

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/register          Register new user
POST   /api/v1/auth/login             Login with email/password
POST   /api/v1/auth/logout            Logout
POST   /api/v1/auth/refresh           Refresh access token
GET    /api/v1/auth/session           Get current session
POST   /api/v1/auth/forgot-password   Request password reset
POST   /api/v1/auth/reset-password    Reset password
POST   /api/v1/auth/verify-email      Verify email with OTP
POST   /api/v1/auth/2fa/enable        Enable 2FA
POST   /api/v1/auth/2fa/verify        Verify TOTP code
POST   /api/v1/auth/2fa/disable       Disable 2FA
```

### Trading
```
POST   /api/v1/trades/buy             Place buy order
POST   /api/v1/trades/sell            Place sell order
GET    /api/v1/trades/history         Get trade history
GET    /api/v1/trades/{id}            Get trade details
GET    /api/v1/trades/portfolio       Get portfolio
POST   /api/v1/trades/copy            Start copy trading
GET    /api/v1/trades/copy/traders    List top traders
GET    /api/v1/trades/copy/active     Get active copy sessions
DELETE /api/v1/trades/copy/{id}       Stop copying trader
```

### Markets
```
GET    /api/v1/markets/prices         Get live prices (cached 30s)
GET    /api/v1/markets/prices/{symbol} Get single price
GET    /api/v1/markets/trending       Get trending coins
GET    /api/v1/markets/gainers        Get top gainers (24h)
GET    /api/v1/markets/losers         Get top losers (24h)
GET    /api/v1/markets/overview       Get global stats
GET    /api/v1/markets/pairs          Get available pairs
```

### Wallets
```
GET    /api/v1/wallets                List user wallets
GET    /api/v1/wallets/{id}           Get wallet details
POST   /api/v1/wallets/deposit        Initiate deposit
POST   /api/v1/wallets/withdraw       Request withdrawal
GET    /api/v1/wallets/withdraw/history Get withdrawal history
GET    /api/v1/wallets/deposit/history  Get deposit history
POST   /api/v1/wallets/cold-storage   Move to cold storage
GET    /api/v1/wallets/cold-storage   View cold storage
```

### Staking
```
GET    /api/v1/staking/products       List staking products
POST   /api/v1/staking/stake          Stake assets
GET    /api/v1/staking/positions      Get active positions
POST   /api/v1/staking/{id}/unstake   Unstake position
GET    /api/v1/staking/rewards        Get rewards history
```

### Investments
```
GET    /api/v1/investments/products   List products
POST   /api/v1/investments/invest     Create investment
GET    /api/v1/investments/active     Get active positions
GET    /api/v1/investments/history    Get history
POST   /api/v1/investments/{id}/redeem Redeem position
```

### Mining
```
GET    /api/v1/mining/plans           List mining plans
POST   /api/v1/mining/subscribe       Subscribe to plan
GET    /api/v1/mining/active          Get active plans
GET    /api/v1/mining/earnings        Get earnings history
POST   /api/v1/mining/{id}/cancel     Cancel subscription
```

### Signals
```
GET    /api/v1/signals                Get live signals
GET    /api/v1/signals/{id}           Get signal details
POST   /api/v1/signals/{id}/follow    Act on signal
GET    /api/v1/signals/history        Get history
```

### Referrals
```
GET    /api/v1/referrals/code         Get referral code
GET    /api/v1/referrals/stats        Get referral stats
GET    /api/v1/referrals/history      Get referral history
POST   /api/v1/referrals/claim        Claim rewards
GET    /api/v1/referrals/leaderboard  Get top referrers
```

## 🔐 Security Implementation

- **Passwords**: Bcrypt hashing with salt
- **Sessions**: JWT tokens (HS256) with 15-min expiry
- **2FA**: TOTP with QR code provisioning
- **CORS**: Configured for frontend domain
- **Rate Limiting**: slowapi with per-endpoint limits
- **Validation**: Pydantic schema validation
- **Transactions**: Database transaction management
- **Audit Logs**: All sensitive operations logged
- **SSL/TLS**: HTTPS enforced in production

## 🚢 Deployment

### Frontend (Vercel)
```bash
pnpm build
vercel deploy
```

### Backend (Render/Railway/AWS)
```bash
# Set environment variables in hosting platform
# Run migrations on first deployment
# Use Python 3.10+ runtime
```

## 📦 Dependencies

### Frontend
- next@16.x, react@18.x
- tailwindcss, typescript
- shadcn/ui components (imported as needed)
- ably (real-time)
- api client (fetch-based)

### Backend
- fastapi, uvicorn
- sqlalchemy (async)
- psycopg2-binary (PostgreSQL)
- pydantic, python-jose
- passlib[bcrypt]
- python-multipart
- slowapi (rate limiting)
- cloudinary, pyotp
- ably-python, aiohttp

## 🧪 Testing

```bash
# Backend
pytest

# Frontend
npm run test
```

## 📚 Documentation

- API Docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`
- Components: See `/frontend/components/`
- Models: See `/backend/app/models/`

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m 'Add feature'`
3. Push branch: `git push origin feature/name`
4. Create pull request

## 📄 License

All rights reserved © 2024 Legacy FX

---

**Built with Next.js 16 · FastAPI · PostgreSQL · React 18 · TypeScript · Tailwind CSS**

Latest Update: 2024
