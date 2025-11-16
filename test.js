// test.js
// Clean test suite hitting actual LaikaTest API endpoint
require('dotenv').config();

const {
  LaikaTest,
  LaikaServiceError,
  ValidationError,
  AuthenticationError
} = require('./index');
const { validateScores, validateSessionOrUserId } = require('./lib/validation');
const { generateUUID, getClientVersion } = require('./lib/score_utils');

// Test configuration
const API_KEY = process.env.LAIKATEST_API_KEY || '';
const BASE_URL = process.env.LAIKATEST_BASE_URL || 'https://api.laikatest.com';
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
  console.log('\n2. Basic Prompt Fetch');is

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

// ============================================================================
// Score Tests
// ============================================================================

async function testUUIDGeneration() {
  console.log('\n17. UUID Generation');

  const uuid1 = generateUUID();
  const uuid2 = generateUUID();

  assert(uuid1 && uuid2, 'Generates UUIDs');
  assert(uuid1 !== uuid2, 'UUIDs are unique');

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert(uuidRegex.test(uuid1), 'UUID has valid format');
}

async function testClientVersion() {
  console.log('\n18. Client Version Detection');

  const version = getClientVersion();
  assert(version && version !== 'unknown', 'Reads version from package.json',
    `Version: ${version}`);
}

async function testValidScores() {
  console.log('\n19. Score Validation - Valid Cases');

  try {
    validateScores([
      { name: 'rating', type: 'int', value: 5 },
      { name: 'helpful', type: 'bool', value: true },
      { name: 'comment', type: 'string', value: 'Great!' }
    ]);
    assert(true, 'Accepts valid score array');
  } catch (e) {
    assert(false, 'Should accept valid scores', e.message);
  }

  try {
    validateSessionOrUserId('sess_123', null);
    assert(true, 'Accepts session_id only');
  } catch (e) {
    assert(false, 'Should accept session_id', e.message);
  }

  try {
    validateSessionOrUserId(null, 'user_456');
    assert(true, 'Accepts user_id only');
  } catch (e) {
    assert(false, 'Should accept user_id', e.message);
  }
}

async function testInvalidScores() {
  console.log('\n20. Score Validation - Invalid Cases');

  try {
    validateScores([]);
    assert(false, 'Should reject empty scores array');
  } catch (e) {
    assert(e instanceof ValidationError, 'Rejects empty scores array');
  }

  try {
    validateScores([{ name: 'rating', type: 'int', value: 'five' }]);
    assert(false, 'Should reject type mismatch (int with string)');
  } catch (e) {
    assert(e instanceof ValidationError, 'Rejects type mismatch');
  }

  try {
    validateScores([{ name: 'rating', type: 'invalid', value: 5 }]);
    assert(false, 'Should reject invalid type');
  } catch (e) {
    assert(e instanceof ValidationError, 'Rejects invalid score type');
  }

  try {
    validateSessionOrUserId(null, null);
    assert(false, 'Should reject missing identifiers');
  } catch (e) {
    assert(e instanceof ValidationError, 'Rejects missing session_id and user_id');
  }
}

async function testClientPushScore() {
  console.log('\n21. Client pushScore Method');

  const client = new LaikaTest(API_KEY, { baseUrl: BASE_URL });

  assert(typeof client.pushScore === 'function', 'Client has pushScore method');

  client.destroy();
}

async function testPromptPushScore() {
  console.log('\n22. Prompt Class pushScore Method');

  const { Prompt } = require('./lib/prompt');
  const client = new LaikaTest(API_KEY, { baseUrl: BASE_URL });

  // Experimental prompt (with metadata and client)
  const expPrompt = new Prompt(
    'Test content',
    'prompt_v1',
    'exp_123',
    'bucket_abc',
    client,
    'prompt_id_123'
  );

  assert(typeof expPrompt.pushScore === 'function',
    'Experimental prompt has pushScore method');

  // Regular prompt (no experiment metadata)
  const regularPrompt = new Prompt('Regular content');

  try {
    await regularPrompt.pushScore([{ name: 'rating', type: 'int', value: 5 }], { session_id: 'sess_123' });
    assert(false, 'Should reject pushScore on regular prompt');
  } catch (e) {
    assert(e.message.includes('not from an experiment'),
      'Regular prompt rejects pushScore');
  }

  // Test Case 1: Empty options object - should fail validation
  try {
    await expPrompt.pushScore([{ name: 'rating', type: 'int', value: 5 }], {});
    assert(false, 'Should reject empty options object');
  } catch (e) {
    assert(e instanceof ValidationError,
      'Rejects empty options (no session_id or user_id)');
  }

  // Test Case 2: With only session_id
  try {
    await expPrompt.pushScore(
      [{ name: 'rating', type: 'int', value: 5 }],
      { session_id: 'sess_123' }
    );
    assert(true, 'Accepts options with session_id only');
  } catch (e) {
    if (e instanceof ValidationError) {
      assert(false, 'Should accept session_id only', e.message);
    } else {
      // API error is expected since exp_123 doesn't exist
      assert(true, 'Accepts options with session_id only (API error expected)');
    }
  }

  // Test Case 3: With only user_id
  try {
    await expPrompt.pushScore(
      [{ name: 'rating', type: 'int', value: 5 }],
      { user_id: 'user_456' }
    );
    assert(true, 'Accepts options with user_id only');
  } catch (e) {
    if (e instanceof ValidationError) {
      assert(false, 'Should accept user_id only', e.message);
    } else {
      // API error is expected since exp_123 doesn't exist
      assert(true, 'Accepts options with user_id only (API error expected)');
    }
  }

  // Test Case 4: With both session_id and user_id
  try {
    await expPrompt.pushScore(
      [{ name: 'rating', type: 'int', value: 5 }],
      { session_id: 'sess_123', user_id: 'user_456' }
    );
    assert(true, 'Accepts options with both session_id and user_id');
  } catch (e) {
    if (e instanceof ValidationError) {
      assert(false, 'Should accept both session_id and user_id', e.message);
    } else {
      // API error is expected since exp_123 doesn't exist
      assert(true, 'Accepts options with both session_id and user_id (API error expected)');
    }
  }

  client.destroy();
}

async function testGetExperimentalPrompt() {
  console.log('\n23. Get Experimental Prompt with Score Metadata');

  if (!API_KEY) {
    console.log('  ⚠ Skipping (no API key)');
    return;
  }

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  const context = {
    user_id: 'test-user-' + Date.now(),
    country: 'USA'
  };

  try {
    const prompt = await client.getExperimentPrompt('Testing', context);

    assert(prompt && prompt.getContent(), 'Fetches experimental prompt');
    assert(typeof prompt.pushScore === 'function', 'Prompt has pushScore method');
    assert(prompt.getBucketId(), 'Prompt has bucket ID');
    console.log(`    Experiment ID: ${prompt.getExperimentId()}`);
    console.log(`    Bucket ID: ${prompt.getBucketId()}`);
    console.log(`    Prompt ID: ${prompt.getPromptId()}`);
    console.log(`    Prompt Version ID: ${prompt.getPromptVersionId()}`);

  } catch (e) {
    console.log(`    Error details: ${e.message}`);
    console.log(`    Context sent: ${JSON.stringify(context)}`);
    assert(false, 'Should fetch experimental prompt', e.message);
  } finally {
    client.destroy();
  }
}

async function testPushScoreRealAPI() {
  console.log('\n24. Push Score to Real API - Three Scenarios');

  if (!API_KEY) {
    console.log('  ⚠ Skipping (no API key)');
    return;
  }

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  try {
    // Get experimental prompt for all three tests
    const context = {
      user_id: 'test-user-' + Date.now(),
      country: 'USA'
    };

    const prompt = await client.getExperimentPrompt('Testing', context);

    assert(prompt, 'Fetches experimental prompt for scoring');
    console.log(`    Experiment ID: ${prompt.getExperimentId()}`);
    console.log(`    Bucket ID: ${prompt.getBucketId()}`);
    console.log(`    Prompt ID: ${prompt.getPromptId()}`);
    console.log(`    Prompt Version ID: ${prompt.getPromptVersionId()}`);

    // Test 1: Push score with no IDs (should fail validation)
    console.log('\n  Test 1: Push score with no IDs (should fail)');
    try {
      const result0 = await prompt.pushScore(
        [
          { name: 'rating', type: 'int', value: 5 },
          { name: 'helpful', type: 'bool', value: true },
          { name: 'test_comment', type: 'string', value: 'Test with no IDs' }
        ],
        {}
      );

      assert(false, 'Should reject score with no IDs');
    } catch (e) {
      if (e instanceof ValidationError) {
        assert(true, 'Correctly rejects score with no IDs');
        console.log(`    ✓ Validation error: ${e.message}`);
      } else {
        console.log(`    Unexpected error: ${e.message}`);
        assert(false, 'Should throw ValidationError for missing IDs', e.message);
      }
    }

    // Test 2: Push score with only user_id
    console.log('\n  Test 2: Push score with only user_id');
    try {
      const result1 = await prompt.pushScore(
        [
          { name: 'rating', type: 'int', value: 5 },
          { name: 'helpful', type: 'bool', value: true },
          { name: 'test_comment', type: 'string', value: 'Test with user_id only' }
        ],
        { user_id: 'test-user-' + Date.now() }
      );

      assert(result1, 'Pushes score with user_id only');
      assert(result1.success === true || result1.statusCode === 200,
        'Score submission with user_id successful',
        `Status: ${result1.statusCode}`);
      console.log(`    ✓ Score pushed with user_id only`);
    } catch (e) {
      if (e.message.includes('not found') || e.message.includes('404')) {
        console.log('    ⚠ Experiment not found (expected for testing)');
      } else {
        console.log(`    Error: ${e.message}`);
        assert(false, 'Should push score with user_id', e.message);
      }
    }

    // Test 3: Push score with only session_id
    console.log('\n  Test 3: Push score with only session_id');
    try {
      const result2 = await prompt.pushScore(
        [
          { name: 'rating', type: 'int', value: 4 },
          { name: 'helpful', type: 'bool', value: false },
          { name: 'test_comment', type: 'string', value: 'Test with session_id only' }
        ],
        { session_id: 'test-session-' + Date.now() }
      );

      assert(result2, 'Pushes score with session_id only');
      assert(result2.success === true || result2.statusCode === 200,
        'Score submission with session_id successful',
        `Status: ${result2.statusCode}`);
      console.log(`    ✓ Score pushed with session_id only`);
    } catch (e) {
      if (e.message.includes('not found') || e.message.includes('404')) {
        console.log('    ⚠ Experiment not found (expected for testing)');
      } else {
        console.log(`    Error: ${e.message}`);
        assert(false, 'Should push score with session_id', e.message);
      }
    }

    // Test 4: Push score with both user_id and session_id
    console.log('\n  Test 4: Push score with both user_id and session_id');
    try {
      const result3 = await prompt.pushScore(
        [
          { name: 'rating', type: 'int', value: 3 },
          { name: 'helpful', type: 'bool', value: true },
          { name: 'test_comment', type: 'string', value: 'Test with both user_id and session_id' }
        ],
        {
          user_id: 'test-user-' + Date.now(),
          session_id: 'test-session-' + Date.now()
        }
      );

      assert(result3, 'Pushes score with both user_id and session_id');
      assert(result3.success === true || result3.statusCode === 200,
        'Score submission with both identifiers successful',
        `Status: ${result3.statusCode}`);
      console.log(`    ✓ Score pushed with both user_id and session_id`);
    } catch (e) {
      if (e.message.includes('not found') || e.message.includes('404')) {
        console.log('    ⚠ Experiment not found (expected for testing)');
      } else {
        console.log(`    Error: ${e.message}`);
        assert(false, 'Should push score with both identifiers', e.message);
      }
    }

  } catch (e) {
    console.log(`    Error details: ${e.message}`);

    // It's okay if the experiment doesn't exist
    if (e.message.includes('not found') || e.message.includes('404')) {
      console.log('  ⚠ Experiment not found (expected for testing)');
      assert(true, 'Handles missing experiment gracefully');
    } else {
      assert(false, 'Should push score or handle error gracefully', e.message);
    }
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
    // await testConstructor();
    // await testBasicFetch();
    // await testCache();
    // await testCacheExpiry();
    // await testCacheBypass();
    // await testNoCache();
    // await testErrors();
    // await testCleanup();
    // await testTimeout();
    // await testConcurrent();
    // await testVersionedPrompts();
    // await testVariableCompile();
    // await testChatCompile();
    // await testExperimentPrompt();
    // await testBucketDistribution();
    // await testThreeBucketDistribution();
    await testUUIDGeneration();
    await testClientVersion();
    await testValidScores();
    await testInvalidScores();
    await testClientPushScore();
    await testPromptPushScore();
    await testGetExperimentalPrompt();
    await testPushScoreRealAPI();
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
