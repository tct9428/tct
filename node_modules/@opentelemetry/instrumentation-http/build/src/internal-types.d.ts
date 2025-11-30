/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import type * as http from 'http';
import type * as https from 'https';
import { get, IncomingMessage, request } from 'http';
import * as url from 'url';
export type IgnoreMatcher = string | RegExp | ((url: string) => boolean);
export type HttpCallback = (res: IncomingMessage) => void;
export type RequestFunction = typeof request;
export type GetFunction = typeof get;
export type HttpCallbackOptional = HttpCallback | undefined;
export type RequestSignature = [http.RequestOptions, HttpCallbackOptional] & HttpCallback;
export type HttpRequestArgs = Array<HttpCallbackOptional | RequestSignature>;
export type ParsedRequestOptions = (http.RequestOptions & Partial<url.UrlWithParsedQuery>) | http.RequestOptions;
export type Http = typeof http;
export type Https = typeof https;
export type Func<T> = (...args: any[]) => T;
export interface Err extends Error {
    errno?: number;
    code?: string;
    path?: string;
    syscall?: string;
    stack?: string;
}
/**
 * Names of possible synthetic test sources.
 */
export declare const SYNTHETIC_TEST_NAMES: string[];
/**
 * Names of possible synthetic bot sources.
 */
export declare const SYNTHETIC_BOT_NAMES: string[];
//# sourceMappingURL=internal-types.d.ts.map