import { Span } from '@opentelemetry/api';
import { traceOperation } from './core';

/**
 * Trace a RAG (Retrieval-Augmented Generation) pipeline
 * @param name - Pipeline name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const answer = await trace.rag('qa-pipeline', async (span) => {
 *   span.setAttribute('rag.query', query);
 *   const docs = await trace.retrieval('search', (s) => vectorDB.search(query));
 *   const result = await trace.generation('answer', (s) => llm.generate(docs));
 *   span.setAttribute('rag.docs_count', docs.length);
 *   return result;
 * });
 * ```
 */
export async function rag<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('rag', name, fn);
}

/**
 * Trace document retrieval operation
 * @param name - Retrieval step name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const docs = await trace.retrieval('vector-search', async (span) => {
 *   span.setAttribute('retrieval.query', query);
 *   const results = await vectorDB.search(query, { topK: 10 });
 *   span.setAttribute('retrieval.results_count', results.length);
 *   return results;
 * });
 * ```
 */
export async function retrieval<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('retrieval', name, fn);
}

/**
 * Trace document reranking operation
 * @param name - Reranking step name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const reranked = await trace.rerank('relevance', async (span) => {
 *   span.setAttribute('rerank.input_count', docs.length);
 *   const results = await reranker.rerank(docs, query);
 *   span.setAttribute('rerank.output_count', results.length);
 *   return results;
 * });
 * ```
 */
export async function rerank<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('rerank', name, fn);
}

/**
 * Trace embedding generation
 * @param name - Embedding step name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const embeddings = await trace.embedding('text-embed', async (span) => {
 *   span.setAttribute('embedding.model', 'text-embedding-3-small');
 *   span.setAttribute('embedding.input_tokens', tokenCount);
 *   return await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts });
 * });
 * ```
 */
export async function embedding<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('embedding', name, fn);
}
