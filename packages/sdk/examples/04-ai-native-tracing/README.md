# AI-Native Tracing Demo

This example demonstrates the AI-native semantic tracing API that speaks the language of AI developers.

## What You'll Learn

- How to trace RAG pipelines with semantic helpers
- How to trace agent workflows with tool and step tracking
- How to use generic spans for custom use cases
- How to add custom attributes and events to spans

## Setup

```bash
# Install dependencies
npm install

# Set up environment variables
export LAIKA_API_KEY="your-api-key"
```

## Run the Demo

```bash
npm start
```

## What This Demo Does

The demo runs three different workflows to showcase the tracing API:

### 1. RAG Pipeline

Demonstrates tracing a typical RAG (Retrieval-Augmented Generation) workflow:

```typescript
await trace.rag('customer-qa', async () => {
  const docs = await trace.retrieval('knowledge-base', async () => {
    // Retrieve documents from vector database
  });

  const reranked = await trace.rerank('relevance-scoring', async () => {
    // Rerank documents for relevance
  });

  const answer = await trace.generation('answer-synthesis', async () => {
    // Generate final answer with LLM
  });
});
```

**Span names created:**
- `rag.customer-qa` (parent)
- `retrieval.knowledge-base` (child)
- `rerank.relevance-scoring` (child)
- `generation.answer-synthesis` (child)

### 2. Agent Workflow

Shows how to trace an agent system with planning, tool execution, and analysis:

```typescript
await trace.agent('research-assistant', async () => {
  const plan = await trace.step('planning', async () => {
    // Agent planning phase
  });

  const results = await trace.tool('web-search', async () => {
    // Tool execution
  });

  await trace.step('analysis', async () => {
    // Result analysis
  });
});
```

**Span names created:**
- `agent.research-assistant` (parent)
- `step.planning` (child)
- `tool.web-search` (child)
- `step.analysis` (child)

### 3. Custom Workflow with Generic Spans

Demonstrates using `withSpan` for custom use cases that don't fit the semantic helpers:

```typescript
await withSpan('custom-workflow', async (span) => {
  // Add custom attributes
  span.setAttribute('workflow.type', 'data-processing');
  span.setAttribute('input.size', 1024);

  // Do work...

  // Add events to mark important moments
  span.addEvent('workflow_checkpoint', {
    checkpoint: 'validation_passed',
  });
});
```

## Available Semantic Helpers

### RAG Workflow
- `trace.rag(name, fn)` - RAG pipeline wrapper
- `trace.retrieval(name, fn)` - Document retrieval
- `trace.rerank(name, fn)` - Document reranking
- `trace.embedding(name, fn)` - Embedding generation

### Agent Workflow
- `trace.agent(name, fn)` - Agent wrapper
- `trace.tool(name, fn)` - Tool execution
- `trace.step(name, fn)` - Generic step

### LLM Operations
- `trace.generation(name, fn)` - LLM generation
- `trace.evaluation(name, fn)` - Evaluation

### Generic Span
- `withSpan(name, fn)` - Generic span with full access to OpenTelemetry Span API

## Viewing Traces

After running the demo:

1. Go to [LaikaTest Dashboard](https://laikatest.com)
2. Navigate to the **Tracing** tab
3. Find traces from your service
4. See the hierarchical span structure with semantic naming
5. View custom attributes and events on each span

## Key Concepts

### Semantic Naming

All helpers create spans with semantic names in the format `operation.name`:
- User writes: `trace.rag('customer-qa')`
- Span name: `rag.customer-qa`
- Attributes: `laikatest.operation.type=rag`, `laikatest.operation.name=customer-qa`

### When to Use Each Helper

- **Semantic helpers** (`trace.rag`, `trace.agent`, etc.): Use when your workflow matches a common AI pattern
- **Generic span** (`withSpan`): Use for custom workflows or when you need full control over span attributes and events

### Automatic Context Propagation

All child spans automatically inherit the parent context, creating a proper trace hierarchy without manual context passing.

### Mandatory Shutdown

Always call `laika.shutdown()` before your process exits. This is mandatory to flush all pending traces and clean up resources. Failing to call shutdown may result in lost trace data.
