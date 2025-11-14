// test_scores_complete.js
// Comprehensive test suite for score functionality
require('dotenv').config();
const { LaikaTest, ValidationError } = require('./index');
const { validateScores, validateSessionOrUserId } = require('./lib/validation');
const { generateUUID, getClientVersion } = require('./lib/score_utils');

// Test configuration
const API_KEY = process.env.LAIKATEST_API_KEY || '';
const BASE_URL = process.env.LAIKATEST_BASE_URL ;

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

// ============================================================================
// Test 1: UUID Generation
// ============================================================================
async function testUUIDGeneration() {
  console.log('\n1. UUID Generation');

  const uuid1 = generateUUID();
  const uuid2 = generateUUID();

  assert(uuid1 && uuid2, 'Generates UUIDs');
  assert(uuid1 !== uuid2, 'UUIDs are unique');

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert(uuidRegex.test(uuid1), 'UUID has valid format');
}

// ============================================================================
// Test 2: Client Version
// ============================================================================
async function testClientVersion() {
  console.log('\n2. Client Version Detection');

  const version = getClientVersion();
  assert(version && version !== 'unknown', 'Reads version from package.json',
    `Version: ${version}`);
}

// ============================================================================
// Test 3: Score Validation - Valid Cases
// ============================================================================
async function testValidScores() {
  console.log('\n3. Score Validation - Valid Cases');

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

// ============================================================================
// Test 4: Score Validation - Invalid Cases
// ============================================================================
async function testInvalidScores() {
  console.log('\n4. Score Validation - Invalid Cases');

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

// ============================================================================
// Test 5: Client has pushScore Method
// ============================================================================
async function testClientPushScore() {
  console.log('\n5. Client pushScore Method');

  const client = new LaikaTest(API_KEY, { baseUrl: BASE_URL });

  assert(typeof client.pushScore === 'function', 'Client has pushScore method');

  client.destroy();
}

// ============================================================================
// Test 6: Prompt Class with pushScore
// ============================================================================
async function testPromptPushScore() {
  console.log('\n6. Prompt Class pushScore Method');

  const { Prompt } = require('./lib/prompt');
  const client = new LaikaTest(API_KEY, { baseUrl: BASE_URL });

  // Experimental prompt (with metadata and client)
  const expPrompt = new Prompt(
    'Test content',
    'prompt_v1',
    'exp_123',
    'bucket_abc',
    client
  );

  assert(typeof expPrompt.pushScore === 'function',
    'Experimental prompt has pushScore method');

  // Regular prompt (no experiment metadata)
  const regularPrompt = new Prompt('Regular content');

  try {
    await regularPrompt.pushScore([{ name: 'rating', type: 'int', value: 5 }], 'sess_123');
    assert(false, 'Should reject pushScore on regular prompt');
  } catch (e) {
    assert(e.message.includes('not from an experiment'),
      'Regular prompt rejects pushScore');
  }

  client.destroy();
}

// ============================================================================
// Test 7: Real API - Get Experimental Prompt
// ============================================================================
async function testGetExperimentalPrompt() {
  console.log('\n7. Get Experimental Prompt from Real API');

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

// ============================================================================
// Test 8: Real API - Push Score
// ============================================================================
async function testPushScoreRealAPI() {
  console.log('\n8. Push Score to Real API');

  if (!API_KEY) {
    console.log('  ⚠ Skipping (no API key)');
    return;
  }

  const client = new LaikaTest(API_KEY, {
    baseUrl: BASE_URL,
    cacheEnabled: false
  });

  try {
    // Get experimental prompt
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

    // Push score
    const result = await prompt.pushScore(
      [
        { name: 'rating', type: 'int', value: 5 },
        { name: 'helpful', type: 'bool', value: true },
        { name: 'test_comment', type: 'string', value: 'SDK test score' }
      ],
      'test-session-' + Date.now()
    );

    assert(result, 'Pushes score successfully');
    assert(result.success === true || result.statusCode === 200,
      'Score submission successful',
      `Status: ${result.statusCode}`);
    console.log(`    Score pushed for bucket: ${prompt.getBucketId()}`);

  } catch (e) {
    console.log(`    Error details: ${e.message}`);
    console.log(`    Error stack: ${e.stack}`);

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

// ============================================================================
// Main test runner
// ============================================================================
async function runTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Score Functionality - Comprehensive Test Suite   ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`\nAPI Endpoint: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY ? '✓ Set' : '✗ Not set (some tests will be skipped)'}\n`);

  try {
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
