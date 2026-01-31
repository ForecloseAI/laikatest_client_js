/**
 * Unit tests for trace helpers - verifies span callback functionality
 */

import { Span, SpanStatusCode } from '@opentelemetry/api';

// Create mock span with all methods we use
const createMockSpan = (): jest.Mocked<Span> => ({
  setAttribute: jest.fn().mockReturnThis(),
  setAttributes: jest.fn().mockReturnThis(),
  addEvent: jest.fn().mockReturnThis(),
  addLink: jest.fn().mockReturnThis(),
  addLinks: jest.fn().mockReturnThis(),
  setStatus: jest.fn().mockReturnThis(),
  updateName: jest.fn().mockReturnThis(),
  end: jest.fn(),
  isRecording: jest.fn().mockReturnValue(true),
  recordException: jest.fn(),
  spanContext: jest.fn().mockReturnValue({
    traceId: 'test-trace-id',
    spanId: 'test-span-id',
    traceFlags: 1,
  }),
});

// Track the callback passed to withSpan
let capturedCallback: ((span: Span) => Promise<any>) | null = null;
let capturedSpanName: string | null = null;

// Mock auto-otel
jest.mock('@laikatest/auto-otel', () => ({
  withSpan: jest.fn().mockImplementation(async (name: string, fn: (span: Span) => Promise<any>) => {
    capturedSpanName = name;
    capturedCallback = fn;
    const mockSpan = createMockSpan();
    return fn(mockSpan);
  }),
}));

import { trace } from './index';
import { traceOperation } from './core';
import { withSpan } from '@laikatest/auto-otel';

describe('traceOperation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallback = null;
    capturedSpanName = null;
  });

  test('creates span with correct name format', async () => {
    await traceOperation('tool', 'calculator', async () => 'result');

    expect(withSpan).toHaveBeenCalledWith('tool.calculator', expect.any(Function));
  });

  test('passes span to callback function', async () => {
    let receivedSpan: Span | null = null;

    await traceOperation('tool', 'test', async (span) => {
      receivedSpan = span;
      return 'result';
    });

    expect(receivedSpan).not.toBeNull();
    expect(receivedSpan!.setAttribute).toBeDefined();
  });

  test('sets semantic attributes on span', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    await traceOperation('agent', 'assistant', async () => 'result');

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('laikatest.operation.type', 'agent');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('laikatest.operation.name', 'assistant');
  });

  test('returns callback result', async () => {
    const result = await traceOperation('step', 'process', async () => {
      return { data: 'test-value' };
    });

    expect(result).toEqual({ data: 'test-value' });
  });

  test('propagates errors from callback', async () => {
    const error = new Error('Test error');

    await expect(
      traceOperation('tool', 'failing', async () => {
        throw error;
      })
    ).rejects.toThrow('Test error');
  });
});

describe('trace.tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with tool. prefix', async () => {
    await trace.tool('calculator', async () => 42);

    expect(withSpan).toHaveBeenCalledWith('tool.calculator', expect.any(Function));
  });

  test('allows setting input/output attributes', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    const input = { a: 5, b: 3 };
    const result = await trace.tool('calculator', async (span) => {
      span.setAttribute('tool.input', JSON.stringify(input));
      const output = input.a + input.b;
      span.setAttribute('tool.output', JSON.stringify(output));
      return output;
    });

    expect(result).toBe(8);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('tool.input', '{"a":5,"b":3}');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('tool.output', '8');
  });

  test('span is accessible throughout callback execution', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    const attributesCalled: string[] = [];
    mockSpan.setAttribute.mockImplementation((key: string) => {
      attributesCalled.push(key);
      return mockSpan;
    });

    await trace.tool('multi-step', async (span) => {
      span.setAttribute('step', 'start');
      await Promise.resolve(); // Simulate async work
      span.setAttribute('step', 'middle');
      await Promise.resolve();
      span.setAttribute('step', 'end');
      return 'done';
    });

    expect(attributesCalled).toContain('step');
    expect(mockSpan.setAttribute).toHaveBeenCalledTimes(5); // 2 semantic + 3 custom
  });
});

describe('trace.agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with agent. prefix', async () => {
    await trace.agent('assistant', async () => 'response');

    expect(withSpan).toHaveBeenCalledWith('agent.assistant', expect.any(Function));
  });

  test('allows setting agent metadata', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    await trace.agent('research', async (span) => {
      span.setAttribute('agent.model', 'gpt-4');
      span.setAttribute('agent.max_iterations', 5);
      return 'completed';
    });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('agent.model', 'gpt-4');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('agent.max_iterations', 5);
  });
});

describe('trace.step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with step. prefix', async () => {
    await trace.step('validation', async () => true);

    expect(withSpan).toHaveBeenCalledWith('step.validation', expect.any(Function));
  });

  test('allows tracking step progress', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    await trace.step('processing', async (span) => {
      span.setAttribute('step.items_processed', 100);
      span.setAttribute('step.success_rate', 0.95);
      return { processed: 100 };
    });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('step.items_processed', 100);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('step.success_rate', 0.95);
  });
});

describe('trace.rag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with rag. prefix', async () => {
    await trace.rag('qa-pipeline', async () => 'answer');

    expect(withSpan).toHaveBeenCalledWith('rag.qa-pipeline', expect.any(Function));
  });

  test('allows tracking RAG metrics', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    await trace.rag('customer-qa', async (span) => {
      span.setAttribute('rag.query', 'What is AI?');
      span.setAttribute('rag.docs_retrieved', 5);
      span.setAttribute('rag.total_tokens', 1500);
      return 'AI is...';
    });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('rag.query', 'What is AI?');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('rag.docs_retrieved', 5);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('rag.total_tokens', 1500);
  });
});

describe('trace.retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with retrieval. prefix', async () => {
    await trace.retrieval('vector-search', async () => []);

    expect(withSpan).toHaveBeenCalledWith('retrieval.vector-search', expect.any(Function));
  });

  test('allows tracking retrieval results', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    const docs = [{ id: '1', score: 0.95 }, { id: '2', score: 0.87 }];
    const result = await trace.retrieval('search', async (span) => {
      span.setAttribute('retrieval.query', 'test query');
      span.setAttribute('retrieval.top_k', 10);
      span.setAttribute('retrieval.results_count', docs.length);
      span.setAttribute('retrieval.max_score', docs[0].score);
      return docs;
    });

    expect(result).toEqual(docs);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('retrieval.results_count', 2);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('retrieval.max_score', 0.95);
  });
});

describe('trace.rerank', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with rerank. prefix', async () => {
    await trace.rerank('relevance', async () => []);

    expect(withSpan).toHaveBeenCalledWith('rerank.relevance', expect.any(Function));
  });

  test('allows tracking rerank metrics', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    await trace.rerank('scoring', async (span) => {
      span.setAttribute('rerank.input_count', 10);
      span.setAttribute('rerank.output_count', 3);
      return [{ id: '1' }, { id: '2' }, { id: '3' }];
    });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('rerank.input_count', 10);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('rerank.output_count', 3);
  });
});

describe('trace.embedding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with embedding. prefix', async () => {
    await trace.embedding('text-embed', async () => [0.1, 0.2, 0.3]);

    expect(withSpan).toHaveBeenCalledWith('embedding.text-embed', expect.any(Function));
  });

  test('allows tracking embedding metrics', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    await trace.embedding('openai', async (span) => {
      span.setAttribute('embedding.model', 'text-embedding-3-small');
      span.setAttribute('embedding.dimensions', 1536);
      span.setAttribute('embedding.input_tokens', 50);
      return [[0.1, 0.2]];
    });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('embedding.model', 'text-embedding-3-small');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('embedding.dimensions', 1536);
  });
});

describe('trace.generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with generation. prefix', async () => {
    await trace.generation('summarize', async () => 'summary');

    expect(withSpan).toHaveBeenCalledWith('generation.summarize', expect.any(Function));
  });

  test('allows tracking LLM generation metrics', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    const response = await trace.generation('chat', async (span) => {
      span.setAttribute('generation.model', 'gpt-4');
      span.setAttribute('generation.prompt_tokens', 100);
      span.setAttribute('generation.completion_tokens', 50);
      span.setAttribute('generation.total_tokens', 150);
      return { content: 'Hello!', usage: { total_tokens: 150 } };
    });

    expect(response).toEqual({ content: 'Hello!', usage: { total_tokens: 150 } });
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('generation.model', 'gpt-4');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('generation.total_tokens', 150);
  });
});

describe('trace.evaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates span with evaluation. prefix', async () => {
    await trace.evaluation('relevance', async () => 0.85);

    expect(withSpan).toHaveBeenCalledWith('evaluation.relevance', expect.any(Function));
  });

  test('allows tracking evaluation results', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    const score = await trace.evaluation('quality-check', async (span) => {
      span.setAttribute('evaluation.type', 'relevance');
      span.setAttribute('evaluation.score', 0.92);
      span.setAttribute('evaluation.threshold', 0.8);
      span.setAttribute('evaluation.passed', true);
      return { score: 0.92, passed: true };
    });

    expect(score).toEqual({ score: 0.92, passed: true });
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('evaluation.score', 0.92);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('evaluation.passed', true);
  });
});

describe('span event support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows adding events to spans', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementationOnce(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    await trace.tool('streaming-tool', async (span) => {
      span.addEvent('chunk_received', { chunk_index: 0, size: 100 });
      span.addEvent('chunk_received', { chunk_index: 1, size: 150 });
      span.addEvent('stream_complete', { total_chunks: 2 });
      return 'streamed result';
    });

    expect(mockSpan.addEvent).toHaveBeenCalledWith('chunk_received', { chunk_index: 0, size: 100 });
    expect(mockSpan.addEvent).toHaveBeenCalledWith('chunk_received', { chunk_index: 1, size: 150 });
    expect(mockSpan.addEvent).toHaveBeenCalledWith('stream_complete', { total_chunks: 2 });
  });
});

describe('nested trace operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('supports nested trace calls', async () => {
    const spanNames: string[] = [];
    (withSpan as jest.Mock).mockImplementation(async (name: string, fn: (span: Span) => Promise<any>) => {
      spanNames.push(name);
      return fn(createMockSpan());
    });

    await trace.agent('assistant', async (agentSpan) => {
      agentSpan.setAttribute('agent.model', 'gpt-4');

      const searchResult = await trace.tool('search', async (toolSpan) => {
        toolSpan.setAttribute('tool.input', 'query');
        return ['result1', 'result2'];
      });

      await trace.step('analyze', async (stepSpan) => {
        stepSpan.setAttribute('step.input_count', searchResult.length);
        return 'analysis complete';
      });

      return 'done';
    });

    expect(spanNames).toContain('agent.assistant');
    expect(spanNames).toContain('tool.search');
    expect(spanNames).toContain('step.analyze');
  });
});

describe('type safety', () => {
  test('callback return type is preserved', async () => {
    const mockSpan = createMockSpan();
    (withSpan as jest.Mock).mockImplementation(async (name: string, fn: (span: Span) => Promise<any>) => {
      return fn(mockSpan);
    });

    // String return type
    const stringResult: string = await trace.tool('string-tool', async () => 'hello');
    expect(typeof stringResult).toBe('string');

    // Number return type
    const numberResult: number = await trace.tool('number-tool', async () => 42);
    expect(typeof numberResult).toBe('number');

    // Object return type
    const objectResult: { id: number; name: string } = await trace.tool('object-tool', async () => ({
      id: 1,
      name: 'test',
    }));
    expect(objectResult).toEqual({ id: 1, name: 'test' });

    // Array return type
    const arrayResult: number[] = await trace.tool('array-tool', async () => [1, 2, 3]);
    expect(arrayResult).toEqual([1, 2, 3]);
  });
});
