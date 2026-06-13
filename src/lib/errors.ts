import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Centralized error model. Every layer (services, hooks, UI) speaks in terms of
 * AppError so we render consistent, human-friendly messages and can branch on a
 * stable `code` instead of pattern-matching raw strings.
 */
export type AppErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'network'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  override readonly cause?: unknown;
  readonly details?: string;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown; details?: string }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = options?.cause;
    this.details = options?.details;
  }
}

const POSTGREST_CODE_MAP: Record<string, AppErrorCode> = {
  '23505': 'conflict', // unique_violation
  '23503': 'conflict', // foreign_key_violation
  '23514': 'validation', // check_violation
  '23502': 'validation', // not_null_violation
  '42501': 'forbidden', // insufficient_privilege / RLS
  PGRST301: 'unauthorized',
  PGRST116: 'not_found',
};

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    'details' in error
  );
}

const FRIENDLY: Record<AppErrorCode, string> = {
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have permission to perform this action.",
  not_found: 'The requested record could not be found.',
  conflict: 'This conflicts with existing data. Check for duplicates.',
  validation: 'Some information is invalid. Please review and try again.',
  network: 'Network problem. Check your connection and retry.',
  unknown: 'Something went wrong. Please try again.',
};

/** Normalizes any thrown value into an AppError with a friendly message. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (isPostgrestError(error)) {
    const code = POSTGREST_CODE_MAP[error.code] ?? 'unknown';
    const friendly = error.code === '23505' ? 'A record with these details already exists.' : FRIENDLY[code];
    return new AppError(code, friendly, { cause: error, details: error.details ?? error.message });
  }

  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return new AppError('network', FRIENDLY.network, { cause: error });
  }

  if (error instanceof Error) {
    return new AppError('unknown', error.message || FRIENDLY.unknown, { cause: error });
  }

  return new AppError('unknown', FRIENDLY.unknown, { cause: error });
}

/** Unwraps a Supabase `{ data, error }` response, throwing a typed AppError. */
export function unwrap<T>(response: { data: T; error: PostgrestError | null }): T {
  if (response.error) throw toAppError(response.error);
  return response.data;
}
