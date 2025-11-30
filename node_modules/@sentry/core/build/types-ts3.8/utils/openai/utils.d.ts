import { Span } from '../../types-hoist/span';
import { ChatCompletionChunk, InstrumentedMethod, OpenAiChatCompletionObject, OpenAIResponseObject, ResponseStreamingEvent } from './types';
/**
 * Maps OpenAI method paths to Sentry operation names
 */
export declare function getOperationName(methodPath: string): string;
/**
 * Get the span operation for OpenAI methods
 * Following Sentry's convention: "gen_ai.{operation_name}"
 */
export declare function getSpanOperation(methodPath: string): string;
/**
 * Check if a method path should be instrumented
 */
export declare function shouldInstrument(methodPath: string): methodPath is InstrumentedMethod;
/**
 * Build method path from current traversal
 */
export declare function buildMethodPath(currentPath: string, prop: string): string;
/**
 * Check if response is a Chat Completion object
 */
export declare function isChatCompletionResponse(response: unknown): response is OpenAiChatCompletionObject;
/**
 * Check if response is a Responses API object
 */
export declare function isResponsesApiResponse(response: unknown): response is OpenAIResponseObject;
/**
 * Check if streaming event is from the Responses API
 */
export declare function isResponsesApiStreamEvent(event: unknown): event is ResponseStreamingEvent;
/**
 * Check if streaming event is a chat completion chunk
 */
export declare function isChatCompletionChunk(event: unknown): event is ChatCompletionChunk;
/**
 * Set token usage attributes
 * @param span - The span to add attributes to
 * @param promptTokens - The number of prompt tokens
 * @param completionTokens - The number of completion tokens
 * @param totalTokens - The number of total tokens
 */
export declare function setTokenUsageAttributes(span: Span, promptTokens?: number, completionTokens?: number, totalTokens?: number): void;
/**
 * Set common response attributes
 * @param span - The span to add attributes to
 * @param id - The response id
 * @param model - The response model
 * @param timestamp - The response timestamp
 */
export declare function setCommonResponseAttributes(span: Span, id: string, model: string, timestamp: number): void;
//# sourceMappingURL=utils.d.ts.map
