import { config } from './src/config.js';

console.log('🔍 Checking Frontend Configuration...\n');

console.log('📊 Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VITE_FORCE_DEMO_ANALYTICS:', process.env.VITE_FORCE_DEMO_ANALYTICS);
console.log('- VITE_API_URL:', process.env.VITE_API_URL);
console.log('');

console.log('⚙️ Config Settings:');
console.log('- API_BASE_URL:', config.API_BASE_URL);
console.log('- DEV_MODE:', config.DEV_MODE);
console.log('- FORCE_DEMO_ANALYTICS:', config.FORCE_DEMO_ANALYTICS);
console.log('- DEBUG_ENABLED:', config.DEBUG_ENABLED);
console.log('');

if (config.FORCE_DEMO_ANALYTICS) {
  console.log('⚠️  DEMO MODE IS ENABLED!');
  console.log('   This means the frontend is using demo projects instead of real API data.');
  console.log('   The Railway Overbridge Project might not be in the demo data.');
  console.log('');
  console.log('🔧 To fix this:');
  console.log('   1. Set VITE_FORCE_DEMO_ANALYTICS=0 in your .env file');
  console.log('   2. Or remove the VITE_FORCE_DEMO_ANALYTICS environment variable');
  console.log('   3. Restart the frontend development server');
} else {
  console.log('✅ Demo mode is disabled - frontend should use real API data');
  console.log('   The issue might be elsewhere in the frontend logic.');
}

console.log('');
console.log('🌐 Current API Base URL:', config.API_BASE_URL);
console.log('   Make sure this points to your running backend server.');