// Frontend Environment Configuration
// This file configures the API URL for the MongoDB Backend

// Get API base URL from environment or use default
const getApiBaseUrl = () => {
  // Check if we're in a browser environment and on a production domain
  const isProductionDomain = typeof window !== 'undefined' && 
    (window.location.hostname.includes('onrender.com') || 
     window.location.hostname.includes('netlify.app') ||
     window.location.hostname.includes('vercel.app'));
  
  // In production or on production domains, use relative API path
  if (import.meta.env.PROD || isProductionDomain) {
    // Prefer relative '/api' to leverage platform rewrite rules
    return import.meta.env.VITE_API_URL || '/api';
  }
  
  // In development, prefer localhost backend if running locally
  const devHosts = new Set(['localhost', '127.0.0.1']);
  const isLocal = typeof window !== 'undefined' && devHosts.has(window.location.hostname);
  const localApi = 'http://localhost:5000/api';
  return import.meta.env.VITE_API_URL || (isLocal ? localApi : '/api');
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
