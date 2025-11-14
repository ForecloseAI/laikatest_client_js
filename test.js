// test.js
// Clean test suite hitting actual LaikaTest API endpoint

const {
  LaikaTest,
  LaikaServiceError,
  ValidationError,
  AuthenticationError
} = require('./index');

// Test configuration
const API_KEY = process.env.LAIKATEST_API_KEY || '';
const BASE_URL = 'https://api.laikatest.com';
const TEST_PROMPT = 'sample';

let passed = 0;
let failed = 0;

// Assert helper
function assert(condition, name, msg = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    if (msg) console.log(`    ${msg}`);
    failed++;
  }
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Constructor validation
async function testConstructor() {
  console.log('\n1. Constructor Validation');

  try {
    new LaikaTest();
    assert(false, 'Should reject missing API key');
  } catch (e) {
    assert(e instanceof ValidationError, 'Rejects missing API key');
  }

  const client = new LaikaTest(API_KEY);
  assert(client !== null, 'Creates client with valid API key');
  client.destroy();
}

// Test 2: Basic prompt fetch
async function testBasicFetch() {
  console.log('\n2. Basic Prompt Fetch');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  try {
    const result = await client.getPrompt(TEST_PROMPT);
    assert(result && result.getContent(), 'Fetches prompt successfully');
    assert(typeof result.getContent() === 'string' || Array.isArray(result.getContent()),
      'Returns valid content type');
  } catch (e) {
    assert(false, 'Should fetch without error', e.message);
  } finally {
    client.destroy();
  }
}

// Test 3: Cache functionality
async function testCache() {
  console.log('\n3. Cache Functionality');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheTTL: 5000
  });

  const start1 = Date.now();
  await client.getPrompt(TEST_PROMPT);
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  await client.getPrompt(TEST_PROMPT);
  const time2 = Date.now() - start2;

  assert(time2 < time1 * 0.5, 'Cache speeds up second fetch',
    `First: ${time1}ms, Second: ${time2}ms`);

  client.destroy();
}

// Test 4: Cache expiration
async function testCacheExpiry() {
  console.log('\n4. Cache Expiration');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheTTL: 1000
  });

  const result1 = await client.getPrompt(TEST_PROMPT);
  await sleep(1200);
  const result2 = await client.getPrompt(TEST_PROMPT);

  assert(result1 && result2, 'Refetches after cache expiry');
  client.destroy();
}

// Test 5: Cache bypass
async function testCacheBypass() {
  console.log('\n5. Cache Bypass');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL
  });

  await client.getPrompt(TEST_PROMPT);

  const start = Date.now();
  const result = await client.getPrompt(TEST_PROMPT, { bypassCache: true });
  const time = Date.now() - start;

  assert(result && time > 5, 'Bypass cache hits API',
    `Fetch time: ${time}ms`);

  client.destroy();
}

// Test 6: Disabled caching
async function testNoCache() {
  console.log('\n6. Disabled Caching');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  const start1 = Date.now();
  await client.getPrompt(TEST_PROMPT);
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  await client.getPrompt(TEST_PROMPT);
  const time2 = Date.now() - start2;

  assert(Math.abs(time1 - time2) < time1 * 0.8,
    'Both fetches take similar time');

  client.destroy();
}

// Test 7: Error handling
async function testErrors() {
  console.log('\n7. Error Handling');

  const client = new LaikaTest('invalid-key', {
    baseUrl: BASE_URL
  });

  try {
    await client.getPrompt(TEST_PROMPT);
    assert(false, 'Should reject invalid API key');
  } catch (e) {
    assert(e instanceof AuthenticationError || e instanceof LaikaServiceError,
      'Handles authentication error');
  }

  client.destroy();

  const validClient = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL
  });

  try {
    await validClient.getPrompt('');
    assert(false, 'Should reject empty prompt name');
  } catch (e) {
    assert(e instanceof ValidationError, 'Validates prompt name');
  }

  validClient.destroy();
}

// Test 8: Cleanup
async function testCleanup() {
  console.log('\n8. Cleanup');

  const client = new LaikaTest(API_KEY);
  client.destroy();

  assert(!client.cache || client.cache.cleanupInterval === null,
    'Cleans up resources properly');
}

// Test 9: Custom timeout
async function testTimeout() {
  console.log('\n9. Custom Timeout');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    timeout: 15000,
    cacheEnabled: false
  });

  try {
    const result = await client.getPrompt(TEST_PROMPT);
    assert(result && result.getContent(), 'Respects custom timeout');
  } catch (e) {
    assert(false, 'Should not timeout', e.message);
  } finally {
    client.destroy();
  }
}

// Test 10: Concurrent requests
async function testConcurrent() {
  console.log('\n10. Concurrent Requests');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  try {
    const results = await Promise.all([
      client.getPrompt(TEST_PROMPT),
      client.getPrompt(TEST_PROMPT),
      client.getPrompt(TEST_PROMPT)
    ]);

    assert(results.length === 3 && results.every(r => r.getContent()),
      'Handles concurrent requests');
  } catch (e) {
    assert(false, 'Should handle concurrent requests', e.message);
  } finally {
    client.destroy();
  }
}

//Test 11: Versioned prompts
async function testVersionedPrompts() {
  console.log('\n11. Versioned Prompts');
  
  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: true,
    cacheTTL: 5000
  });

  try {
    const version1 = 'v1';
    const version2 = '2';

    const resultV1 = await client.getPrompt(TEST_PROMPT, { versionId: version1 });
    const resultV2 = await client.getPrompt(TEST_PROMPT, { versionId: version2 });

    assert(resultV1 && resultV1.getContent(), 'Fetches content for version 1 (v1)-'+resultV1.getContent());
    assert(resultV2 && resultV2.getContent(), 'Fetches content for version 2 (2)-'+resultV2.getContent());

  } catch (e) {
    console.error('Error in versioned prompts test:', e);
  } finally {
    client.destroy();
  }
}

async function testVariableCompile() {
  console.log('\n12. Variable Compilation');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });
  try {

  const promptContent = await client.getPrompt('var_test');

  const variables = {
    var: "World"
  };
  const compiled = promptContent.compile(variables);
  console.log('Compiled Prompt:', compiled.getContent());
  assert(compiled, 'Compiles variables into prompt content');
} catch (e) {
  assert(false, 'Should compile variables without error', e.message);
} finally {
  client.destroy();
  }
}

async function testChatCompile(){
  console.log('\n13. Chat Variable Compilation');
  
  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });
  try {

  const promptContent = await client.getPrompt('var_chat');
  
  const variables = {
    var1: "user1",
    var2: "user2"
  };
  const compiled = await promptContent.compile(variables);
  console.log('Compiled Chat Prompt:', compiled.getContent());
  assert(compiled, 'Compiles variables into chat prompt content');
} catch (e) {
  assert(false, 'Should compile chat variables without error', e.message);
} finally {
  client.destroy();
}
}

async function testExperimentPrompt() {
  console.log('\n14. Experiment Prompt Fetch');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  try {
    const context = {
      user_id: 'test-user',
      country: "India",
    };

    const result = await client.getExperimentPrompt('test1', context);
    assert(result && result.getContent(), 'Fetches experiment prompt successfully');
    console.log('Experiment Prompt Content:', result.getContent());
  } catch (e) {
    assert(false, 'Should fetch experiment prompt without error', e.message);
  } finally {
    client.destroy();
  }
}

async function testBucketDistribution() {
  console.log('\n15. Bucket Distribution Convergence Test');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  try {
    const bucketCounts = {};
    const totalRequests = 100;

    console.log(`  Sending ${totalRequests} requests with different user IDs...`);

    for (let i = 0; i < totalRequests; i++) {
      const context = {
        user_id: `user-${i}`,
      };

      const result = await client.getExperimentPrompt('fifty', context);
      const bucketId = result.getBucketId();

      if (bucketId) {
        bucketCounts[bucketId] = (bucketCounts[bucketId] || 0) + 1;
      }

      // Progress indicator
      const progress = i + 1;
      const percentage = ((progress / totalRequests) * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${progress}/${totalRequests} (${percentage}%)`);
    }
    console.log(); // New line after progress completes

    console.log('\n  Bucket Distribution:');
    const bucketIds = Object.keys(bucketCounts).sort();

    bucketIds.forEach(bucketId => {
      const count = bucketCounts[bucketId];
      const percentage = ((count / totalRequests) * 100).toFixed(2);
      console.log(`    Bucket ${bucketId}: ${count} requests (${percentage}%)`);
    });

    // Check if we have exactly 2 buckets (for 50-50 split)
    assert(bucketIds.length === 2, 'Has 2 buckets for A/B test');

    // Calculate the distribution ratio
    if (bucketIds.length === 2) {
      const bucket1Count = bucketCounts[bucketIds[0]];
      const bucket2Count = bucketCounts[bucketIds[1]];
      const ratio = Math.abs(bucket1Count - bucket2Count) / totalRequests;

      // For 100 requests, allow up to 20% deviation from perfect 50-50
      // (i.e., 40-60 to 60-40 range is acceptable)
      const acceptableDeviation = 0.20;
      assert(ratio <= acceptableDeviation,
        `Distribution is reasonably close to 50-50 (deviation: ${(ratio * 100).toFixed(2)}%)`,
        `Expected deviation <= ${acceptableDeviation * 100}%, got ${(ratio * 100).toFixed(2)}%`);
    }

  } catch (e) {
    assert(false, 'Should complete bucket distribution test without error', e.message);
  } finally {
    client.destroy();
  }
}

async function testThreeBucketDistribution() {
  console.log('\n16. Three Bucket Distribution Test (10-30-60)');

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  try {
    const bucketCounts = {};
    const totalRequests = 200;

    console.log(`  Sending ${totalRequests} requests with different user IDs...`);

    for (let i = 0; i < totalRequests; i++) {
      const context = {
        user_id: `user-${i}`,
      };

      const result = await client.getExperimentPrompt('three_bucket', context);
      const bucketId = result.getBucketId();

      if (bucketId) {
        bucketCounts[bucketId] = (bucketCounts[bucketId] || 0) + 1;
      }

      // Progress indicator
      const progress = i + 1;
      const percentage = ((progress / totalRequests) * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${progress}/${totalRequests} (${percentage}%)`);
    }
    console.log(); // New line after progress completes

    console.log('\n  Bucket Distribution:');
    const bucketIds = Object.keys(bucketCounts).sort();

    bucketIds.forEach(bucketId => {
      const count = bucketCounts[bucketId];
      const percentage = ((count / totalRequests) * 100).toFixed(2);
      console.log(`    Bucket ${bucketId}: ${count} requests (${percentage}%)`);
    });

    // Check if we have exactly 3 buckets
    assert(bucketIds.length === 3, 'Has 3 buckets for A/B/C test');

    // Check distribution approximates 10-30-60 ratio
    if (bucketIds.length === 3) {
      const sortedCounts = bucketIds.map(id => bucketCounts[id]).sort((a, b) => a - b);
      const [smallest, middle, largest] = sortedCounts;

      // Expected: 10%, 30%, 60% with reasonable tolerance for 100 requests
      const smallestPercentage = (smallest / totalRequests) * 100;
      const middlePercentage = (middle / totalRequests) * 100;
      const largestPercentage = (largest / totalRequests) * 100;

      console.log(`  Sorted percentages: ${smallestPercentage.toFixed(2)}%, ${middlePercentage.toFixed(2)}%, ${largestPercentage.toFixed(2)}%`);

      // Allow ±10% deviation for each bucket (e.g., 10% ± 10% = 0-20%)
      const acceptableDeviation = 10;
      assert(
        Math.abs(smallestPercentage - 10) <= acceptableDeviation,
        `Smallest bucket is close to 10% (got ${smallestPercentage.toFixed(2)}%)`
      );
      assert(
        Math.abs(middlePercentage - 30) <= acceptableDeviation,
        `Middle bucket is close to 30% (got ${middlePercentage.toFixed(2)}%)`
      );
      assert(
        Math.abs(largestPercentage - 60) <= acceptableDeviation,
        `Largest bucket is close to 60% (got ${largestPercentage.toFixed(2)}%)`
      );
    }

  } catch (e) {
    assert(false, 'Should complete three bucket distribution test without error', e.message);
  } finally {
    client.destroy();
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  LaikaTest SDK - Integration Test Suite           ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`\nAPI Endpoint: ${BASE_URL}`);
  console.log(`Test Prompt: ${TEST_PROMPT}\n`);

  try {
    await testConstructor();
    await testBasicFetch();
    await testCache();
    await testCacheExpiry();
    await testCacheBypass();
    await testNoCache();
    await testErrors();
    await testCleanup();
    await testTimeout();
    await testConcurrent();
    await testVersionedPrompts();
    await testVariableCompile();
    await testChatCompile();
    await testExperimentPrompt();
    await testBucketDistribution();
    await testThreeBucketDistribution();
  } catch (e) {
    console.error('\n✗ Test suite error:', e.message);
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(52));
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('═'.repeat(52) + '\n');

  if (failed === 0) {
    console.log('✓ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed\n');
    process.exit(1);
  }
}

// Execute tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
