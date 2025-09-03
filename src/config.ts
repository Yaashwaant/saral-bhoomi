// Frontend Environment Configuration
// This file configures the API URL for the MongoDB Backend

export const config = {
  // API Base URL for MongoDB Backend
  API_BASE_URL: '/api',
  
  // Development Settings
  DEV_MODE: true,
  DEBUG_ENABLED: true,
  
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
