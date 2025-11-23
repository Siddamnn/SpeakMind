import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore'
import Logger from '../utils/Logger'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Basic runtime validation for clearer local setup errors (development only)
if (import.meta.env.DEV) {
  const missing: string[] = []
  const entries = Object.entries(firebaseConfig) as Array<[string, string | undefined]>
  for (const [key, value] of entries) {
    if (value === undefined || value === null || String(value).trim() === '') {
      missing.push(key)
    }
  }
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] Missing env values:', missing.join(', '))
  }
  if (firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('AIza')) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] apiKey looks invalid (does not start with AIza). Check VITE_FIREBASE_API_KEY')
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Enable offline persistence for better UX
// This allows the app to work offline and sync when back online
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('[Firebase] Persistence failed: Multiple tabs open')
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('[Firebase] Persistence not supported by browser')
    }
  })
}

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  Logger.info('[Firebase] Connected to emulators')
}

export default app
