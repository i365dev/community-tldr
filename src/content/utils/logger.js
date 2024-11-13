export const log = {
    info: (...args) => console.log('[TLDR]', ...args),
    error: (...args) => console.error('[TLDR]', ...args),
    warn: (...args) => console.warn('[TLDR]', ...args),
    debug: (...args) => console.debug('[TLDR]', ...args)
};