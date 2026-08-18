/**
 * Helper to determine if an error is explicitly transient.
 */
export const isRetryableError = (error, policy) => {
    if (error.isTimeout) return true;

    if (policy && typeof policy.isRetryable === 'function') {
        return policy.isRetryable(error);
    }

    const code = error.code || error?.cause?.code;
    if (['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EPIPE'].includes(code)) return true;

    const status = error.statusCode || error.status;
    if (status === 429 || status >= 500) return true;

    return false;
};
