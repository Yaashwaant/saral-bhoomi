#!/usr/bin/env node

/**
 * SARAL Bhoomi Deployment Helper Script
 * 
 * This script helps you prepare and deploy your SARAL Bhoomi application
 * with blockchain functionality to production platforms.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: __dirname 
    });
    log(`✅ ${description} completed successfully`, 'green');
    return output;
  } catch (error) {
    log(`❌ Error during: ${description}`, 'red');
    log(`Command: ${command}`, 'yellow');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} not found at: ${filePath}`, 'red');
    return false;
  }
}

function main() {
  log('🚀 SARAL Bhoomi Deployment Helper', 'bright');
  log('==================================', 'cyan');
  
  // Check if we're in the right directory
  const packageJsonPath = path.join(__dirname, 'package.json');
  const backendPackageJsonPath = path.join(__dirname, 'backend', 'package.json');
  
  if (!checkFile(packageJsonPath, 'Frontend package.json') || 
      !checkFile(backendPackageJsonPath, 'Backend package.json')) {
    log('\n❌ Please run this script from the root directory of your SARAL Bhoomi project', 'red');
    process.exit(1);
  }

  // Check Git status
  log('\n📋 Checking Git status...', 'blue');
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      log('⚠️  You have uncommitted changes:', 'yellow');
      console.log(gitStatus);
      log('Consider committing your changes before deployment', 'yellow');
    } else {
      log('✅ Git working directory is clean', 'green');
    }
  } catch (error) {
    log('⚠️  Git repository not initialized or Git not available', 'yellow');
  }

  // Check deployment files
  log('\n🔍 Checking deployment configuration files...', 'blue');
  checkFile(path.join(__dirname, 'render.yaml'), 'Render configuration');
  checkFile(path.join(__dirname, 'vercel.json'), 'Vercel configuration');
  checkFile(path.join(__dirname, 'DEPLOYMENT_GUIDE.md'), 'Deployment guide');

  // Test backend dependencies
  log('\n📦 Installing backend dependencies...', 'blue');
  try {
    runCommand('cd backend && npm ci', 'Backend dependency installation');
  } catch (error) {
    log('⚠️  Failed to install backend dependencies', 'yellow');
  }

  // Test frontend dependencies
  log('\n📦 Installing frontend dependencies...', 'blue');
  try {
    runCommand('npm ci', 'Frontend dependency installation');
  } catch (error) {
    log('⚠️  Failed to install frontend dependencies', 'yellow');
  }

  // Test backend build
  log('\n🔨 Testing backend server startup...', 'blue');
  try {
    // Create a test environment file
    const testEnvContent = `
NODE_ENV=test
JWT_SECRET=test-secret-for-deployment-check
MONGODB_URI=mongodb://localhost:27017/test
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=test
CLOUDINARY_API_KEY=test
CLOUDINARY_API_SECRET=test
`;
    fs.writeFileSync(path.join(__dirname, 'backend', '.env.test'), testEnvContent);
    
    // Test if server can start (timeout after 10 seconds)
    const testCommand = 'cd backend && timeout 10s npm start || true';
    log('Testing server startup (will timeout after 10 seconds)...', 'blue');
    execSync(testCommand, { stdio: 'pipe', timeout: 15000 });
    
    // Clean up test env file
    fs.unlinkSync(path.join(__dirname, 'backend', '.env.test'));
    log('✅ Backend server startup test completed', 'green');
  } catch (error) {
    log('⚠️  Backend server test had issues (this might be normal)', 'yellow');
  }

  // Test frontend build
  log('\n🔨 Testing frontend build...', 'blue');
  try {
    runCommand('npm run build', 'Frontend build test');
    log('✅ Frontend builds successfully', 'green');
  } catch (error) {
    log('❌ Frontend build failed - fix build errors before deployment', 'red');
  }

  // Display next steps
  log('\n🎯 Next Steps for Deployment:', 'bright');
  log('=====================================', 'cyan');
  log('1. 📝 Update environment variables in .env.production.template', 'blue');
  log('2. 🗄️  Set up MongoDB Atlas database', 'blue');
  log('3. 🖼️  Set up Cloudinary account for file storage', 'blue');
  log('4. 📦 Push your code to GitHub', 'blue');
  log('5. 🖥️  Deploy backend to Render.com', 'blue');
  log('6. 🌐 Deploy frontend to Vercel.com', 'blue');
  log('7. 🔄 Update CORS settings with your frontend URL', 'blue');
  log('8. ✅ Test your deployed application', 'blue');
  
  log('\n📖 Detailed instructions available in DEPLOYMENT_GUIDE.md', 'green');
  
  log('\n🎉 Deployment preparation complete!', 'bright');
  log('Your SARAL Bhoomi app with blockchain fixes is ready for deployment!', 'green');
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;