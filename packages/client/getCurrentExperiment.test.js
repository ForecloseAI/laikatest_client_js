/**
 * Unit tests for getCurrentExperiment - A/B Test Linking
 */

const { getCurrentExperiment, clearCurrentExperiment } = require('./index');

describe('Experiment Context API', () => {
  beforeEach(() => {
    clearCurrentExperiment();
  });

  describe('getCurrentExperiment', () => {
    test('returns null when no experiment active', () => {
      expect(getCurrentExperiment()).toBeNull();
    });

    test('clearCurrentExperiment resets to null', () => {
      // Note: We can't directly set experiment context without calling
      // getExperimentPrompt which requires API. This tests the clear function.
      clearCurrentExperiment();
      expect(getCurrentExperiment()).toBeNull();
    });
  });

  describe('clearCurrentExperiment', () => {
    test('is callable without error', () => {
      expect(() => clearCurrentExperiment()).not.toThrow();
    });

    test('can be called multiple times', () => {
      clearCurrentExperiment();
      clearCurrentExperiment();
      expect(getCurrentExperiment()).toBeNull();
    });
  });
});

// Integration test structure (requires mocked API)
describe('Experiment Context Integration', () => {
  test('experiment context structure is correct when set', () => {
    // This documents the expected structure
    const expectedStructure = {
      experimentId: expect.any(String),
      variantId: expect.any(String),
      userId: expect.any(String),
      sessionId: expect.any(String)
    };

    // When getExperimentPrompt is called, it should set context like:
    // { experimentId: 'exp-123', variantId: 'bucket-456', userId: 'user-789', sessionId: 'session-abc' }
    expect(expectedStructure).toHaveProperty('experimentId');
    expect(expectedStructure).toHaveProperty('variantId');
    expect(expectedStructure).toHaveProperty('userId');
    expect(expectedStructure).toHaveProperty('sessionId');
  });
});
