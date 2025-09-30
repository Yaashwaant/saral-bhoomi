// Frontend Environment Configuration
// This file configures the API URL for the MongoDB Backend

// Get API base URL from environment or use default
const getApiBaseUrl = () => {
  // In production, use the environment variable or default backend URL
  if (import.meta.env.PROD) {
    // Prefer relative '/api' to leverage platform rewrite rules
    return import.meta.env.VITE_API_URL || '/api';
  }
  // In development, prefer localhost backend if running locally; fallback to env or Render
  const devHosts = new Set(['localhost', '127.0.0.1']);
  const isLocal = typeof window !== 'undefined' && devHosts.has(window.location.hostname);
  const localApi = 'http://localhost:5000/api';
  return import.meta.env.VITE_API_URL || (isLocal ? localApi : 'https://saral-bhoomi-1.onrender.com/api');
};

export const config = {
  // API Base URL for MongoDB Backend - uses env or local in dev
  API_BASE_URL: getApiBaseUrl(),
  
  // Development Settings
  DEV_MODE: !import.meta.env.PROD,
  DEBUG_ENABLED: !import.meta.env.PROD,
  
  // Force demo-mode analytics in any environment (set VITE_FORCE_DEMO_ANALYTICS=1)
  FORCE_DEMO_ANALYTICS: !!(import.meta.env.VITE_FORCE_DEMO_ANALYTICS && import.meta.env.VITE_FORCE_DEMO_ANALYTICS !== '0' && import.meta.env.VITE_FORCE_DEMO_ANALYTICS !== 'false'),
  
  // Feature Flags
  ENABLE_BLOCKCHAIN: true,
  ENABLE_ANALYTICS: true,
  ENABLE_SMS: true,
  ENABLE_DEMO_PENDING_REASON: true,
  
  // External Services (if needed)
  FIREBASE_CONFIG: 'your_firebase_config_here',
  SMS_API_KEY: 'your_sms_api_key_here'
};

// For Vite environment variable compatibility
if (typeof window !== 'undefined') {
  window.ENV_CONFIG = config;
}
