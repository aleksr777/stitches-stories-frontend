export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getPayloadNumber = (error: unknown, field: string): number | null => {
  if (!(error instanceof ApiError)) return null;
  if (typeof error.payload !== 'object' || error.payload === null) return null;
  if (!(field in error.payload)) return null;

  const value = (error.payload as Record<string, unknown>)[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const getPayloadBoolean = (error: unknown, field: string): boolean | null => {
  if (!(error instanceof ApiError)) return null;
  if (typeof error.payload !== 'object' || error.payload === null) return null;
  if (!(field in error.payload)) return null;

  const value = (error.payload as Record<string, unknown>)[field];
  return typeof value === 'boolean' ? value : null;
};

export const getRetryAfterSeconds = (error: unknown): number | null => {
  const retryAfter = getPayloadNumber(error, 'retry_after');
  return retryAfter === null ? null : Math.max(0, Math.ceil(retryAfter));
};

export const getAttemptsRemaining = (error: unknown): number | null => {
  const attemptsRemaining = getPayloadNumber(error, 'attempts_remaining');
  return attemptsRemaining === null ? null : Math.max(0, Math.floor(attemptsRemaining));
};

export const isVerificationLocked = (error: unknown): boolean => {
  if (getPayloadBoolean(error, 'locked') === true) return true;
  return error instanceof ApiError && error.message.toLowerCase().includes('temporarily locked');
};

export const getErrorMessage = (payload: unknown): string => {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }

  return 'Request failed';
};
