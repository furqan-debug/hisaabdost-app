#!/usr/bin/env node

/**
 * Setup Validation Script
 * Validates the development environment before running the app
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}▶  ${msg}${colors.reset}`),
};

let hasErrors = false;

// Check Node.js version
function checkNodeVersion() {
  log.step('Checking Node.js version...');
  
  const requiredVersion = '20.15.0';
  const currentVersion = process.version.slice(1); // Remove 'v' prefix
  
  const nvmrcPath = path.join(process.cwd(), '.nvmrc');
  if (fs.existsSync(nvmrcPath)) {
    const nvmrcVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();
    
    if (currentVersion === nvmrcVersion) {
      log.success(`Node.js version ${currentVersion} matches .nvmrc`);
    } else {
      log.warning(`Node.js version mismatch. Current: ${currentVersion}, Required: ${nvmrcVersion}`);
      log.info('Run: nvm use');
    }
  } else {
    log.warning('.nvmrc file not found');
  }
}

// Check if .env file exists
function checkEnvFile() {
  log.step('Checking environment configuration...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found!');
    if (fs.existsSync(envExamplePath)) {
      log.info('Create .env file by copying .env.example:');
      log.info('  cp .env.example .env');
    }
    hasErrors = true;
    return;
  }
  
  log.success('.env file exists');
  
  // Check required environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID',
  ];
  
  const missingVars = [];
  const placeholderVars = [];
  
  requiredVars.forEach((varName) => {
    const regex = new RegExp(`${varName}=(.+)`);
    const match = envContent.match(regex);
    
    if (!match) {
      missingVars.push(varName);
    } else {
      const value = match[1].trim();
      if (
        !value ||
        value.includes('your_') ||
        value.includes('your-') ||
        value.includes('here')
      ) {
        placeholderVars.push(varName);
      }
    }
  });
  
  if (missingVars.length > 0) {
    log.error(`Missing environment variables: ${missingVars.join(', ')}`);
    hasErrors = true;
  }
  
  if (placeholderVars.length > 0) {
    log.warning(`Environment variables still have placeholder values: ${placeholderVars.join(', ')}`);
    log.info('Update these with your actual Supabase credentials');
    log.info('Get them from: https://supabase.com/dashboard/project/_/settings/api');
  }
  
  if (missingVars.length === 0 && placeholderVars.length === 0) {
    log.success('All required environment variables are configured');
  }
}

// Check if node_modules exists
function checkDependencies() {
  log.step('Checking dependencies...');
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log.error('node_modules not found!');
    log.info('Run: npm install');
    hasErrors = true;
    return;
  }
  
  log.success('Dependencies are installed');
  
  // Check if package-lock.json exists
  const lockfilePath = path.join(process.cwd(), 'package-lock.json');
  if (!fs.existsSync(lockfilePath)) {
    log.warning('package-lock.json not found. This may cause dependency version issues.');
    log.info('Run: npm install (this will generate package-lock.json)');
  }
}

// Check Capacitor setup (optional)
function checkCapacitor() {
  log.step('Checking Capacitor setup...');
  
  const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.ts');
  
  if (!fs.existsSync(capacitorConfigPath)) {
    log.info('Capacitor not configured (optional for web-only development)');
    return;
  }
  
  log.success('Capacitor configuration found');
  
  const androidPath = path.join(process.cwd(), 'android');
  if (fs.existsSync(androidPath)) {
    log.success('Android platform added');
  } else {
    log.info('Android platform not added yet. Run: npx cap add android');
  }
}

// Main validation
function main() {
  console.log('\n' + '='.repeat(60));
  log.info('HisaabDost - Setup Validation');
  console.log('='.repeat(60) + '\n');
  
  checkNodeVersion();
  console.log('');
  
  checkEnvFile();
  console.log('');
  
  checkDependencies();
  console.log('');
  
  checkCapacitor();
  console.log('');
  
  console.log('='.repeat(60));
  
  if (hasErrors) {
    log.error('Setup validation failed! Please fix the errors above.');
    console.log('');
    process.exit(1);
  } else {
    log.success('Setup validation passed! You\'re ready to develop.');
    console.log('');
    log.info('Start development server: npm run dev');
    console.log('');
    process.exit(0);
  }
}

main();
