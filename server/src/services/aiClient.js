// ==============================================================================
// APEX PERFORMANCE — GEMINI AI CLIENT SERVICE (PROVIDER INTEGRATION LAYER)
// File Path: server/src/services/aiClient.js
// ==============================================================================

import { GoogleGenAI } from '@google/genai';
import { ApiError } from '../middleware/errorMiddleware.js';

const DEFAULT_TIMEOUT_MS = 10000;

// Lazy singleton: created on first use so dotenv has already loaded server/.env
let aiClient = null;

/**
 * Helper: Validate AI configuration and return the shared Gemini client.
 * Throws a safe 503 if the feature is not configured (never reveals which key is missing).
 */
const getClient = () => {
  const { AI_API_KEY, AI_MODEL } = process.env;

  if (!AI_API_KEY || !AI_MODEL) {
    console.error('[AI Config Error]: AI_API_KEY or AI_MODEL is missing in server/.env');
    throw new ApiError(503, 'The AI assistant is currently unavailable. Please try again later.');
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: AI_API_KEY });
  }

  return aiClient;
};

/**
 * Helper: Resolve the request timeout from env (falls back to 10 seconds).
 */
const getTimeoutMs = () => {
  const parsed = Number.parseInt(process.env.AI_TIMEOUT_MS, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

/**
 * Helper: Translate any provider failure into a safe, generic ApiError.
 * Full details go to the server log only — never to the client response.
 */
const toSafeApiError = (error) => {
  if (error instanceof ApiError) {
    return error;
  }

  const providerStatus = Number(error?.status);
  console.error(
    `[AI Provider Error]: status=${Number.isFinite(providerStatus) ? providerStatus : 'n/a'} | ${
      error?.name || 'Error'
    }`
  );

  // Temporary provider conditions: rate limit/quota (429) or overload (503)
  if (providerStatus === 429 || providerStatus === 503) {
    return new ApiError(503, 'The AI assistant is busy right now. Please try again in a minute.');
  }

  // Provider-side timeout
  if (providerStatus === 504) {
    return new ApiError(504, 'The AI assistant took too long to respond. Please try again.');
  }

  // Bad key, bad model, or other provider failure — our problem, not the user's
  return new ApiError(502, 'The AI assistant could not complete your request. Please try again later.');
};

/**
 * Send a prompt to Gemini and return the parsed JSON object it produces.
 *
 * @param {Object} options
 * @param {string} options.systemInstruction - Trusted rules written by us (the developers)
 * @param {string} options.userContent       - Untrusted user text plus any grounding data
 * @param {Object} options.jsonSchema        - JSON Schema the model's output must follow
 * @returns {Promise<Object>} Parsed JSON object
 */
export const generateStructuredJson = async ({ systemInstruction, userContent, jsonSchema }) => {
  const client = getClient();
  const timeoutMs = getTimeoutMs();

  const controller = new AbortController();
  let timer;

  // A timer that rejects if Gemini takes too long, so a request can never hang forever
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ApiError(504, 'The AI assistant took too long to respond. Please try again.'));
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      client.models.generateContent({
        model: process.env.AI_MODEL,
        contents: userContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: jsonSchema,
          temperature: 0.2, // Low randomness = more consistent, factual output
          abortSignal: controller.signal
        }
      }),
      timeoutPromise
    ]);

    const rawText = response?.text;
    if (!rawText) {
      console.error('[AI Provider Error]: Empty response (possibly blocked by safety filters)');
      throw new ApiError(502, 'The AI assistant could not complete your request. Please try again later.');
    }

    try {
      return JSON.parse(rawText);
    } catch {
      console.error('[AI Provider Error]: Model returned text that is not valid JSON');
      throw new ApiError(502, 'The AI assistant returned an unreadable answer. Please try again.');
    }
  } catch (error) {
    throw toSafeApiError(error);
  } finally {
    clearTimeout(timer);
  }
};