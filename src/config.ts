// Frontend Environment Configuration
// This file configures the API URL for the MongoDB Backend

// Get API base URL from environment or use default
const getApiBaseUrl = () => {
  // Always check for explicit environment variable first (support both Vite and React naming)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.REACT_APP_API_URL) {
    return import.meta.env.REACT_APP_API_URL;
  }
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Special handling for saral-bhoomi-2.onrender.com (frontend) -> saral-bhoomi-1.onrender.com (backend)
    if (hostname === 'saral-bhoomi-2.onrender.com') {
      return 'https://saral-bhoomi-1.onrender.com/api';
    }
    
    // Other production domains should use relative paths to leverage rewrite rules
    const isProductionDomain = hostname.includes('onrender.com') || 
                              hostname.includes('netlify.app') ||
                              hostname.includes('vercel.app') ||
                              hostname.includes('github.io') ||
                              (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'));
    
    if (isProductionDomain) {
      return '/api';
    }
    
    // Local development - use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  
  // Fallback for production builds or server-side rendering
  if (import.meta.env.PROD) {
    // Check if this is the saral-bhoomi-2 deployment
    if (typeof window !== 'undefined' && window.location.hostname === 'saral-bhoomi-2.onrender.com') {
      return 'https://saral-bhoomi-1.onrender.com/api';
    }
    return '/api';
  }
  
  // Default fallback
  return 'http://localhost:5000/api';
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
