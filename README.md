# Expense & Income Management Platform

Monorepo containing:
- `web`: React + Vite + Tailwind web app
- `mobile`: React Native (Expo) app
- `firebase`: Firebase config, Firestore rules and indexes (Spark-safe)
- `shared`: shared constants/types used across apps

## Architecture

Clean architecture inspired by production MERN practices:
- `features/`: domain features (transactions, accounts, analytics, auth)
- `services/`: Firebase adapters and API clients
- `store/`: app-wide state and query hooks
- `ui/`: reusable components
- `utils/`: pure utility functions

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Configure Firebase
- Create `web/.env` and `mobile/.env` from examples
- Add Firebase project config values

3. Run web
```bash
npm run dev:web
```

4. Run mobile
```bash
npm run dev:mobile
```

5. Deploy firebase assets (Spark plan)
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

See `docs/DEPLOYMENT.md` for full production setup.
