// Firebase configuration and initialization
// This file provides a clean interface for Firebase services
import { initializeApp, getApp as _getApp, getApps } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Firebase configuration object
// export const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
// }

export const firebaseConfig = {
};

// Environment detection
export const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'
export const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'

// Emulator configuration for local development
export const emulatorConfig = {
  host: import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost',
  auth: {
    port: import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099,
    url: `http://localhost:${import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099}`
  },
  firestore: {
    port: import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080,
    url: `http://localhost:${import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080}`
  },
  functions: {
    port: import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT || 5001,
    url: `http://localhost:${import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT || 5001}`
  },
  storage: {
    port: import.meta.env.VITE_STORAGE_EMULATOR_PORT || 9199,
    url: `http://localhost:${import.meta.env.VITE_STORAGE_EMULATOR_PORT || 9199}`
  }
}

// Application configuration
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'Metahuman Admin Console',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  organization: import.meta.env.VITE_ORGANIZATION_NAME || 'GAIL India Limited',
  
  // Security settings
  tokenExpiry: parseInt(import.meta.env.VITE_TOKEN_EXPIRY || '24'), // hours
  sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '60'), // minutes
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '50'), // MB
  
  // Feature flags
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    realTimeUpdates: import.meta.env.VITE_ENABLE_REAL_TIME_UPDATES === 'true',
    bulkOperations: import.meta.env.VITE_ENABLE_BULK_OPERATIONS === 'true',
    documentVersioning: import.meta.env.VITE_ENABLE_DOCUMENT_VERSIONING === 'true',
    auditTrail: import.meta.env.VITE_ENABLE_AUDIT_TRAIL === 'true'
  },
  
  // Debug settings
  debugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true'
}

// Validation function to check if all required config is present
export const validateFirebaseConfig = (): boolean => {
  const requiredKeys = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]
  
  return requiredKeys.every(key => firebaseConfig[key as keyof typeof firebaseConfig])
}

// Helper function to get the appropriate API URL based on environment
export const getApiUrl = (): string => {
  if (isDevelopment) {
    return `http://localhost:${emulatorConfig.functions.port}/your-project-id/us-central1/api`
  }
  
  return import.meta.env.VITE_API_BASE_URL || `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/api`
}

// Debug helper to log configuration (only in development)
export const logConfig = (): void => {
  if (isDevelopment && appConfig.debugLogs) {
    console.group('🔥 Firebase Configuration')
    console.log('Environment:', isDevelopment ? 'Development' : 'Production')
    console.log('Project ID:', firebaseConfig.projectId)
    console.log('API URL:', getApiUrl())
    console.log('Features:', appConfig.features)
    console.groupEnd()
  }
}

// Initialize Firebase
export const initializeFirebase = () => {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig)
    if (isDevelopment) {
      // Initialize emulators if needed
    }
    return app
  }
  return _getApp()
}

// Get Firebase App instance
export const getApp = () => {
  if (!getApps().length) {
    return initializeFirebase()
  }
  return _getApp()
}

// Get Firebase Storage instance
export const getFirebaseStorage = () => {
  const app = getApp()
  return getStorage(app)
}

// Get Firebase Firestore instance
let firestoreInstance: any = null

export const getFirebaseFirestore = () => {
  if (firestoreInstance) {
    return firestoreInstance
  }
  
  const app = getApp()
  const db = getFirestore(app)
  
  // Connect to emulator in development if not already connected
  if (isDevelopment) {
    try {
      connectFirestoreEmulator(db, emulatorConfig.host, emulatorConfig.firestore.port)
    } catch (error) {
      // Emulator already connected or connection failed, ignore error
      console.log('Firestore emulator connection attempt:', error)
    }
  }
  
  firestoreInstance = db
  return db
}

// Export default configuration
export default {
  firebase: firebaseConfig,
  app: appConfig,
  emulator: emulatorConfig,
  isDevelopment,
  isProduction,
  validate: validateFirebaseConfig,
  getApiUrl,
  logConfig,
  initializeFirebase,
  getApp,
  getFirebaseStorage,
  getFirebaseFirestore
}
