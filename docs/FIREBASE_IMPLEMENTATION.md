# Firebase Implementation Guide

## Overview

This document describes the Firebase integration for the Studio Nomad Portal, including authentication, Firestore database schema, and user memory system.

## Firebase Services Used

1. **Firebase Authentication** - User login/registration
2. **Cloud Firestore** - User profiles and project data
3. **Firebase Storage** - (Future) Image storage

## Firestore Schema

### Users Collection

```typescript
interface UserProfile {
  uid: string           // Firebase Auth user ID
  email: string         // User email
  displayName: string   // Display name
  credits: number       // Render credits balance
  preferences: {
    defaultStyle: 'MIR' | 'Luxigon' | 'Brutalist' | 'Minimalist'
    defaultResolution: '2K' | '4K' | '8K'
    preferredMaterials: string[]
    dislikedMaterials: string[]
    lightingPreference: 'golden_hour' | 'overcast' | 'dramatic' | 'soft'
  }
  memory: Record<string, any>  // User preferences learned over time
  projectHistory: string[]    // List of project IDs
}
```

### Example Document (Firestore)

```
users/{userId}
{
  uid: "abc123xyz",
  email: "architect@example.com",
  displayName: "John Architect",
  credits: 500,
  preferences: {
    defaultStyle: "MIR",
    defaultResolution: "4K",
    preferredMaterials: ["concrete", "timber", "glass"],
    dislikedMaterials: ["cheap plastic", "neon"],
    lightingPreference: "golden_hour"
  },
  memory: {
    likes_brutalism: true,
    always_use_4k: true,
    last_project: "Mansion in HK",
    favorite_architect: "Kengo Kuma"
  },
  projectHistory: ["project-001", "project-002"]
}
```

## Implementation Status

### Current (Phase 1-2)
- **Mock Implementation**: The `useUserMemory` hook currently uses mock data
- No actual Firebase connection required for Phase 1

### Future (Firebase Implementatio Phase)
- Add Firebase Authentication
- Connect Firestore for user data persistence
- Implement login/registration flow

## Setting Up Firebase

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "studio-nomad-portal"
3. Enable Authentication (Email/Password)
4. Enable Cloud Firestore
5. Get your Firebase config

### 2. Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Config File

Create `lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

## User Memory Hook

The `useUserMemory` hook provides:

```typescript
interface UseUserMemoryReturn {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  updatePreference: (key: string, value: any) => Promise<void>
  addToMemory: (key: string, value: any) => Promise<void>
  getMemory: (key: string) => any
  deductCredits: (amount: number) => Promise<boolean>
}
```

### Usage

```typescript
const { profile, updatePreference, deductCredits } = useUserMemory(userId)

// Update user preference
await updatePreference('defaultStyle', 'MIR')

// Deduct credits before rendering
const success = await deductCredits(10)
if (success) {
  // Proceed with render
}
```

## Preference Extraction

The hook includes a helper function to extract preferences from natural language:

```typescript
import { extractPreferencesFromText } from '@/hooks/useUserMemory'

// Extract from user message
const prefs = extractPreferencesFromText("I love brutalist architecture with concrete")
// Result: { preferredMaterials: ['concrete'], defaultStyle: 'Brutalist' }
```

## Future Enhancements

### Phase 3: Authentication
- Login/Registration pages
- Firebase Auth integration
- Session management

### Phase 4: Credit System
- Credit purchase flow
- Credit deduction on render
- Credit history tracking

### Phase 5: Cloud Storage
- Store generated images in Firebase Storage
- User gallery management
- Image sharing
