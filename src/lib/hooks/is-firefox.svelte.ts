// Because Firefox is stupid

/** Attempts to determine if a user is using Firefox using `navigator.userAgent`. */
export const isFirefox = navigator.userAgent.includes('Mozilla');
