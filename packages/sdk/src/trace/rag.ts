import { traceOperation } from './core';

/**
 * Trace a RAG (Retrieval-Augmented Generation) pipeline
 * @param name - Pipeline name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const answer = await trace.rag('qa-pipeline', async () => {
 *   const docs = await trace.retrieval('search', () => vectorDB.search(query));
 *   return await trace.generation('answer', () => llm.generate(docs));
 * });
 * ```
 */
export async function rag<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('rag', name, fn);
}

/**
 * Trace document retrieval operation
 * @param name - Retrieval step name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 */
export async function retrieval<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('retrieval', name, fn);
}

/**
 * Trace document reranking operation
 * @param name - Reranking step name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 */
export async function rerank<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('rerank', name, fn);
}

/**
 * Trace embedding generation
 * @param name - Embedding step name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 */
export async function embedding<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('embedding', name, fn);
}
