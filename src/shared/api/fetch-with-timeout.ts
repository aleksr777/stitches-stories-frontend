import { ApiError } from './api-error';

export const DEFAULT_TIMEOUT_MS = 15_000;

export const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> => {
  const controller = new AbortController();
  const externalSignal = init.signal;
  const abortFromExternal = () => controller.abort(externalSignal?.reason);

  if (externalSignal?.aborted) abortFromExternal();
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true });
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: unknown) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new ApiError(408, 'Request timed out. Please try again.', null);
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
};
