# Firebase Auth Debug Log - 2026-03-12

## Issue: "Authentication service is currently unavailable"
**Symptoms:**
- User clicks Google Sign-In button; nothing happens.
- Error "Authentication service is currently unavailable" appears in the modal.

## Root Cause Analysis
- `lib/firebase.ts` was using a conditional initialization block: `if (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_FIREBASE_API_KEY)`.
- On Vercel (or during certain SSR phases), `auth` and `db` were being exported as `undefined` if the conditions weren't perfectly met at module load time.
- `LoginModal.tsx` had a strict check: `if (!auth || !db) { setError('Authentication service is currently unavailable'); return; }`.

## Fix Implemented
- **Robust Singleton**: Refactored `lib/firebase.ts` to use a guaranteed singleton pattern: `const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();`.
- **Centralized Auth**: Moved `signInWithGoogle` logic from the UI component into `AuthContext.tsx`.
- **Simplified UI**: Updated `LoginModal.tsx` to consume the centralized auth method, removing the fragile local service checks.

## Verification Result
- **Build**: `npm run build` passed successfully.
- **UI**: Verified via browser subagent. Redirect from `/` to `/phase1` is working. Google Sign-In button is rendering and accessible.
