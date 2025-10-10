#!/usr/bin/env node

/**
 * Production Smoke Tests
 * Verifies security headers, CORS, and HTTPS redirects
 * Run: npm run smoke-test
 */

import { config } from './config';

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[36m',
  RESET: '\x1b[0m'
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

async function testSecurityHeaders(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  try {
    const response = await fetch(baseUrl);
    const headers = response.headers;
    
    // Test 1: X-Content-Type-Options
    results.push({
      name: 'X-Content-Type-Options',
      passed: headers.get('X-Content-Type-Options') === 'nosniff',
      message: `Expected: nosniff, Got: ${headers.get('X-Content-Type-Options')}`
    });
    
    // Test 2: X-Frame-Options
    results.push({
      name: 'X-Frame-Options',
      passed: headers.get('X-Frame-Options') === 'DENY',
      message: `Expected: DENY, Got: ${headers.get('X-Frame-Options')}`
    });
    
    // Test 3: X-XSS-Protection
    results.push({
      name: 'X-XSS-Protection',
      passed: headers.get('X-XSS-Protection') === '1; mode=block',
      message: `Expected: 1; mode=block, Got: ${headers.get('X-XSS-Protection')}`
    });
    
    // Test 4: Referrer-Policy
    results.push({
      name: 'Referrer-Policy',
      passed: headers.get('Referrer-Policy') === 'strict-origin-when-cross-origin',
      message: `Expected: strict-origin-when-cross-origin, Got: ${headers.get('Referrer-Policy')}`
    });
    
    // Test 5: HSTS (production only)
    if (baseUrl.startsWith('https://')) {
      const hstsHeader = headers.get('Strict-Transport-Security');
      results.push({
        name: 'HSTS (Production)',
        passed: hstsHeader?.includes('max-age=31536000') || false,
        message: `Expected: max-age=31536000, Got: ${hstsHeader}`
      });
    }
    
  } catch (error) {
    results.push({
      name: 'Security Headers Test',
      passed: false,
      message: `Failed to fetch: ${error}`
    });
  }
  
  return results;
}

async function testCORS(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const allowedOrigins = [
    'https://akm-labs.com',
    'https://www.akm-labs.com'
  ];
  
  for (const origin of allowedOrigins) {
    try {
      const response = await fetch(baseUrl, {
        headers: { 'Origin': origin }
      });
      
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      results.push({
        name: `CORS for ${origin}`,
        passed: corsHeader === origin,
        message: `Expected: ${origin}, Got: ${corsHeader}`
      });
      
    } catch (error) {
      results.push({
        name: `CORS for ${origin}`,
        passed: false,
        message: `Failed: ${error}`
      });
    }
  }
  
  return results;
}

async function testAPIEndpoint(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    results.push({
      name: 'API Health Check',
      passed: response.ok,
      message: `Status: ${response.status} ${response.statusText}`
    });
  } catch (error) {
    results.push({
      name: 'API Health Check',
      passed: false,
      message: `Failed: ${error}`
    });
  }
  
  return results;
}

async function testHTTPSRedirect(httpUrl: string): Promise<TestResult> {
  try {
    const response = await fetch(httpUrl, { redirect: 'manual' });
    const location = response.headers.get('Location');
    
    return {
      name: 'HTTPS Redirect',
      passed: response.status === 301 && location?.startsWith('https://') || false,
      message: `Status: ${response.status}, Location: ${location}`
    };
  } catch (error) {
    return {
      name: 'HTTPS Redirect',
      passed: false,
      message: `Failed: ${error}`
    };
  }
}

function printResults(category: string, results: TestResult[]) {
  console.log(`\n${COLORS.BLUE}=== ${category} ===${COLORS.RESET}`);
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? COLORS.GREEN : COLORS.RED;
    console.log(`${icon} ${color}${result.name}${COLORS.RESET}: ${result.message}`);
  });
}

async function runSmokeTests() {
  const isProduction = config.get('NODE_ENV') === 'production';
  const baseUrl = isProduction 
    ? 'https://akm-labs.com'
    : 'http://localhost:5000';
  
  console.log(`${COLORS.YELLOW}🚀 Running Smoke Tests${COLORS.RESET}`);
  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`Base URL: ${baseUrl}\n`);
  
  const allResults: TestResult[] = [];
  
  // Test 1: Security Headers
  const securityResults = await testSecurityHeaders(baseUrl);
  printResults('Security Headers', securityResults);
  allResults.push(...securityResults);
  
  // Test 2: CORS (production only)
  if (isProduction) {
    const corsResults = await testCORS(baseUrl);
    printResults('CORS Configuration', corsResults);
    allResults.push(...corsResults);
  }
  
  // Test 3: API Health
  const apiResults = await testAPIEndpoint(baseUrl);
  printResults('API Endpoints', apiResults);
  allResults.push(...apiResults);
  
  // Test 4: HTTPS Redirect (production only)
  if (isProduction) {
    const redirectResult = await testHTTPSRedirect('http://akm-labs.com');
    printResults('HTTPS Redirect', [redirectResult]);
    allResults.push(redirectResult);
  }
  
  // Summary
  const passed = allResults.filter(r => r.passed).length;
  const total = allResults.length;
  const failed = total - passed;
  
  console.log(`\n${COLORS.BLUE}=== Summary ===${COLORS.RESET}`);
  console.log(`Total: ${total} | ${COLORS.GREEN}Passed: ${passed}${COLORS.RESET} | ${failed > 0 ? COLORS.RED : COLORS.GREEN}Failed: ${failed}${COLORS.RESET}`);
  
  // Exit with error code if any tests failed
  if (failed > 0) {
    console.log(`\n${COLORS.RED}⚠️  Some tests failed. Please review the results above.${COLORS.RESET}`);
    process.exit(1);
  } else {
    console.log(`\n${COLORS.GREEN}✅ All tests passed!${COLORS.RESET}`);
    process.exit(0);
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error(`${COLORS.RED}Fatal error:${COLORS.RESET}`, error);
  process.exit(1);
});
