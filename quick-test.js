#!/usr/bin/env node

// Quick test to verify the development environment setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing CryptoMining Platform Setup...\n');

// Test 1: Check if essential files exist
console.log('📁 Checking essential files...');
const essentialFiles = [
  'package.json',
  '.env.example',
  'next.config.mjs',
  'tailwind.config.ts',
  'tsconfig.json'
];

let filesOk = true;
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
    filesOk = false;
  }
});

// Test 2: Check package.json scripts
console.log('\n🔧 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'start', 'type-check'];

  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ npm run ${script}`);
    } else {
      console.log(`❌ npm run ${script} - Missing`);
      filesOk = false;
    }
  });
} catch (error) {
  console.log('❌ Failed to read package.json');
  filesOk = false;
}

// Test 3: Check if .env.local exists
console.log('\n🔐 Checking environment configuration...');
if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local exists');

  // Check if it has been configured
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    if (envContent.includes('your-super-secret') || envContent.includes('username:password')) {
      console.log('⚠️  .env.local needs configuration');
    } else {
      console.log('✅ .env.local appears to be configured');
    }
  } catch (error) {
    console.log('⚠️  Could not read .env.local');
  }
} else {
  console.log('⚠️  .env.local not found - run: cp .env.example .env.local');
}

// Test 4: Check Next.js app directory structure
console.log('\n📂 Checking app directory structure...');
const appDirs = [
  'app',
  'app/api',
  'app/admin',
  'lib'
];

appDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - Missing`);
    filesOk = false;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (filesOk) {
  console.log('🎉 Basic setup looks good!');
  console.log('\n📝 Next steps:');
  console.log('1. Configure .env.local with your database and secrets');
  console.log('2. Run: npm run dev');
  console.log('3. Open: http://localhost:3000');
  console.log('4. Visit admin: http://localhost:3000/admin');
} else {
  console.log('❌ Some issues found. Please fix them before proceeding.');
}

console.log('\n📚 For detailed setup instructions, see:');
console.log('- README.md');
console.log('- SETUP.md');
console.log('\nHappy Development! 🚀');