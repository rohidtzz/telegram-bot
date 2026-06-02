#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a secure random JWT secret
function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Get .env file path
const envPath = path.join(__dirname, '..', '.env');

function updateEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const envContent = fs.readFileSync(filePath, 'utf-8');
  const lines = envContent.split('\n');
  
  let jwtSecretFound = false;
  let jwtRefreshSecretFound = false;
  let webhookSecretFound = false;
  
  const updatedLines = lines.map((line) => {
    if (line.startsWith('JWT_SECRET=') && !line.includes('JWT_REFRESH_SECRET')) {
      jwtSecretFound = true;
      const newSecret = generateSecret();
      console.log(`✅ Generated JWT_SECRET`);
      console.log(`   Length: ${newSecret.length} characters`);
      return `JWT_SECRET=${newSecret}`;
    }
    if (line.startsWith('JWT_REFRESH_SECRET=')) {
      jwtRefreshSecretFound = true;
      const newSecret = generateSecret();
      console.log(`✅ Generated JWT_REFRESH_SECRET`);
      console.log(`   Length: ${newSecret.length} characters`);
      return `JWT_REFRESH_SECRET=${newSecret}`;
    }
    if (line.startsWith('WEBHOOK_SECRET=')) {
      webhookSecretFound = true;
      const newSecret = generateSecret();
      console.log(`✅ Generated WEBHOOK_SECRET`);
      console.log(`   Length: ${newSecret.length} characters`);
      return `WEBHOOK_SECRET=${newSecret}`;
    }
    return line;
  });

  if (!jwtSecretFound) {
    console.warn(`⚠️  JWT_SECRET not found in ${filePath}, adding it...`);
    const newSecret = generateSecret();
    updatedLines.push(`JWT_SECRET=${newSecret}`);
    console.log(`✅ Added JWT_SECRET`);
    console.log(`   Length: ${newSecret.length} characters`);
  }

  if (!jwtRefreshSecretFound) {
    console.warn(`⚠️  JWT_REFRESH_SECRET not found in ${filePath}, adding it...`);
    const newSecret = generateSecret();
    updatedLines.push(`JWT_REFRESH_SECRET=${newSecret}`);
    console.log(`✅ Added JWT_REFRESH_SECRET`);
    console.log(`   Length: ${newSecret.length} characters`);
  }

  if (!webhookSecretFound) {
    console.warn(`⚠️  WEBHOOK_SECRET not found in ${filePath}, adding it...`);
    const newSecret = generateSecret();
    updatedLines.push(`WEBHOOK_SECRET=${newSecret}`);
    console.log(`✅ Added WEBHOOK_SECRET`);
    console.log(`   Length: ${newSecret.length} characters`);
  }

  fs.writeFileSync(filePath, updatedLines.join('\n'));
  return true;
}

console.log('🔐 Generating JWT Secrets...\n');

// Update .env file
const envUpdated = updateEnvFile(envPath);

if (envUpdated) {
  console.log(`\n✅ .env file updated: ${envPath}`);
  console.log('   Make sure this file is NOT committed to git!');
}

// Also show note about .env.example
console.log(`\nℹ️  Keep .env.example with placeholder values (do not commit real secrets)`);
console.log(`\n📝 Generated Secrets:`);
console.log(`   - JWT_SECRET: For access token signing`);
console.log(`   - JWT_REFRESH_SECRET: For refresh token signing`);
console.log(`   - WEBHOOK_SECRET: For webhook verification (optional)`);
console.log(`\n⏱️  Token Expiration:`);
console.log(`   - ACCESS_TOKEN_EXPIRES_IN=5m (or 5m, 1h, etc)`);
console.log(`   - REFRESH_TOKEN_EXPIRES_IN=7d (or 30d, 14d, etc)`);
