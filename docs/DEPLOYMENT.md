# Deployment Guide

## 1) Firebase Project
- Create Firebase project
- Enable Email/Password + Google auth
- Create Firestore in production mode

## 2) Environment Variables
- Copy `web/.env.example` -> `web/.env`
- Copy `mobile/.env.example` -> `mobile/.env`
- Fill with Firebase app credentials

## 3) Install Dependencies
```bash
npm install
```

## 4) Local Development
```bash
npm run dev:web
npm run dev:mobile
```

## 5) Deploy Backend (Spark plan)
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
> This setup uses Auth + Firestore only (no Cloud Functions, no Storage).

## 6) Deploy Web
- Build: `npm run build:web`
- Deploy static bundle using Firebase Hosting/Vercel/Netlify

## 7) Production Notes
- Use Firebase App Check
- Add monitoring and alerts
- Keep service account permissions minimal
