// test.js
// Comprehensive test suite for LaikaTest Prompts Client with built-in mock server

const http = require('http');
const {
  LaikaTest,
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError
} = require('./index');

// ============================================================================
// MOCK SERVER
// ============================================================================

// Create a simple HTTP mock server for testing
function createMockServer(port = 3999) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const authHeader = req.headers.authorization;

    // Check authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
      return;
    }

    const token = authHeader.substring(7);

    // Invalid API key
    if (token === 'invalid-key') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid API key' }));
      return;
    }

    // Route: GET /api/v1/prompts/by-name/:name
    const match = url.pathname.match(/^\/api\/v1\/prompts\/by-name\/(.+)$/);
    if (match && req.method === 'GET') {
      const promptName = decodeURIComponent(match[1]);
      const projectId = url.searchParams.get('project_id');
      const versionId = url.searchParams.get('version_id');

      // Missing project_id
      if (!projectId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'project_id query parameter is required' }));
        return;
      }

      // Prompt not found
      if (promptName === 'non-existent') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: `Prompt '${promptName}' not found in this project` }));
        return;
      }

      // Access denied
      if (projectId === 'ffffffff-ffff-5fff-8fff-ffffffffffff') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Access denied to this project' }));
        return;
      }

      // Version not found
      if (versionId === 'non-existent-version') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Version not found for this prompt' }));
        return;
      }

      // Success
      const content = versionId
        ? `This is ${promptName} version ${versionId}`
        : `This is the current version of ${promptName}`;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: { content }
      }));
      return;
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  });

  return server;
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

// Assert helper with detailed error messages
function assert(condition, testName, errorMessage = '') {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ✗ ${testName}`);
    if (errorMessage) console.log(`    ${errorMessage}`);
    testsFailed++;
  }
}

// Sleep helper for async tests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TESTS
// ============================================================================

// Test constructor validation
async function testConstructorValidation() {
  console.log('\n1. Constructor Validation Tests');

  try {
    new LaikaTest();
  } catch (e) {
    assert(e instanceof ValidationError, 'Throws ValidationError for missing API key');
  }

  try {
    new LaikaTest('key');
  } catch (e) {
    assert(e instanceof ValidationError, 'Throws ValidationError for missing project ID');
  }

  try {
    new LaikaTest('key', 'invalid-uuid');
  } catch (e) {
    assert(e instanceof ValidationError, 'Throws ValidationError for invalid UUID');
  }

  const validUuid = '12345678-1234-5234-8234-123456789012';
  const client = new LaikaTest('key', validUuid);
  assert(client !== null, 'Creates client with valid parameters');
  client.destroy();
}

// Test successful prompt fetching
async function testSuccessfulFetch(baseUrl) {
  console.log('\n2. Successful Fetch Tests');

  const client = new LaikaTest(
    'valid-api-key',
    '12345678-1234-5234-8234-123456789012',
    { baseUrl, cacheEnabled: false }
  );

  try {
    const result = await client.getPrompt('test-prompt');
    assert(result.content, 'Fetches prompt successfully');
    assert(
      result.content.includes('test-prompt'),
      'Returns correct content',
      `Got: ${result.content}`
    );
  } catch (e) {
    assert(false, 'Should not throw error', e.message);
  }

  // Test prompt names with spaces
  try {
    const result = await client.getPrompt('My Test Prompt');
    assert(result.content, 'Fetches prompt with spaces in name');
    assert(
      result.content.includes('My Test Prompt'),
      'Returns correct content for spaced name'
    );
  } catch (e) {
    assert(false, 'Should handle spaces in prompt names', e.message);
  }

  client.destroy();
}

// Test version-specific fetching
async function testVersionFetching(baseUrl) {
  console.log('\n3. Version-Specific Fetch Tests');

  const client = new LaikaTest(
    'valid-api-key',
    '12345678-1234-5234-8234-123456789012',
    { baseUrl, cacheEnabled: false }
  );

  try {
    const result = await client.getPrompt('test-prompt', {
      versionId: 'version-123'
    });

    assert(result.content, 'Fetches specific version');
    assert(
      result.content.includes('version-123'),
      'Returns correct version content'
    );
  } catch (e) {
    assert(false, 'Should not throw error', e.message);
  }

  client.destroy();
}

// Test error scenarios
async function testErrorScenarios(baseUrl) {
  console.log('\n4. Error Scenario Tests');

  const projectId = '12345678-1234-5234-8234-123456789012';

  // Test authentication error
  const invalidClient = new LaikaTest('invalid-key', projectId, { baseUrl });
  try {
    await invalidClient.getPrompt('test-prompt');
    assert(false, 'Should throw AuthenticationError');
  } catch (e) {
    assert(
      e instanceof AuthenticationError,
      'Throws AuthenticationError for invalid key',
      `Got: ${e.constructor.name} - ${e.message}`
    );
  }
  invalidClient.destroy();

  // Test validation error
  const validClient = new LaikaTest('valid-key', projectId, { baseUrl });
  try {
    await validClient.getPrompt('');
    assert(false, 'Should throw ValidationError');
  } catch (e) {
    assert(e instanceof ValidationError, 'Throws ValidationError for empty prompt name');
  }

  // Test 404 error
  try {
    await validClient.getPrompt('non-existent');
    assert(false, 'Should throw LaikaServiceError for 404');
  } catch (e) {
    assert(
      e instanceof LaikaServiceError && e.statusCode === 404,
      'Throws LaikaServiceError with 404 for missing prompt',
      `Got: ${e.constructor.name} (status: ${e.statusCode}) - ${e.message}`
    );
  }

  // Test 403 error
  const forbiddenProjectId = 'ffffffff-ffff-5fff-8fff-ffffffffffff';
  const forbiddenClient = new LaikaTest(
    'valid-key',
    forbiddenProjectId,
    { baseUrl }
  );
  try {
    await forbiddenClient.getPrompt('test-prompt');
    assert(false, 'Should throw LaikaServiceError for 403');
  } catch (e) {
    assert(
      e instanceof LaikaServiceError && e.statusCode === 403,
      'Throws LaikaServiceError with 403 for access denied',
      `Got: ${e.constructor.name} (status: ${e.statusCode}) - ${e.message}`
    );
  }
  forbiddenClient.destroy();

  validClient.destroy();
}

// Test caching behavior
async function testCaching(baseUrl) {
  console.log('\n5. Caching Behavior Tests');

  const client = new LaikaTest(
    'valid-api-key',
    '12345678-1234-5234-8234-123456789012',
    { baseUrl, cacheTTL: 2000 }
  );

  // First fetch (from API)
  const result1 = await client.getPrompt('cached-prompt');
  assert(result1.content, 'First fetch successful');

  // Second fetch (from cache)
  const result2 = await client.getPrompt('cached-prompt');
  assert(
    result2.content === result1.content,
    'Second fetch returns same content (from cache)'
  );

  // Test cache expiration
  await sleep(2100); // Wait for cache to expire

  const result3 = await client.getPrompt('cached-prompt');
  assert(result3.content, 'Expired cache successfully refetches from API');

  client.destroy();
}

// Test cache bypass
async function testCacheBypass(baseUrl) {
  console.log('\n6. Cache Bypass Tests');

  const client = new LaikaTest(
    'valid-api-key',
    '12345678-1234-5234-8234-123456789012',
    { baseUrl }
  );

  // Warm up cache
  await client.getPrompt('bypass-test');

  // Bypass cache (should not throw error)
  const result = await client.getPrompt('bypass-test', { bypassCache: true });

  assert(result && result.content, 'Bypass cache successfully fetches from API');
  assert(result.content.includes('bypass-test'), 'Returns correct content when bypassing cache');

  client.destroy();
}

// Test disabled caching
async function testDisabledCaching(baseUrl) {
  console.log('\n7. Disabled Caching Tests');

  const client = new LaikaTest(
    'valid-api-key',
    '12345678-1234-5234-8234-123456789012',
    { baseUrl, cacheEnabled: false }
  );

  const start1 = Date.now();
  await client.getPrompt('no-cache-test');
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  await client.getPrompt('no-cache-test');
  const time2 = Date.now() - start2;

  assert(
    Math.abs(time1 - time2) < 20,
    'Both fetches take similar time (no caching)',
    `First: ${time1}ms, Second: ${time2}ms`
  );

  client.destroy();
}

// Test cleanup
async function testCleanup() {
  console.log('\n8. Cleanup Tests');

  const client = new LaikaTest(
    'valid-key',
    '12345678-1234-5234-8234-123456789012'
  );

  client.destroy();

  assert(
    client.cache === null || client.cache.cleanupInterval === null,
    'Destroy cleans up cache interval'
  );
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  LaikaTest Prompts Client - Test Suite                ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const PORT = 3999;
  const baseUrl = `http://localhost:${PORT}`;
  const server = createMockServer(PORT);

  // Start mock server
  await new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`\n✓ Mock server started on port ${PORT}\n`);
      resolve();
    });
  });

  try {
    // Run all tests
    await testConstructorValidation();
    await testSuccessfulFetch(baseUrl);
    await testVersionFetching(baseUrl);
    await testErrorScenarios(baseUrl);
    await testCaching(baseUrl);
    await testCacheBypass(baseUrl);
    await testDisabledCaching(baseUrl);
    await testCleanup();

    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`✓ Passed: ${testsPassed}`);
    console.log(`✗ Failed: ${testsFailed}`);
    console.log('═'.repeat(60) + '\n');

    if (testsFailed === 0) {
      console.log('🎉 All tests passed!\n');
    } else {
      console.log('❌ Some tests failed. Please review the output above.\n');
      process.exit(1);
    }
  } finally {
    // Stop mock server
    server.close(() => {
      console.log('✓ Mock server stopped\n');
    });
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
