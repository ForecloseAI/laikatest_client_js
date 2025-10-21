// usage-examples.js
// Comprehensive examples for using the LaikaTest Prompts Client

const {
  LaikaTest,
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError
} = require('./index');

// ============================================================================
// EXAMPLE 1: Basic Usage
// ============================================================================

async function example1_basicUsage() {
  console.log('\n=== Example 1: Basic Usage ===\n');

  const client = new LaikaTest(
    'your-api-key-here',
    'your-project-id-here'
  );

  try {
    const result = await client.getPrompt('welcome-message');
    console.log('✓ Prompt fetched successfully');
    console.log('Content:', result.content);
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// EXAMPLE 2: Fetching Specific Version
// ============================================================================

async function example2_specificVersion() {
  console.log('\n=== Example 2: Fetching Specific Version ===\n');

  const client = new LaikaTest(
    process.env.LAIKATEST_API_KEY || 'your-api-key',
    process.env.LAIKATEST_PROJECT_ID || 'your-project-id'
  );

  try {
    // Fetch current version
    const current = await client.getPrompt('greeting-prompt');
    console.log('✓ Current version:', current.content.substring(0, 50) + '...');

    // Fetch specific version
    const specific = await client.getPrompt('greeting-prompt', {
      versionId: 'specific-version-id-here'
    });
    console.log('✓ Specific version:', specific.content.substring(0, 50) + '...');
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// EXAMPLE 3: Comprehensive Error Handling
// ============================================================================

async function example3_errorHandling() {
  console.log('\n=== Example 3: Comprehensive Error Handling ===\n');

  const client = new LaikaTest(
    'your-api-key',
    'your-project-id'
  );

  try {
    const result = await client.getPrompt('my-prompt');
    console.log('✓ Success:', result.content);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('✗ Validation Error:', error.message);
      console.error('  → Check your prompt name and parameters');
    } else if (error instanceof AuthenticationError) {
      console.error('✗ Authentication Error:', error.message);
      console.error('  → Verify your API key is correct');
    } else if (error instanceof NetworkError) {
      console.error('✗ Network Error:', error.message);
      console.error('  → Check your internet connection');
    } else if (error instanceof LaikaServiceError) {
      console.error('✗ Service Error:', error.message);
      console.error('  → Status Code:', error.statusCode);
      if (error.statusCode === 404) {
        console.error('  → Prompt not found in this project');
      } else if (error.statusCode === 403) {
        console.error('  → Access denied to this project');
      }
    } else {
      console.error('✗ Unexpected Error:', error);
    }
  } finally {
    client.destroy();
  }
}

// ============================================================================
// EXAMPLE 4: Custom Configuration
// ============================================================================

async function example4_customConfiguration() {
  console.log('\n=== Example 4: Custom Configuration ===\n');

  const client = new LaikaTest(
    'your-api-key',
    'your-project-id',
    {
      // Custom base URL (e.g., for testing)
      baseUrl: 'http://localhost:3001',

      // Longer timeout for slow connections (15 seconds)
      timeout: 15000,

      // Cache for 1 hour instead of default 30 minutes
      cacheTTL: 60 * 60 * 1000,

      // Keep caching enabled
      cacheEnabled: true
    }
  );

  try {
    const result = await client.getPrompt('test-prompt');
    console.log('✓ Fetched with custom config:', result.content.substring(0, 50));
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// EXAMPLE 5: Cache Behavior Demonstration
// ============================================================================

async function example5_cacheBehavior() {
  console.log('\n=== Example 5: Cache Behavior ===\n');

  const client = new LaikaTest(
    'your-api-key',
    'your-project-id',
    { cacheTTL: 5000 } // 5 seconds for demo
  );

  try {
    console.log('First fetch (from API)...');
    const start1 = Date.now();
    await client.getPrompt('my-prompt');
    console.log(`✓ Took ${Date.now() - start1}ms`);

    console.log('\nSecond fetch (from cache)...');
    const start2 = Date.now();
    await client.getPrompt('my-prompt');
    console.log(`✓ Took ${Date.now() - start2}ms (much faster!)`);

    console.log('\nBypass cache...');
    const start3 = Date.now();
    await client.getPrompt('my-prompt', { bypassCache: true });
    console.log(`✓ Took ${Date.now() - start3}ms (fresh from API)`);
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// EXAMPLE 6: Fallback Pattern
// ============================================================================

// Helper function to get prompt with fallback
async function getPromptWithFallback(client, promptName, fallbackContent) {
  try {
    const result = await client.getPrompt(promptName);
    return result.content;
  } catch (error) {
    console.warn(`Failed to fetch prompt '${promptName}', using fallback`);
    console.warn('Error:', error.message);
    return fallbackContent;
  }
}

async function example6_fallbackPattern() {
  console.log('\n=== Example 6: Fallback Pattern ===\n');

  const client = new LaikaTest(
    'your-api-key',
    'your-project-id'
  );

  try {
    const content = await getPromptWithFallback(
      client,
      'welcome-message',
      'Welcome! This is the default message.'
    );

    console.log('✓ Content to use:', content);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// EXAMPLE 7: Multiple Clients for Different Projects
// ============================================================================

async function example7_multipleClients() {
  console.log('\n=== Example 7: Multiple Clients ===\n');

  const clientA = new LaikaTest('api-key-a', 'project-id-a');
  const clientB = new LaikaTest('api-key-b', 'project-id-b');

  try {
    // Fetch from different projects
    const promptA = await clientA.getPrompt('shared-prompt-name');
    const promptB = await clientB.getPrompt('shared-prompt-name');

    console.log('✓ Project A prompt:', promptA.content.substring(0, 30));
    console.log('✓ Project B prompt:', promptB.content.substring(0, 30));
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    clientA.destroy();
    clientB.destroy();
  }
}

// ============================================================================
// EXAMPLE 8: Disabled Caching
// ============================================================================

async function example8_disabledCaching() {
  console.log('\n=== Example 8: Disabled Caching ===\n');

  const client = new LaikaTest(
    'your-api-key',
    'your-project-id',
    { cacheEnabled: false }
  );

  try {
    console.log('Fetch 1 (always from API)...');
    await client.getPrompt('my-prompt');
    console.log('✓ Fetched');

    console.log('\nFetch 2 (still from API, no cache)...');
    await client.getPrompt('my-prompt');
    console.log('✓ Fetched');
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    client.destroy();
  }
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  LaikaTest Prompts Client - Usage Examples            ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Note: These examples will fail without valid credentials
  // Uncomment the ones you want to try with your actual API key

  // await example1_basicUsage();
  // await example2_specificVersion();
  // await example3_errorHandling();
  // await example4_customConfiguration();
  // await example5_cacheBehavior();
  // await example6_fallbackPattern();
  // await example7_multipleClients();
  // await example8_disabledCaching();

  console.log('\n✓ Examples completed');
  console.log('\nTo run these examples:');
  console.log('1. Set environment variables: LAIKATEST_API_KEY and LAIKATEST_PROJECT_ID');
  console.log('2. Uncomment the examples you want to run in runAllExamples()');
  console.log('3. Run: node usage-examples.js\n');
}

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

// Export for use in other files
module.exports = {
  example1_basicUsage,
  example2_specificVersion,
  example3_errorHandling,
  example4_customConfiguration,
  example5_cacheBehavior,
  example6_fallbackPattern,
  example7_multipleClients,
  example8_disabledCaching,
  getPromptWithFallback
};
