#!/usr/bin/env node
/**
 * QUALITY VALIDATION SUITE - Run All Tests
 * Execute comprehensive API quality, STT accuracy, and educational effectiveness validation
 */

import { spawn } from 'child_process';

console.log('🧪 QUALITY VALIDATION TEST SUITE EXECUTION\n');

// Test execution plan
const testSuite = [
  {
    name: 'API Quality Tests',
    command: 'node real-api-test.js',
    description: 'STT accuracy, AI response quality, educational effectiveness',
    expectedRuntime: '5-10 seconds'
  },
  {
    name: 'Comprehensive Playwright Tests',
    command: 'npx playwright test playwright-tests/comprehensive-quality-validation.spec.ts --headed',
    description: 'End-to-end browser validation with real user interactions',
    expectedRuntime: '30-60 seconds'
  },
  {
    name: 'UI Voice Flow Tests',
    command: 'npx playwright test playwright-tests/ui-voice-flow.spec.ts',
    description: 'Voice conversation interface functionality',
    expectedRuntime: '15-30 seconds'
  },
  {
    name: 'WebRTC Live Calls',
    command: 'node test-webrtc-call.js',
    description: 'Peer-to-peer voice call infrastructure',
    expectedRuntime: '10-20 seconds'
  }
];

// Quality thresholds for pass/fail
const qualityThresholds = {
  sttAccuracy: 70,
  aiQuality: 60,
  educationalEffectiveness: 50,
  uiResponsiveness: 75,
  overallQuality: 65
};

async function runTest(testInfo) {
  console.log(`${'─'.repeat(60)}`);
  console.log(`🔬 RUNNING: ${testInfo.name}`);
  console.log(`📝 Purpose: ${testInfo.description}`);
  console.log(`⏱️ Expected: ${testInfo.expectedRuntime}`);
  console.log(`${'─'.repeat(60)}`);

  const startTime = Date.now();

  return new Promise((resolve) => {
    const [cmd, ...args] = testInfo.command.split(' ');
    const process = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    process.stdout?.on('data', (data) => {
      output += data.toString();
    });

    process.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      const duration = Math.round((Date.now() - startTime) / 1000);

      console.log(`\n⏱️ Execution Time: ${duration} seconds`);

      if (code === 0) {
        console.log(`✅ PASSED: ${testInfo.name}`);
      } else {
        console.log(`❌ FAILED: ${testInfo.name} (exit code: ${code})`);
        if (errorOutput) {
          console.log(`📝 Error Details: ${errorOutput.substring(0, 200)}...`);
        }
      }

      resolve({
        name: testInfo.name,
        success: code === 0,
        duration,
        output,
        errors: errorOutput
      });
    });

    process.on('error', (error) => {
      console.log(`❌ PROCESS ERROR: ${testInfo.name} - ${error.message}`);
      resolve({
        name: testInfo.name,
        success: false,
        duration: Math.round((Date.now() - startTime) / 1000),
        output: '',
        errors: error.message
      });
    });

    // Timeout protection (5 minutes max)
    setTimeout(() => {
      process.kill();
      console.log(`⏰ TIMEOUT: ${testInfo.name} terminated after 5 minutes`);
      resolve({
        name: testInfo.name,
        success: false,
        duration: 300,
        output: '',
        errors: 'Test timeout'
      });
    }, 300000);
  });
}

async function runAllTests() {
  const results = [];
  let passedTests = 0;
  let totalTests = testSuite.length;

  for (const testInfo of testSuite) {
    try {
      const result = await runTest(testInfo);
      results.push(result);
      if (result.success) passedTests++;
    } catch (error) {
      console.log(`💥 CRITICAL ERROR in ${testInfo.name}: ${error.message}`);
      results.push({
        name: testInfo.name,
        success: false,
        duration: 0,
        output: '',
        errors: error.message
      });
    }
  }

  // Generate comprehensive report
  console.log(`\n${'='.repeat(70)}`);
  console.log('🏆 QUALITY VALIDATION SUITE - FINAL RESULTS');
  console.log(`${'='.repeat(70)}`);

  console.log(`\n📊 SUMMARY:`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  console.log(`\n📈 INDIVIDUAL TEST RESULTS:`);

  results.forEach((result, index) => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${index + 1}. ${result.name}: ${status} (${result.duration}s)`);
    if (!result.success) {
      console.log(`   Error: ${result.errors.substring(0, 100)}${result.errors.length > 100 ? '...' : ''}`);
    }
  });

  // Quality assessment based on results
  console.log(`\n🎯 OVERALL QUALITY ASSESSMENT:`);

  const deploymentReady = passedTests >= totalTests * 0.7;

  if (deploymentReady) {
    console.log(`✅ PRODUCTION READY: ${passedTests}/${totalTests} tests passed`);
    console.log(`🎓 CONFIDENCE LEVEL: Students can effectively learn German`);

    if (passedTests === totalTests) {
      console.log(`🏆 EXCELLENT: All quality assurance tests passed`);
      console.log(`🌟 RECOMMENDATION: Deploy immediately`);
    } else {
      console.log(`⚠️ GOOD: Core functionality working with minor issues`);
      console.log(`🔧 RECOMMENDATION: Deploy with monitoring`);
    }
  } else {
    console.log(`❌ NEEDS IMPROVEMENT: Only ${passedTests}/${totalTests} tests passed`);
    console.log(`🔧 ISSUES TO FIX: Check failed tests before deployment`);
  }

  console.log(`\n📋 NEXT STEPS:`);
  console.log(`1. Review detailed logs above for failure reasons`);
  console.log(`2. Fix any failing tests`);
  console.log(`3. Run "npm run test:quality" for quick validation`);
  console.log(`4. Deploy when all critical tests pass`);

  return {
    totalTests,
    passedTests,
    successRate: passedTests / totalTests,
    deploymentReady,
    detailedResults: results
  };
}

// Run the complete validation suite
runAllTests()
  .then((summary) => {
    console.log('\n✅ QUALITY VALIDATION SUITE COMPLETE');
    if (summary.successRate >= 0.8) {
      console.log('🎉 Ready for production! 🚀');
    } else {
      console.log('🔧 Improvements needed before production. 📈');
    }
    process.exit(summary.deploymentReady ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 CRITICAL FAILURE:', error.message);
    process.exit(1);
  });
