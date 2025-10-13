#!/usr/bin/env node

// Simple test script to verify dev mode functionality
const { devModeManager, DICE_STREAK_CONFIGS } = require('./config/devMode.ts');

console.log('Testing Dice Streak Dev Mode...\n');

// Test initial state
console.log('1. Initial state:');
console.log(`   Dev Mode: ${devModeManager.getIsDevMode()}`);
console.log(`   Contract: ${devModeManager.getCurrentContractName()}`);
console.log(`   Address: ${devModeManager.getCurrentContractAddress()}\n`);

// Test toggle to dev mode
console.log('2. Toggling to dev mode:');
devModeManager.toggleDevMode();
console.log(`   Dev Mode: ${devModeManager.getIsDevMode()}`);
console.log(`   Contract: ${devModeManager.getCurrentContractName()}`);
console.log(`   Address: ${devModeManager.getCurrentContractAddress()}\n`);

// Test toggle back to production
console.log('3. Toggling back to production:');
devModeManager.toggleDevMode();
console.log(`   Dev Mode: ${devModeManager.getIsDevMode()}`);
console.log(`   Contract: ${devModeManager.getCurrentContractName()}`);
console.log(`   Address: ${devModeManager.getCurrentContractAddress()}\n`);

// Test configuration
console.log('4. Configuration verification:');
console.log(`   Production contract: ${DICE_STREAK_CONFIGS.production.contractAddress}`);
console.log(`   Dev contract: ${DICE_STREAK_CONFIGS.dev.contractAddress}`);
console.log(`   Network: ${DICE_STREAK_CONFIGS.network.name}\n`);

console.log('✅ Dev mode test completed successfully!');
