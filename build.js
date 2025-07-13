const fs = require('fs');
const path = require('path');

// Read the Firebase config file
const configPath = path.join(__dirname, 'firebase-config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace placeholders with environment variables
const replacements = {
  'FIREBASE_API_KEY_PLACEHOLDER': process.env.FIREBASE_API_KEY,
  'FIREBASE_AUTH_DOMAIN_PLACEHOLDER': process.env.FIREBASE_AUTH_DOMAIN,
  'FIREBASE_PROJECT_ID_PLACEHOLDER': process.env.FIREBASE_PROJECT_ID,
  'FIREBASE_STORAGE_BUCKET_PLACEHOLDER': process.env.FIREBASE_STORAGE_BUCKET,
  'FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER': process.env.FIREBASE_MESSAGING_SENDER_ID,
  'FIREBASE_APP_ID_PLACEHOLDER': process.env.FIREBASE_APP_ID
};

Object.entries(replacements).forEach(([placeholder, value]) => {
  if (value) {
    configContent = configContent.replace(new RegExp(placeholder, 'g'), `"${value}"`);
  }
});

// Write the updated config back
fs.writeFileSync(configPath, configContent);

console.log('Firebase config updated with environment variables'); 